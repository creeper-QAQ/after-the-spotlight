import { chromium } from 'playwright';
import assert from 'node:assert/strict';
import { mkdir } from 'node:fs/promises';
await mkdir('artifacts', { recursive: true });
const browser = await chromium.launch({
  executablePath: 'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',
  headless: true,
  args: ['--enable-unsafe-swiftshader', '--no-first-run'],
});
const errors = [];
async function open(mobile = false) {
  const page = await browser.newPage({
    viewport: mobile ? { width: 390, height: 844 } : { width: 1440, height: 1000 },
    isMobile: mobile,
    hasTouch: mobile,
    reducedMotion: mobile ? 'reduce' : 'no-preference',
  });
  page.on('pageerror', (e) => errors.push(e.message));
  await page.route('https://player.bilibili.com/**', (r) =>
    r.fulfill({
      status: 200,
      contentType: 'text/html',
      body: '<!doctype html><title>player</title>',
    }),
  );
  await page.goto(process.env.TEST_BASE_URL || 'http://127.0.0.1:5173', {
    waitUntil: 'domcontentloaded',
  });
  const studio = page.locator('.craft-studio');
  await studio.scrollIntoViewIfNeeded();
  await studio.locator('.workshop-view[data-status="ready"]').waitFor({ timeout: 30000 });
  assert.equal(await studio.locator('canvas').count(), 1);
  assert.equal(await studio.locator('svg').count(), 0);
  return page;
}
async function finish(page, goals, prefix) {
  const studio = page.locator('.craft-studio');
  for (let step = 0; step < goals.length; step++) {
    assert.equal(await studio.getAttribute('data-step'), String(step));
    for (let i = 0; i < goals[step]; i++) {
      const marker = studio.locator('.workshop-marker');
      await marker.waitFor({ state: 'visible' });
      if (i === 0 && step === 0) {
        await marker.focus();
        await page.keyboard.press('Enter');
      } else await marker.click();
      await page.waitForFunction(
        () => document.querySelector('.craft-studio')?.getAttribute('data-busy') === 'false',
      );
      assert.equal(await studio.locator('.studio-count strong').innerText(), String(i + 1));
    }
    await studio
      .locator('.studio-board')
      .screenshot({ path: `artifacts/${prefix}-step-${step + 1}.png` });
    await studio.getByRole('button', { name: /下一步 ·|查看我的作品/ }).click();
  }
  assert.equal(await studio.getAttribute('data-complete'), 'true');
  await studio.locator('.studio-board').screenshot({ path: `artifacts/${prefix}-complete.png` });
  assert.equal(await studio.locator('.workshop-marker').count(), 0);
}
try {
  const desktop = await open();
  const studio = desktop.locator('.craft-studio');
  await studio.locator('.studio-board').screenshot({ path: 'artifacts/workshop-initial.png' });
  await finish(desktop, [4, 4, 3, 1], 'workshop-fish');
  await studio.getByRole('button', { name: '徽墨 · 4 道工序' }).click();
  await studio.locator('.workshop-view[data-status="ready"]').waitFor();
  await finish(desktop, [3, 3, 1, 3], 'workshop-ink');
  await studio.getByRole('button', { name: '鱼灯 · 4 道工序' }).click();
  assert.equal(await studio.getAttribute('data-complete'), 'true');
  await studio.getByRole('button', { name: /重新体验鱼灯/ }).click();
  assert.equal(await studio.getAttribute('data-step'), '0');
  await studio.getByRole('button', { name: '查看工序来源 ↗' }).click();
  assert.equal(await desktop.locator('.source-dialog').evaluate((n) => n.open), true);
  await desktop.keyboard.press('Escape');
  // WebGL loss displays an honest retry state instead of a planar craft game.
  await studio
    .locator('canvas')
    .evaluate((c) => c.dispatchEvent(new Event('webglcontextlost', { cancelable: true })));
  await studio.getByRole('button', { name: '重新打开制作台' }).waitFor();
  await studio.getByRole('button', { name: '重新打开制作台' }).click();
  await studio.locator('.workshop-view[data-status="ready"]').waitFor();
  await desktop.close();
  const mobile = await open(true);
  await finish(mobile, [4, 4, 3, 1], 'workshop-mobile-fish');
  const mobileStudio = mobile.locator('.craft-studio');
  await mobileStudio.getByRole('button', { name: '徽墨 · 4 道工序' }).click();
  await mobileStudio.locator('.workshop-view[data-status="ready"]').waitFor();
  await finish(mobile, [3, 3, 1, 3], 'workshop-mobile-ink');
  await mobile.setViewportSize({ width: 320, height: 800 });
  assert.equal(
    await mobile.evaluate(() => document.documentElement.scrollWidth <= innerWidth),
    true,
  );
  await mobile.close();
  assert.deepEqual(errors, []);
  console.log(
    '3D fish and ink: complete desktop/mobile flows, sequential actions, keyboard, retained sessions, restart, sources, WebGL retry and 320px layout pass.',
  );
} finally {
  await browser.close();
}
