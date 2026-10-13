import { chromium } from 'playwright';
import assert from 'node:assert/strict';
import { mkdir, writeFile } from 'node:fs/promises';
const base = process.env.TEST_BASE_URL || 'http://127.0.0.1:5185';
await mkdir('artifacts/readable-story', { recursive: true });
const browser = await chromium.launch({
  executablePath: 'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',
  args: ['--enable-unsafe-swiftshader', '--no-first-run'],
});
const errors = [];
try {
  const page = await browser.newPage({
    viewport: { width: 1440, height: 900 },
    reducedMotion: 'no-preference',
  });
  page.on('pageerror', (e) => errors.push(e.message));
  await page.goto(base, { waitUntil: 'domcontentloaded' });
  await page.locator('.ink-fluid[data-status="ready"]').waitFor();
  await page.locator('#phenomenon').scrollIntoViewIfNeeded();
  await page.waitForTimeout(200);
  const before = await page.locator('.ink-fluid').screenshot();
  await page.getByRole('button', { name: '落一滴墨', exact: true }).click();
  await page.waitForTimeout(350);
  assert.notDeepEqual(
    await page.locator('.ink-fluid').screenshot(),
    before,
    'Ink response must change pixels',
  );
  await page.locator('#viral-burst').scrollIntoViewIfNeeded();
  await page.waitForFunction(() => document.querySelector('#viral-burst video')?.currentTime > 0.1);
  const setting = page.locator('header').getByRole('button', { name: '阅读设置' });
  await setting.click();
  await page.getByRole('button', { name: '减少动态', exact: true }).click();
  await page.keyboard.press('Escape');
  await page.locator('.ink-fluid[data-status="paused"]').waitFor({ state: 'attached' });
  assert.equal(await page.locator('#viral-burst video').count(), 0, 'Running film must be removed');
  await page.locator('#seal-atlas').scrollIntoViewIfNeeded();
  const positions = await page
    .locator('.heritage-seal')
    .evaluateAll((ns) => ns.map((n) => n.getAttribute('style')));
  await page.waitForTimeout(400);
  assert.deepEqual(
    await page
      .locator('.heritage-seal')
      .evaluateAll((ns) => ns.map((n) => n.getAttribute('style'))),
    positions,
  );
  await setting.click();
  await page.getByRole('button', { name: '开启', exact: true }).click();
  await page.keyboard.press('Escape');
  await page.locator('.ink-fluid[data-status="ready"]').waitFor();
  await page.locator('#viral-burst').scrollIntoViewIfNeeded();
  await page.waitForFunction(() => document.querySelector('#viral-burst video')?.currentTime > 0.1);
  assert.equal(await page.locator('#map-context').count(), 0);
  await page.close();
  const storage = await browser.newPage({
    viewport: { width: 390, height: 900 },
    reducedMotion: 'reduce',
  });
  storage.on('pageerror', (e) => errors.push(e.message));
  await storage.addInitScript(() =>
    Object.defineProperty(window, 'localStorage', {
      get() {
        throw new DOMException('Storage disabled', 'SecurityError');
      },
    }),
  );
  await storage.goto(base, { waitUntil: 'domcontentloaded' });
  await storage.locator('header').getByRole('button', { name: '阅读设置' }).click();
  await storage.getByRole('button', { name: '减少动态', exact: true }).click();
  await storage.keyboard.press('Escape');
  assert.equal(await storage.evaluate(() => document.documentElement.dataset.motion), 'off');
  assert.equal(await storage.locator('#history').count(), 1);
  await storage.close();
  assert.deepEqual(errors, []);
  const result = {
    fluidPixelsChange: true,
    runningFilmStops: true,
    sealsStop: true,
    motionRestarts: true,
    unavailableStorage: true,
    noMap: true,
    errors,
  };
  await writeFile('artifacts/readable-story/effects-results.json', JSON.stringify(result, null, 2));
  console.log(JSON.stringify(result, null, 2));
} finally {
  await browser.close();
}
