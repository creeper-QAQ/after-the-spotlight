import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright';
import { mkdir, writeFile } from 'node:fs/promises';
import assert from 'node:assert/strict';

const out = new URL('../artifacts/', import.meta.url);
await mkdir(out, { recursive: true });
const browser = await chromium.launch({
  executablePath:
    process.env.BROWSER_PATH || 'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',
  headless: true,
  args: ['--enable-unsafe-swiftshader', '--no-first-run', '--disable-background-networking'],
});
const errors = [];
const page = await browser.newPage({
  viewport: { width: 1440, height: 1000 },
  deviceScaleFactor: 1,
});
page.on('pageerror', (error) => errors.push(error.message));
const url = process.env.PREVIEW_URL || 'http://127.0.0.1:5173';
await page.goto(url, { waitUntil: 'networkidle' });
await page.waitForSelector('.hero-model[data-status="ready"]', { timeout: 30000 });
await page.screenshot({ path: fileURLToPath(new URL('desktop-hero.png', out)) });
await page.screenshot({ path: fileURLToPath(new URL('desktop-full.png', out)), fullPage: true });
assert.equal(await page.locator('h1').count(), 1);
assert.equal(await page.locator('section[id]').count(), 5);
await page.getByRole('button', { name: '按地区', exact: true }).click();
assert.equal(
  await page.getByRole('button', { name: '按地区', exact: true }).getAttribute('aria-pressed'),
  'true',
);
assert.match(await page.locator('.dot-chart').getAttribute('aria-label'), /按地区/);
await page.getByRole('button', { name: '数据口径与来源' }).click();
assert.equal(await page.locator('.source-dialog').evaluate((el) => el.open), true);
await page.keyboard.press('Escape');
assert.equal(await page.locator('.source-dialog').evaluate((el) => el.open), false);
assert.match(await page.locator(':focus').innerText(), /数据口径与来源/);
await page.getByRole('button', { name: '展开结构', exact: true }).click();
assert.equal(
  await page.getByRole('button', { name: '合拢结构', exact: true }).getAttribute('aria-pressed'),
  'true',
);
await page.getByRole('button', { name: '徽墨02', exact: true }).click();
await page.waitForSelector('.craft-exhibit [data-model="ink"][data-status="ready"]');
assert.match(await page.locator('.craft-narrative h3').innerText(), /一方墨/);
await page.locator('#craft').screenshot({ path: fileURLToPath(new URL('desktop-ink.png', out)) });
await page.getByRole('button', { name: '阅读设置', exact: true }).click();
await page.getByRole('button', { name: '夜读', exact: true }).click();
assert.equal(await page.locator('html').getAttribute('data-theme'), 'night');
await page.getByRole('button', { name: '减少动态', exact: true }).click();
assert.equal(await page.locator('html').getAttribute('data-motion'), 'off');
await page.getByRole('button', { name: '关闭阅读设置' }).click();
await page.reload({ waitUntil: 'networkidle' });
assert.equal(await page.locator('html').getAttribute('data-theme'), 'night');
assert.equal(await page.locator('html').getAttribute('data-motion'), 'off');
await page.screenshot({ path: fileURLToPath(new URL('desktop-night.png', out)) });

const mobile = await browser.newPage({
  viewport: { width: 390, height: 844 },
  deviceScaleFactor: 1,
  isMobile: true,
  hasTouch: true,
  reducedMotion: 'reduce',
});
mobile.on('pageerror', (error) => errors.push(error.message));
await mobile.goto(url, { waitUntil: 'networkidle' });
await mobile.waitForSelector('.hero-model[data-status="ready"]');
assert.equal(await mobile.locator('html').getAttribute('data-motion'), 'off');
assert.equal(
  await mobile.evaluate(() => document.documentElement.scrollWidth <= innerWidth),
  true,
  'mobile horizontal overflow',
);
await mobile.screenshot({ path: fileURLToPath(new URL('mobile-hero.png', out)) });
await mobile.screenshot({ path: fileURLToPath(new URL('mobile-full.png', out)), fullPage: true });
await mobile.getByRole('button', { name: '打开目录' }).click();
await mobile.getByRole('navigation').getByRole('link', { name: '02走近手艺' }).click();
assert.equal(await mobile.locator('#menu-button').getAttribute('aria-expanded'), 'false');
assert.match(mobile.url(), /#craft$/);
await mobile.getByRole('button', { name: '展开结构', exact: true }).click();
assert.equal(await mobile.getByRole('button', { name: '合拢结构', exact: true }).count(), 1);
await mobile
  .locator('#craft')
  .screenshot({ path: fileURLToPath(new URL('mobile-exploded.png', out)) });
for (const width of [320, 768, 1024, 1920]) {
  await mobile.setViewportSize({ width, height: 900 });
  await mobile.waitForTimeout(100);
  assert.equal(
    await mobile.evaluate(() => document.documentElement.scrollWidth <= innerWidth),
    true,
    `${width}px horizontal overflow`,
  );
}

const fallback = await browser.newPage({ viewport: { width: 390, height: 844 } });
await fallback.addInitScript(() => {
  const original = HTMLCanvasElement.prototype.getContext;
  HTMLCanvasElement.prototype.getContext = function (type, ...args) {
    if (String(type).includes('webgl')) return null;
    return original.call(this, type, ...args);
  };
});
await fallback.goto(url, { waitUntil: 'networkidle' });
await fallback.waitForSelector('.hero-model[data-status="fallback"]');
assert.equal(await fallback.getByRole('heading', { name: /在热闹之外/ }).count(), 1);
await fallback.screenshot({ path: fileURLToPath(new URL('mobile-fallback.png', out)) });
assert.deepEqual(errors, [], 'browser runtime errors');
await writeFile(
  new URL('browser-results.json', out),
  JSON.stringify(
    {
      passed: true,
      url,
      checks: [
        'desktop model ready',
        'chapter structure',
        'chart mode switching',
        'source modal and focus return',
        'model expansion',
        'ink model switching',
        'theme and motion persistence',
        '320/390/768/1024/1920px no overflow',
        'mobile navigation',
        'system reduced motion',
        'WebGL fallback',
      ],
      errors,
      testedAt: new Date().toISOString(),
    },
    null,
    2,
  ),
);
console.log('Browser checks passed. Screenshots saved to artifacts/.');
await browser.close();
