import { chromium } from 'playwright';
import assert from 'node:assert/strict';
import { writeFile } from 'node:fs/promises';
const browser = await chromium.launch({
  executablePath: 'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',
  headless: true,
  args: ['--enable-unsafe-swiftshader', '--no-first-run'],
});
const page = await browser.newPage({ viewport: { width: 1440, height: 1000 } });
const errors = [];
page.on('pageerror', (e) => errors.push(e.message));
page.on('console', (msg) => {
  if (msg.type() === 'error') console.log('console:', msg.text());
});
try {
  await page.goto('http://127.0.0.1:5173', { waitUntil: 'networkidle' });
  await page.waitForSelector('.ink-fluid[data-status="ready"]');
  await page.locator('#phenomenon').scrollIntoViewIfNeeded();
  await page.waitForTimeout(1500);
  const before = await page.locator('.ink-fluid').screenshot();
  await page.getByRole('button', { name: '落一滴墨', exact: true }).click();
  await page.waitForTimeout(300);
  const after = await page.locator('.ink-fluid').screenshot();
  assert.notDeepEqual(before, after, 'fluid pixels must change');
  await page.screenshot({ path: 'artifacts/v02-ink-click.png' });
  assert.match(await page.locator('#phenomenon').innerText(), /播放 ≠ 到访 ≠ 学习/);
  const bounds = await page
    .locator('#participation')
    .evaluate((el) => ({ top: el.offsetTop, height: el.offsetHeight }));
  await page.evaluate((y) => scrollTo({ top: y, behavior: 'instant' }), bounds.top + 50);
  await page.waitForSelector('.splat-experience[data-status="ready"]', { timeout: 60000 });
  await page.waitForTimeout(1000);
  assert.equal(await page.locator('.splat-canvas').getAttribute('data-phase'), 'map');
  const mapImage = await page.screenshot({ path: 'artifacts/v03-china-map.png' });
  await page.evaluate(
    (y) => scrollTo({ top: y, behavior: 'instant' }),
    bounds.top + (bounds.height - 1000) * 0.5,
  );
  await page.waitForTimeout(1800);
  assert.equal(await page.locator('.splat-canvas').getAttribute('data-phase'), 'burst');
  const burstImage = await page.screenshot({ path: 'artifacts/v03-china-burst.png' });
  assert.notDeepEqual(mapImage, burstImage);
  await page.evaluate(
    (y) => scrollTo({ top: y, behavior: 'instant' }),
    bounds.top + (bounds.height - 1000) * 0.98,
  );
  await page.waitForTimeout(2000);
  assert.match(await page.locator('.journey-copy h2').innerText(), /鱼灯/);
  assert.equal(await page.locator('.splat-canvas').getAttribute('data-phase'), 'fish');
  await page.screenshot({ path: 'artifacts/v03-china-fish.png' });
  await page.evaluate((y) => scrollTo({ top: y, behavior: 'instant' }), bounds.top + 30);
  await page.waitForTimeout(1800);
  assert.equal(await page.locator('.splat-canvas').getAttribute('data-phase'), 'map');
  await page.locator('#people').scrollIntoViewIfNeeded();
  assert.equal(await page.locator('.relationship-map').count(), 0);
  await page.screenshot({ path: 'artifacts/v02-people.png' });
  assert.match(await page.locator('.verdict-table').innerText(), /不是对前述体验者的追踪/);
  const mobile = await browser.newPage({
    viewport: { width: 390, height: 844 },
    isMobile: true,
    hasTouch: true,
  });
  mobile.on('pageerror', (e) => errors.push(e.message));
  await mobile.goto('http://127.0.0.1:5173', { waitUntil: 'networkidle' });
  await mobile.getByRole('button', { name: '从全国，看见被记录的技艺。', exact: true }).click();
  await mobile.waitForSelector('.splat-experience[data-status="ready"]', { timeout: 60000 });
  await mobile.waitForTimeout(1000);
  await mobile.screenshot({ path: 'artifacts/v03-mobile-map.png' });
  await mobile.getByRole('button', { name: '再走近一盏鱼灯。', exact: true }).click();
  await mobile.waitForSelector('.splat-experience[data-status="ready"]', { timeout: 60000 });
  await mobile.waitForTimeout(2200);
  await mobile.screenshot({ path: 'artifacts/v02-mobile-cloud.png' });
  assert.equal(
    await mobile.evaluate(() => document.documentElement.scrollWidth <= innerWidth),
    true,
  );
  await mobile.close();
  const reduced = await browser.newPage({
    viewport: { width: 390, height: 844 },
    reducedMotion: 'reduce',
  });
  reduced.on('pageerror', (e) => errors.push(e.message));
  await reduced.goto('http://127.0.0.1:5173', { waitUntil: 'networkidle' });
  await reduced.locator('#participation').scrollIntoViewIfNeeded();
  await reduced.waitForSelector('.splat-experience[data-status="ready"]', { timeout: 60000 });
  await reduced.getByRole('button', { name: '再走近一盏鱼灯。', exact: true }).click();
  await reduced.waitForFunction(
    () => document.querySelector('.splat-canvas')?.getAttribute('data-phase') === 'fish',
  );
  await reduced.getByRole('button', { name: '从全国，看见被记录的技艺。', exact: true }).click();
  await reduced.waitForFunction(
    () => document.querySelector('.splat-canvas')?.getAttribute('data-phase') === 'map',
  );
  await reduced.close();
  assert.deepEqual(errors, []);
  await writeFile(
    'artifacts/effects-results.json',
    JSON.stringify(
      {
        passed: true,
        checks: [
          'fluid pixels change',
          'investigation opening',
          'China map to burst to fish, reverse to map',
          'no unsupported relationship graph',
          'evidence limits',
        ],
        errors,
      },
      null,
      2,
    ),
  );
  console.log('Effects passed');
} finally {
  await browser.close();
}
