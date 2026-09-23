import { readdir, mkdir, readFile, writeFile, lstat, realpath } from 'node:fs/promises';
import { createHash, randomBytes } from 'node:crypto';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const excluded = new Set([
  'node_modules',
  '.git',
  'dist',
  '.vite',
  '.versions',
  '.recoveries',
  '.npm-cache',
  'artifacts',
]);
const digest = (buffer) => createHash('sha256').update(buffer).digest('hex');
const stamp = () =>
  new Date()
    .toISOString()
    .replace(/[-:]/g, '')
    .replace(/\.\d{3}Z$/, 'Z');
const unique = () => randomBytes(3).toString('hex');

function inside(root, file) {
  const relative = path.relative(root, file);
  return relative !== '' && !relative.startsWith('..') && !path.isAbsolute(relative);
}
function safeId(id) {
  if (typeof id !== 'string' || !/^[\p{L}\p{N}_-]+$/u.test(id))
    throw new Error('版本编号无效。请从 npm run versions 列表中选择。');
  return id;
}
function safeFile(root, relative) {
  if (
    typeof relative !== 'string' ||
    relative.includes('\\') ||
    relative.includes(':') ||
    relative.startsWith('/') ||
    relative.split('/').some((x) => !x || x === '.' || x === '..')
  )
    throw new Error(`不安全的路径：${relative}`);
  const destination = path.resolve(root, relative);
  if (!inside(root, destination)) throw new Error(`不安全的路径：${relative}`);
  return destination;
}
async function ensurePlainDirectory(directory) {
  await mkdir(directory, { recursive: true });
  const info = await lstat(directory);
  if (!info.isDirectory() || info.isSymbolicLink()) throw new Error(`目录不能是链接：${directory}`);
  return realpath(directory);
}
async function collect(root, current = root) {
  const result = [];
  for (const entry of (await readdir(current, { withFileTypes: true })).sort((a, b) =>
    a.name.localeCompare(b.name),
  )) {
    if (
      excluded.has(entry.name) ||
      entry.name.endsWith('.tsbuildinfo') ||
      entry.name.endsWith('.log')
    )
      continue;
    const absolute = path.join(current, entry.name);
    if (entry.isSymbolicLink()) throw new Error(`备份不跟随链接：${absolute}`);
    if (entry.isDirectory()) result.push(...(await collect(root, absolute)));
    else if (entry.isFile())
      result.push({ absolute, relative: path.relative(root, absolute).split(path.sep).join('/') });
  }
  return result;
}

export async function saveVersion(projectRoot, label = 'manual') {
  const root = await realpath(projectRoot);
  const store = path.join(root, '.versions');
  await ensurePlainDirectory(store);
  const cleanLabel =
    String(label)
      .replace(/[^\p{L}\p{N}_-]/gu, '-')
      .slice(0, 55) || 'manual';
  const id = `${stamp()}-${cleanLabel}-${unique()}`;
  const snapshot = path.join(store, id);
  if (!inside(store, snapshot)) throw new Error('备份路径越界。');
  await mkdir(snapshot);
  const filesRoot = path.join(snapshot, 'files');
  await mkdir(filesRoot);
  const files = [];
  for (const entry of await collect(root)) {
    const data = await readFile(entry.absolute);
    const destination = safeFile(filesRoot, entry.relative);
    await mkdir(path.dirname(destination), { recursive: true });
    await writeFile(destination, data, { flag: 'wx' });
    files.push({ path: entry.relative, bytes: data.length, sha256: digest(data) });
  }
  if (!files.length) throw new Error('没有可备份的项目文件。');
  const manifest = { format: 1, id, label: cleanLabel, createdAt: new Date().toISOString(), files };
  // Manifest is the completion record and is written only after all file writes.
  // No directory rename: Windows preview watchers may hold directories open.
  await writeFile(path.join(snapshot, 'manifest.json'), JSON.stringify(manifest, null, 2), {
    flag: 'wx',
  });
  return manifest;
}

export async function listVersions(projectRoot) {
  const store = path.join(await realpath(projectRoot), '.versions');
  let entries;
  try {
    entries = await readdir(store, { withFileTypes: true });
  } catch (error) {
    if (error.code === 'ENOENT') return [];
    throw error;
  }
  const result = [];
  for (const entry of entries) {
    if (!entry.isDirectory() || entry.name.startsWith('.')) continue;
    try {
      const manifest = JSON.parse(
        await readFile(path.join(store, safeId(entry.name), 'manifest.json'), 'utf8'),
      );
      result.push({
        id: entry.name,
        label: manifest.label,
        createdAt: manifest.createdAt,
        count: manifest.files.length,
      });
    } catch (error) {
      if (error.code !== 'ENOENT')
        result.push({ id: entry.name, label: '清单损坏，请勿使用', createdAt: '', count: 0 });
    }
  }
  return result.sort((a, b) => b.id.localeCompare(a.id));
}

