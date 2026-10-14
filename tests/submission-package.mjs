import assert from 'node:assert/strict';
import { chromium } from 'playwright';
import { mkdir, readdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { createHash } from 'node:crypto';

const base = process.env.TEST_BASE_URL || 'http://127.0.0.1:4180';
const projectVersion = JSON.parse(await readFile('package.json', 'utf8')).version;
const edition = process.env.TEST_EDITION || `V${projectVersion.split('.').slice(0, 2).join('.')}`;
const output = 'artifacts/ninety-polish/package';
const results = [];
await mkdir(output, { recursive: true });
const html = await fetch(base).then((r) => r.text());
const asset = /src="([^"]+\.js)"/.exec(html)?.[1];
assert.ok(asset, 'Package must serve the compiled entry');
assert.match((await fetch(new URL(asset, base))).headers.get('content-type'), /javascript/);
assert.equal((await fetch(`${base}/missing-file.js`)).status, 404);
assert.deepEqual(await fetch(`${base}/api/media-status`).then((r) => r.json()), {
  audioAvailable: false,
});
assert.deepEqual(await fetch(`${base}/api/reply-status`).then((r) => r.json()), {
  available: false,
});
assert.equal((await fetch(`${base}/api/deepseek-reply`, { method: 'POST' })).status, 405);
assert.equal((await fetch(`${base}/%2e%2e%5cpackage.json`)).status, 404);
const filmResponse = await fetch(`${base}/media/lantern-night.webm`);
assert.equal(filmResponse.status, 200);
assert.match(filmResponse.headers.get('content-type'), /^video\/webm/);
const filmBytes = Buffer.from(await filmResponse.arrayBuffer());
for (const [range, start, end] of [
  ['bytes=0-99', 0, 99],
  ['bytes=100-', 100, filmBytes.length - 1],
  ['bytes=-100', filmBytes.length - 100, filmBytes.length - 1],
]) {
  const response = await fetch(`${base}/media/lantern-night.webm`, { headers: { Range: range } });
  assert.equal(response.status, 206);
  assert.equal(response.headers.get('content-range'), `bytes ${start}-${end}/${filmBytes.length}`);
  assert.deepEqual(Buffer.from(await response.arrayBuffer()), filmBytes.subarray(start, end + 1));
}
const unsatisfied = await fetch(`${base}/media/lantern-night.webm`, {
  headers: { Range: `bytes=${filmBytes.length}-` },
});
assert.equal(unsatisfied.status, 416);
assert.equal(unsatisfied.headers.get('content-range'), `bytes */${filmBytes.length}`);
const head = await fetch(`${base}/media/lantern-night.webm`, {
  method: 'HEAD',
  headers: { Range: 'bytes=0-99' },
});
assert.equal(head.status, 200);
assert.equal(Number(head.headers.get('content-length')), filmBytes.length);
results.push({
  nativeVideoMime: true,
  byteRanges: true,
  unsatisfiedRange: 416,
  headRangeIgnored: true,
});

const browser = await chromium.launch({
  executablePath: 'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',
  args: ['--enable-unsafe-swiftshader', '--no-first-run'],
});
try {
  for (const width of [390, 1440]) {
    const page = await browser.newPage({ viewport: { width, height: 900 }, reducedMotion: 'no-preference' });
    const errors = [];
    const failedLocal = [];
    page.on('pageerror', (e) => errors.push(e.message));
    page.on('response', (r) => {
      if (r.url().startsWith(base) && r.status() >= 400) failedLocal.push(r.url());
    });
    await page.route('**/*', (route) =>
      route.request().url().startsWith(base) ? route.continue() : route.abort(),
    );
    await page.goto(base, { waitUntil: 'domcontentloaded' });
    assert.ok((await page.locator('.site-footer').innerText()).includes(edition));
    await page.locator('.overture-shortcuts a[href="#craft"]').click();
    await page.getByRole('button', { name: '扎起这一圈竹篾 ↗' }).waitFor();
    await page.locator('#viral-burst').evaluate(node => scrollTo({ top: node.getBoundingClientRect().top + scrollY - 100, behavior: 'instant' }));
    await page.waitForFunction(
      () => document.querySelector('#viral-burst video')?.currentTime > 0.1,
    );
    assert.equal(await page.locator('#viral-burst iframe').count(), 0);
    assert.equal(await page.locator('#viral-burst audio').count(), 0);
    assert.equal(await page.locator('.swarm-avatar img').count(), width < 600 ? 66 : 132);
    await page.locator('.method-annex > summary').click();
    await page.locator('.coverage-annex > summary').click();
    assert.equal(await page.locator('.coding-protocol dt').count(), 4);
    assert.equal(await page.locator('.coverage-row:not(.coverage-head)').count(), 10);
    await page
      .locator('#evidence-method')
      .getByRole('button', { name: '同批追踪', exact: true })
      .click();
    await page.locator('.coverage-empty').waitFor({ state: 'visible' });
    await page.locator('.ai-annex > summary').click();
    await page.locator('#future-letter-input').fill('过了一季，是否还在学习？');
    assert.equal(
      await page.getByRole('button', { name: '发送问题', exact: true }).isEnabled(),
      true,
    );
    const [card] = await Promise.all([
      page.waitForEvent('download'),
      page.getByRole('button', { name: '下载回访问题卡' }).click(),
    ]);
    assert.match(await readFile(await card.path(), 'utf8'), /过了一季，是否还在学习？/);
    assert.equal(await card.failure(), null);
    assert.equal(
      await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth),
      true,
    );
    assert.deepEqual(errors, []);
    assert.deepEqual(failedLocal, []);
    await page.locator('.coverage-overview').screenshot({ path: `${output}/${width}-method.png` });
    await page.locator('#history').screenshot({ path: `${output}/${width}-findings.png` });
    results.push({ width, externalNetworkBlocked: true, errors, failedLocal });
    await page.close();
  }
} finally {
  await browser.close();
}

const bundleRoot = process.env.DELIVERY_ROOT || path.resolve('../交付文件/网站交付', edition);
if (process.env.CHECK_DELIVERY_FILES === '1') {
  const manifest = JSON.parse(await readFile(path.join(bundleRoot, '文件清单.json'), 'utf8'));
  for (const file of manifest.files) {
    assert.ok(!/(^|\/)(node_modules|\.versions|\.env\.local|\.git|原始)(\/|$)/.test(file.path));
    const bytes = await readFile(path.join(bundleRoot, file.path));
    assert.equal(createHash('sha256').update(bytes).digest('hex'), file.sha256, file.path);
    assert.equal(bytes.length, file.bytes);
  }
  const avatarTotal = (await readdir('public/avatars/observers-web')).filter((name) =>
    /^observer-\d+\.jpg$/.test(name),
  ).length;
  assert.equal(
    manifest.files.filter((f) => /_成品\/site\/avatars\/.+\.jpg$/.test(f.path)).length,
    avatarTotal,
  );
  results.push({ deliveryFiles: manifest.files.length, hashesVerified: true });
}
await writeFile(`${output}/package-results.json`, JSON.stringify(results, null, 2));
console.log(JSON.stringify(results, null, 2));
