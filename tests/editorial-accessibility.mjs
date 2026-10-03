import assert from 'node:assert/strict';
import { chromium } from 'playwright';
const browser = await chromium.launch({
  executablePath: 'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',
  headless: true,
  args: ['--enable-unsafe-swiftshader', '--no-first-run'],
});
try {
  const page = await browser.newPage({
    viewport: { width: 390, height: 900 },
    reducedMotion: 'reduce',
  });
  await page.goto(process.env.TEST_BASE_URL || 'http://127.0.0.1:5173', {
    waitUntil: 'domcontentloaded',
  });
  assert.equal(
    await page.locator('.overture-enter').getAttribute('href'),
    '#findings',
    'Primary entry must include the findings',
  );
  assert.equal(await page.locator('.skip-link').getAttribute('href'), '#findings');
  await page.locator('#viral-burst').scrollIntoViewIfNeeded();
  await page.waitForTimeout(500);
  assert.equal(
    await page.locator('#viral-burst iframe').count(),
    0,
    'Reduced motion must not autoplay background video',
  );
  assert.equal(await page.locator('.avatar-sound-toggle').count(), 0);
  await page.getByRole('button', { name: '下一条评论' }).click();
  assert.match(await page.locator('.crowd-reading').innerText(), /山风慢慢来/);
  await page.evaluate(() => (document.documentElement.dataset.theme = 'night'));
  await page.locator('#participation').scrollIntoViewIfNeeded();
  const contrast = await page
    .locator('.reasoning-mark')
    .first()
    .evaluate((n) => {
      const rgb = (s) =>
        s
          .match(/[\d.]+/g)
          .slice(0, 3)
          .map(Number)
          .map((v) => v / 255)
          .map((v) => (v <= 0.04045 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4));
      const light = (s) => {
        const [r, g, b] = rgb(s);
        return 0.2126 * r + 0.7152 * g + 0.0722 * b;
      };
      const foreground = light(getComputedStyle(n).color),
        background = light(
          getComputedStyle(n.closest('.evidence-window-reasoning')).backgroundColor,
        );
      return (Math.max(foreground, background) + 0.05) / (Math.min(foreground, background) + 0.05);
    });
  assert.ok(contrast >= 4.5, `Night evidence label contrast ${contrast}`);
  console.log(
    `Entry, reduced-motion video, keyboard-friendly voices and night contrast ${contrast.toFixed(2)} pass.`,
  );
} finally {
  await browser.close();
}