export async function verifyVersion(projectRoot, id) {
  safeId(id);
  const root = await realpath(projectRoot);
  const store = path.join(root, '.versions');
  const snapshot = path.join(store, id);
  const actualSnapshot = await realpath(snapshot);
  if (!inside(store, actualSnapshot) || actualSnapshot !== snapshot)
    throw new Error('不安全的路径：备份目录不可重定向。');
  const manifest = JSON.parse(await readFile(path.join(snapshot, 'manifest.json'), 'utf8'));
  if (
    manifest.format !== 1 ||
    manifest.id !== id ||
    !Array.isArray(manifest.files) ||
    !manifest.files.length
  )
    throw new Error('备份清单格式无效。');
  const fileRoot = path.join(snapshot, 'files');
  const paths = new Set();
  for (const file of manifest.files) {
    const absolute = safeFile(fileRoot, file.path);
    const folded = file.path.toLocaleLowerCase();
    if (paths.has(folded)) throw new Error(`重复路径：${file.path}`);
    paths.add(folded);
    const actual = await realpath(absolute);
    if (!inside(fileRoot, actual) || actual !== absolute)
      throw new Error(`不安全的路径：${file.path}`);
    const data = await readFile(absolute);
    if (digest(data) !== file.sha256 || data.length !== file.bytes)
      throw new Error(`校验失败：${file.path}。原项目未被改动。`);
  }
  return manifest;
}

export async function restoreVersion(projectRoot, id) {
  const root = await realpath(projectRoot);
  const manifest = await verifyVersion(root, id);
  const safety = await saveVersion(root, 'before-restore');
  const recoveries = path.join(root, '.recoveries');
  await ensurePlainDirectory(recoveries);
  const target = path.join(recoveries, `${id}-restored-${unique()}`);
  if (!inside(root, target)) throw new Error('恢复目标必须在本项目目录内。');
  await mkdir(target); // No recursive/existing target: never merge into a previous restore.
  for (const file of manifest.files) {
    const destination = safeFile(target, file.path);
    const data = await readFile(safeFile(path.join(root, '.versions', id, 'files'), file.path));
    if (digest(data) !== file.sha256)
      throw new Error('校验失败：备份在恢复期间发生变化。当前项目未被覆盖。');
    await mkdir(path.dirname(destination), { recursive: true });
    await writeFile(destination, data, { flag: 'wx' });
  }
  return { target, safetyVersion: safety.id, restoredVersion: id, count: manifest.files.length };
}

const scriptPath = fileURLToPath(import.meta.url);
if (process.argv[1] && path.resolve(process.argv[1]) === scriptPath) {
  const root = path.resolve(path.dirname(scriptPath), '..');
  const [command, argument] = process.argv.slice(2);
  try {
    if (command === 'save') {
      const result = await saveVersion(root, argument);
      console.log(
        `已备份 ${result.files.length} 个文件。\n版本：${result.id}\n位置：${path.join(root, '.versions', result.id)}`,
      );
    } else if (command === 'list') {
      const versions = await listVersions(root);
      console.log(
        versions.length
          ? versions.map((v) => `${v.id}  |  ${v.count} files  |  ${v.createdAt}`).join('\n')
          : '尚无快照。运行 npm run backup 创建。',
      );
    } else if (command === 'verify') {
      const result = await verifyVersion(root, argument);
      console.log(`校验通过：${result.id}，共 ${result.files.length} 个文件。`);
    } else if (command === 'restore') {
      const result = await restoreVersion(root, argument);
      console.log(
        `已恢复 ${result.count} 个文件到独立目录：\n${result.target}\n当前工作没有被覆盖；恢复前快照：${result.safetyVersion}\n在恢复目录运行 npm ci，再运行 npm run dev -- --port 5174 即可比较旧版。`,
      );
    } else
      throw new Error(
        '用法：node scripts/versions.mjs save [标签] | list | verify 版本编号 | restore 版本编号',
      );
  } catch (error) {
    console.error(error.message);
    process.exitCode = 1;
  }
}
