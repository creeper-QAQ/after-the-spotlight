import assert from 'node:assert/strict';
import { createServer } from 'node:http';
import { readFile, mkdir } from 'node:fs/promises';
import path from 'node:path';
import { chromium } from 'playwright';

const root = path.resolve('dist');
const prefix = '/after-the-spotlight/';
const mime = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.svg': 'image/svg+xml', '.jpg': 'image/jpeg', '.webm': 'video/webm', '.geojson': 'application/json' };
const server = createServer(async (request, response) => {
  try {
    const url = new URL(request.url, 'http://localhost');
    if (!url.pathname.startsWith(prefix)) throw new Error('Outside project path');
    let relative = decodeURIComponent(url.pathname.slice(prefix.length));
    if (!relative || relative.endsWith('/')) relative += 'index.html';
    const file = path.resolve(root, relative);
    if (!file.startsWith(root + path.sep)) throw new Error('Outside build');
    const bytes = await readFile(file);
    response.writeHead(200, { 'Content-Type': mime[path.extname(file)] || 'application/octet-stream' }).end(bytes);
  } catch { response.writeHead(404).end(); }
});
await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
const base = `http://127.0.0.1:${server.address().port}${prefix}`;
await mkdir('artifacts/version-switch', { recursive: true });
const browser = await chromium.launch({ executablePath: 'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe', args: ['--enable-unsafe-swiftshader', '--no-first-run'] });
try {
  for (const width of [320, 390, 1440]) {
    const page = await browser.newPage({ viewport: { width, height: 900 }, reducedMotion: 'reduce' });
    const errors = [];
    page.on('pageerror', (error) => errors.push(error.message));
    page.on('response', (response) => {
      if (response.url().startsWith(base) && response.status() >= 400) errors.push(`${response.status()} ${response.url()}`);
    });
    await page.goto(base, { waitUntil: 'networkidle' });
    const editions = [
      { id: 'current', label: /最新版.*V1\.4\.1/, next: { path: 'v1.4/', link: '上一版 · V1.4' } },
      { id: 'v14', label: /上一版.*V1\.4/, next: { path: 'legacy/', link: '旧版 · V1.3' } },
      { id: 'legacy', label: /旧版.*V1\.3/, next: { path: '', link: '最新版 · V1.4.1' } },
    ];
    for (const edition of editions) {
      const selector = page.locator('#website-versions');
      await selector.waitFor();
      await selector.locator('summary').click();
      const current = selector.locator('[aria-current="page"]');
      assert.match(await current.innerText(), edition.label);
      for (const target of [selector.locator('summary'), ...await selector.locator('a').all()]) {
        const box = await target.boundingBox();
        assert.ok(box.width >= 44 && box.height >= 44, 'Touch targets are at least 44px');
        assert.ok(box.x >= 0 && box.x + box.width <= width, 'Version controls stay in viewport');
      }
      assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), 'No horizontal overflow');
      assert.equal(await page.locator('.readable-section').count(), edition.id === 'legacy' ? 0 : 4, 'Versions serve distinct story layouts');
      await page.screenshot({ path: `artifacts/version-switch/${edition.id}-${width}.png` });
      await page.keyboard.press('Escape');
      assert.equal(await selector.evaluate((node) => node.open), false);
      await page.keyboard.press('Enter');
      assert.equal(await selector.evaluate((node) => node.open), true);
      const target = selector.getByRole('link', { name: edition.next.link, exact: true });
      await target.click();
      await page.waitForURL(`${base}${edition.next.path}`);
      await page.waitForLoadState('networkidle');
    }
    assert.deepEqual(errors, [], 'Both versions load without runtime errors or missing local resources');
    await page.close();
    console.log(`PASS ${width}px: V1.4.1 → V1.4 → V1.3 → V1.4.1, keyboard, layout, and all project-path assets`);
  }
} finally { await browser.close(); await new Promise((resolve) => server.close(resolve)); }
