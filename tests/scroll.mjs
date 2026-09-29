import { chromium } from 'playwright';
import assert from 'node:assert/strict';
import { mkdir, writeFile } from 'node:fs/promises';

await mkdir('artifacts', { recursive: true });
const browser = await chromium.launch({
  executablePath: 'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',
  headless: true,
  args: ['--enable-unsafe-swiftshader', '--no-first-run'],
});
const errors = [];
try {
  for (const [width, height] of [
    [1440, 1000],
    [390, 844],
    [320, 800],
  ]) {
    const page = await browser.newPage({
      viewport: { width, height },
      reducedMotion: 'reduce',
      isMobile: width < 600,
      hasTouch: width < 600,
    });
    page.on('pageerror', (error) => errors.push(error.message));
    await page.goto('http://127.0.0.1:5173', { waitUntil: 'networkidle' });
    await page.waitForSelector('.overture-player svg');
    assert.equal(await page.locator('h1').count(), 1);
    assert.equal(
      await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth),
      true,
      `overflow ${width}`,
    );
    await page.screenshot({ path: `artifacts/scroll-${width}-hero.png` });
    const slider = page.getByRole('slider', { name: '拖动纸灯序幕' });
    await page.getByRole('button', { name: '01 纸骨' }).click();
    assert.equal(await slider.inputValue(), '35');
    await page.getByRole('button', { name: '02 灯火' }).click();
    assert.equal(await slider.inputValue(), '180');
    const atlas = page.locator('#seal-atlas');
    assert.equal(await atlas.locator('.heritage-seal').count(), 99);
    const first = atlas.locator('.heritage-seal').first();
    const before = await first.getAttribute('style');
    await atlas.getByRole('button', { name: '十类成谱' }).click();
    assert.notEqual(await first.getAttribute('style'), before);
    await atlas.locator('.heritage-seal').last().click();
    assert.match(await atlas.locator('.seal-record').innerText(), /程大位珠算法/);
    await atlas.locator('.heritage-seal').last().press('ArrowRight');
    assert.match(await atlas.locator('.seal-record').innerText(), /桐城歌/);
    await atlas.getByRole('button', { name: '认定年轮' }).click();
    assert.equal(await atlas.locator('.heritage-seal[aria-pressed="true"]').count(), 1);
    await atlas.getByRole('button', { name: '散落成卷' }).click();
    await atlas.screenshot({
      path: `artifacts/scroll-${width}-atlas.png`,
      style: '.site-header,.ink-drop-button{visibility:hidden}',
    });
    const loom = page.locator('#continuity-loom');
    await loom.getByRole('button', { name: '接下一针' }).click();
    assert.equal(await loom.locator('.loom-scene').getAttribute('data-step'), '1');
    await loom.getByRole('slider', { name: '牵线进度' }).focus();
    await page.keyboard.press('End');
    assert.equal(await loom.locator('.loom-scene').getAttribute('data-step'), '2');
    await loom.getByRole('button', { name: '接下一针' }).click();
    assert.match(await loom.innerText(), /故事还没结束/);
    await loom.getByRole('button', { name: '后来，谁还在学？' }).click();
    assert.match(await loom.getByRole('status').innerText(), /同一批学习者/);
    await loom.screenshot({
      path: `artifacts/scroll-${width}-loom.png`,
      style: '.site-header,.ink-drop-button{visibility:hidden}',
    });
    await loom.getByRole('button', { name: '重新牵线' }).click();
    assert.equal(await loom.locator('.loom-scene').getAttribute('data-step'), '0');
    assert.equal(
      await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth),
      true,
      `interaction overflow ${width}`,
    );
    await page.close();
  }
  const moving = await browser.newPage({ viewport: { width: 1440, height: 1000 } });
  moving.on('pageerror', (error) => errors.push(error.message));
  await moving.goto('http://127.0.0.1:5173', { waitUntil: 'networkidle' });
  await moving.getByRole('button', { name: '02 灯火' }).click();
  await moving.getByRole('button', { name: '播放纸灯序幕' }).click();
  await moving.waitForFunction(
    () => Number(document.querySelector('.overture-player svg')?.getAttribute('data-frame')) > 183,
  );
  const running = await moving.getByRole('slider', { name: '拖动纸灯序幕' }).inputValue();
  assert.notEqual(running, '180');
  await moving.getByRole('button', { name: '暂停纸灯序幕' }).click();
  const paused = await moving.getByRole('slider', { name: '拖动纸灯序幕' }).inputValue();
  await moving.waitForTimeout(150);
  assert.equal(await moving.getByRole('slider', { name: '拖动纸灯序幕' }).inputValue(), paused);
  await moving.getByRole('button', { name: '播放纸灯序幕' }).click();
  await moving.locator('#seal-atlas').scrollIntoViewIfNeeded();
  await moving.waitForTimeout(500);
  const offscreenFrame = await moving.locator('.overture-player svg').getAttribute('data-frame');
  await moving.waitForTimeout(250);
  assert.equal(await moving.locator('.overture-player svg').getAttribute('data-frame'), offscreenFrame);
  await moving.close();
  assert.deepEqual(errors, []);
  await writeFile(
    'artifacts/scroll-results.json',
    JSON.stringify(
      {
        passed: true,
        widths: [1440, 390, 320],
        checks: [
          'Remotion seek/play/pause and offscreen pause',
          '99 record identity across layouts',
          'seal pointer and keyboard selection',
          'three-stage thread with keyboard alternative',
          'reflection and reset',
          'reduced motion',
          'no horizontal overflow',
        ],
        errors,
      },
      null,
      2,
    ),
  );
  console.log('Unfinished scroll interactions and responsive checks passed.');
} finally {
  await browser.close();
}
