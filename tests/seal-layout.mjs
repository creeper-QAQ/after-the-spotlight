import { chromium } from 'playwright';
import assert from 'node:assert/strict';
const browser = await chromium.launch({
  executablePath: 'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',
  args: ['--enable-unsafe-swiftshader'],
});
try {
  for (const width of [1440, 390]) {
    const page = await browser.newPage({
      viewport: { width, height: 1000 },
      hasTouch: width < 600,
    });
    await page.goto(process.env.SEAL_TEST_URL || 'http://127.0.0.1:5173', {
      waitUntil: 'domcontentloaded',
    });
    const stage = page.locator('.seal-stage');
    await stage.scrollIntoViewIfNeeded();
    await page.waitForTimeout(4500);
    const identity = await stage
      .locator('.heritage-seal')
      .evaluateAll((nodes) => nodes.map((n) => n.getAttribute('aria-label')));
    for (let repeat = 0; repeat < 2; repeat++) {
      for (const label of ['十类成谱', '认定年轮', '散落成卷']) {
        await page.getByRole('button', { name: label, exact: true }).click();
        await page.waitForTimeout(1200);
        const seals = await stage
          .locator('.heritage-seal')
          .evaluateAll((nodes) =>
            nodes.map((n) => ({ left: n.style.left, label: n.getAttribute('aria-label') })),
          );
        assert.ok(
          seals.every((n) => n.left.endsWith('%')),
          `${width}: ${label} restores declarative coordinates`,
        );
        assert.deepEqual(
          seals.map((n) => n.label),
          identity,
        );
        const outside = await stage.evaluate((host) => {
          const s = host.getBoundingClientRect();
          return [...host.querySelectorAll('.heritage-seal')].filter((n) => {
            const r = n.getBoundingClientRect();
            return (
              r.left < s.left - 1 ||
              r.right > s.right + 1 ||
              r.top < s.top - 1 ||
              r.bottom > s.bottom + 1
            );
          }).length;
        });
        assert.equal(outside, 0, `${width}: ${label} contains all 99 seals`);
        await page.getByRole('button', { name: '落印成堆', exact: true }).click();
        await stage.scrollIntoViewIfNeeded();
        await page.waitForTimeout(4500);
      }
    }
    await page.getByRole('button', { name: '十类成谱', exact: true }).click();
    const first = stage.locator('.heritage-seal').first();
    await first.focus();
    await page.keyboard.press('Enter');
    assert.match(await page.locator('.seal-record h3').innerText(), /桐城歌/);
    if (width < 600) await stage.locator('.heritage-seal').last().tap();
    else await stage.locator('.heritage-seal').last().click();
    assert.match(await page.locator('.seal-record h3').innerText(), /程大位珠算法/);
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.getByRole('button', { name: '落印成堆', exact: true }).click();
    await stage.scrollIntoViewIfNeeded();
    await page.waitForTimeout(300);
    const before = await first.getAttribute('style');
    await page.waitForTimeout(400);
    assert.equal(await first.getAttribute('style'), before, 'reduced motion remains static');
    await page.close();
  }
  console.log(
    'Seal layout regression passed: repeated switches, 99 identities, containment, touch, keyboard, reduced motion.',
  );
} finally {
  await browser.close();
}
