import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';

const bundle = path.resolve(process.argv[2] || '../交付文件/网站交付/V1.2-交付版');
const manifest = JSON.parse(await readFile(path.join(bundle, '文件清单.json'), 'utf8'));
const extracted = path.resolve('artifacts/ninety-polish', `extracted-${Date.now()}`);
await mkdir(extracted);
const folders = [...new Set(manifest.files.map((file) => file.path.split('/')[0]))];
const quote = (value) => "'" + value.replaceAll("'", "''") + "'";
for (const folder of folders) {
  execFileSync('powershell.exe', [
    '-NoProfile',
    '-Command',
    `Expand-Archive -LiteralPath ${quote(path.join(bundle, folder + '.zip'))} -DestinationPath ${quote(extracted)}`,
  ]);
}
for (const file of manifest.files) {
  const bytes = await readFile(path.join(extracted, file.path));
  assert.equal(bytes.length, file.bytes, file.path);
  assert.equal(createHash('sha256').update(bytes).digest('hex'), file.sha256, file.path);
}
const sourceFolder = folders.find((folder) => folder.endsWith('_源码'));
const productFolder = folders.find((folder) => folder.endsWith('_成品'));
assert.ok(sourceFolder && productFolder);
const evidence = JSON.parse(
  await readFile(path.join(extracted, sourceFolder, 'src/content/public-evidence.json'), 'utf8'),
);
assert.equal(evidence.measures.length, 17);
assert.equal(evidence.coverage.length, 10);
assert.equal(evidence.retention.value, null);
const csvRows = {};
for (const [filename, expected] of [
  ['核对用_证据记录.csv', 17],
  ['核对用_来源片段编码.csv', 10],
  ['核对用_采集指标台账.csv', 94],
  ['核对用_线索笔记.csv', 30],
]) {
  const csv = await readFile(path.join(extracted, productFolder, filename), 'utf8');
  let quoted = false;
  let rows = 0;
  for (let index = 0; index < csv.length; index++) {
    if (csv[index] === '"') {
      if (quoted && csv[index + 1] === '"') index++;
      else quoted = !quoted;
    } else if (!quoted && csv[index] === '\n') rows++;
  }
  assert.equal(rows - 1, expected, filename);
  csvRows[filename] = expected;
}
const result = {
  edition: manifest.edition,
  extracted,
  siteRoot: path.join(extracted, productFolder, 'site'),
  previewScript: path.join(extracted, productFolder, 'preview.ps1'),
  files: manifest.files.length,
  zipHashesMatchManifest: true,
  csvRows,
  retentionUnknown: true,
};
await writeFile('artifacts/ninety-polish/archive-results.json', JSON.stringify(result, null, 2));
console.log(JSON.stringify(result, null, 2));
