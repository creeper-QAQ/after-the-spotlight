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
    const errors = [];
    page.on('pageerror', (e) => errors.push(e.message));
    await page.goto('http://127.0.0.1:5173', { waitUntil: 'domcontentloaded' });
    const stage = page.locator('.seal-stage');
    await stage.scrollIntoViewIfNeeded();
    const first = stage.locator('.heritage-seal').first();
    const initial = await first.getAttribute('style');
    await page.waitForTimeout(5000);
    assert.notEqual(await first.getAttribute('style'), initial, 'gravity moves seals');
    const box = await stage.boundingBox();
    const all = await stage.locator('.heritage-seal').evaluateAll((nodes) =>
      nodes.map((n) => ({
        x: parseFloat(getComputedStyle(n).left),
        y: parseFloat(getComputedStyle(n).top),
      })),
    );
    assert.equal(all.length, 99);
    assert.ok(
      all.every((p) => p.x >= 0 && p.x <= box.width && p.y > 0 && p.y < box.height),
      'all seals remain in tray',
    );
    // Pick a topmost unobscured seal, then drag it into open space.
    const target = await stage.locator('.heritage-seal').evaluateAll(
      (nodes) =>
        nodes
          .map((n, i) => {
            const r = n.getBoundingClientRect();
            return {
              i,
              x: r.x + r.width / 2,
              y: r.y + r.height / 2,
              visible: n.contains(document.elementFromPoint(r.x + r.width / 2, r.y + r.height / 2)),
            };
          })
          .filter((n) => n.visible)
          .sort((a, b) => a.y - b.y)[0],
    );
    assert.ok(target);
    const record = await page.locator('.seal-record h3').innerText();
    const touch = width < 600 ? await page.context().newCDPSession(page) : null;
    if (touch) {
      await touch.send('Input.dispatchTouchEvent', {
        type: 'touchStart',
        touchPoints: [{ x: target.x, y: target.y }],
      });
      for (let step = 1; step <= 25; step++) {
        await touch.send('Input.dispatchTouchEvent', {
          type: 'touchMove',
          touchPoints: [
            {
              x: target.x + ((box.x + box.width / 2 - target.x) * step) / 25,
              y: target.y + ((box.y + 75 - target.y) * step) / 25,
            },
          ],
        });
      }
    } else {
      await page.mouse.move(target.x, target.y);
      await page.mouse.down();
      await page.mouse.move(box.x + box.width / 2, box.y + 75, { steps: 25 });
    }
    await page.waitForTimeout(400);
    assert.equal(await stage.locator('.is-dragging').count(), 1);
    const draggedY = parseFloat(
      await stage
        .locator('.heritage-seal')
        .nth(target.i)
        .evaluate((n) => getComputedStyle(n).top),
    );
    assert.ok(draggedY < 150, 'body follows drag');
    if (touch) await touch.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
    else await page.mouse.up();
    assert.equal(await page.locator('.seal-record h3').innerText(), record, 'drag must not select');
    await page.waitForTimeout(1800);
    assert.ok(
      parseFloat(
        await stage
          .locator('.heritage-seal')
          .nth(target.i)
          .evaluate((n) => getComputedStyle(n).top),
      ) >
        draggedY + 40,
      'released body falls',
    );
    await first.focus();
    await page.keyboard.press('Enter');
    assert.match(await page.locator('.seal-record h3').innerText(), /桐城歌/);
    await page.getByRole('button', { name: '十类成谱' }).click();
    await page.waitForTimeout(1100);
    await stage.locator('.heritage-seal').last().click();
    assert.match(await page.locator('.seal-record h3').innerText(), /程大位珠算法/);
    await page.getByRole('button', { name: '落印成堆', exact: true }).click();
    await page.getByRole('button', { name: '重新落下' }).click();
    await stage.scrollIntoViewIfNeeded();
    await page.waitForTimeout(4500);
    assert.equal(
      await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth),
      true,
    );
    await stage.screenshot({ path: `artifacts/seal-physics-${width}.png` });
    assert.deepEqual(errors, []);
    await page.close();
  }
  console.log(
    'Seal physics: gravity, containment, drag/release, no accidental selection, details and layout/reset passed.',
  );
} finally {
  await browser.close();
}
