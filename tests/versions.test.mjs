import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, mkdir, writeFile, readFile, readdir } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { saveVersion, listVersions, restoreVersion, verifyVersion } from '../scripts/versions.mjs';

const base = fileURLToPath(new URL('../artifacts/version-tests/', import.meta.url));
await mkdir(base, { recursive: true });
async function fixture() {
  const root = await mkdtemp(path.join(base, 'project-'));
  await mkdir(path.join(root, 'src'));
  await writeFile(path.join(root, 'src', '中文.txt'), '初版内容\n');
  await writeFile(path.join(root, 'package.json'), '{"version":"0.1.0"}');
  await mkdir(path.join(root, 'node_modules'));
  await writeFile(path.join(root, 'node_modules', 'excluded.txt'), 'dependency');
  return root;
}

test('snapshot and isolated restore preserve old files and current edits, with a safety snapshot', async () => {
  const root = await fixture();
  const saved = await saveVersion(root, 'first');
  assert.equal(saved.files.length, 2);
  await writeFile(path.join(root, 'src', '中文.txt'), '新修改，必须保留\n');
  const restored = await restoreVersion(root, saved.id);
  assert.equal(await readFile(path.join(restored.target, 'src', '中文.txt'), 'utf8'), '初版内容\n');
  assert.equal(await readFile(path.join(root, 'src', '中文.txt'), 'utf8'), '新修改，必须保留\n');
  const versions = await listVersions(root);
  assert.equal(versions.length, 2);
  assert.ok(restored.safetyVersion);
  assert.equal((await verifyVersion(root, saved.id)).files.length, 2);
  assert.deepEqual((await readdir(restored.target)).sort(), ['package.json', 'src']);
});

test('corrupted backup is refused before a restore folder is created', async () => {
  const root = await fixture();
  const saved = await saveVersion(root, 'corruption');
  await writeFile(path.join(root, '.versions', saved.id, 'files', 'src', '中文.txt'), 'tampered');
  await assert.rejects(restoreVersion(root, saved.id), /校验失败/);
  await assert.rejects(readdir(path.join(root, '.recoveries')), /ENOENT/);
});

test('path traversal in version id or manifest is refused', async () => {
  const root = await fixture();
  await assert.rejects(restoreVersion(root, '../outside'), /版本编号/);
  const saved = await saveVersion(root, 'unsafe');
  const manifestPath = path.join(root, '.versions', saved.id, 'manifest.json');
  const manifest = JSON.parse(await readFile(manifestPath, 'utf8'));
  manifest.files[0].path = '../outside.txt';
  await writeFile(manifestPath, JSON.stringify(manifest));
  await assert.rejects(restoreVersion(root, saved.id), /不安全的路径/);
});

test('duplicate paths in a manifest are refused', async () => {
  const root = await fixture();
  const saved = await saveVersion(root, 'duplicate');
  const manifestPath = path.join(root, '.versions', saved.id, 'manifest.json');
  const manifest = JSON.parse(await readFile(manifestPath, 'utf8'));
  manifest.files.push(manifest.files[0]);
  await writeFile(manifestPath, JSON.stringify(manifest));
  await assert.rejects(verifyVersion(root, saved.id), /重复路径/);
});

test('unfinished snapshot is not listed as a usable version', async () => {
  const root = await fixture();
  await mkdir(path.join(root, '.versions', 'unfinished', 'files'), { recursive: true });
  assert.equal((await listVersions(root)).length, 0);
  await assert.rejects(restoreVersion(root, 'unfinished'));
});
