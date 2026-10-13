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
const base = process.env.TEST_BASE_URL || 'http://127.0.0.1:5173';
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
    await page.goto(base, { waitUntil: 'domcontentloaded' });
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
    await atlas.getByRole('button', { name: '认定年轮' }).click();
    const before = await atlas
      .locator('.heritage-seal')
      .evaluateAll((nodes) => nodes.map((n) => n.getAttribute('style')));
    await atlas.getByRole('button', { name: '十类成谱' }).click();
    assert.notDeepEqual(
      await atlas
        .locator('.heritage-seal')
        .evaluateAll((nodes) => nodes.map((n) => n.getAttribute('style'))),
      before,
    );
    await atlas.locator('.heritage-seal').last().click();
    assert.match(await atlas.locator('.seal-record').innerText(), /程大位珠算法/);
    await atlas.locator('.heritage-seal').last().press('ArrowRight');
    assert.match(await atlas.locator('.seal-record').innerText(), /桐城歌/);
    await atlas.getByRole('button', { name: '认定年轮' }).click();
    await page.waitForFunction(
      () =>
        document.querySelectorAll('#seal-atlas .heritage-seal[aria-pressed="true"]').length === 1,
    );
    assert.equal(await atlas.locator('.heritage-seal[aria-pressed="true"]').count(), 1);
    await atlas.getByRole('button', { name: '散落成卷' }).click();
    await atlas.screenshot({
      path: `artifacts/scroll-${width}-atlas.png`,
      style: '.site-header,.ink-drop-button{visibility:hidden}',
    });
    await page.locator('.ai-annex > summary').click();
    const loom = page.locator('#continuity-loom');
    await loom.locator('textarea').waitFor({ state: 'visible' });
    assert.equal(await loom.locator('textarea').count(), 1);
    await loom.locator('textarea').fill('半年后如何核对体验者是否继续学习？');
    assert.equal(await loom.locator('textarea').inputValue(), '半年后如何核对体验者是否继续学习？');
    await loom.getByRole('button', { name: '手艺怎样留在日常生活里？' }).click();
    assert.equal(await loom.locator('textarea').inputValue(), '手艺怎样留在日常生活里？');
    await loom.screenshot({
      path: `artifacts/scroll-${width}-loom.png`,
      style: '.site-header,.ink-drop-button{visibility:hidden}',
    });
    assert.match(await loom.innerText(), /回访提纲/);
    assert.equal(
      await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth),
      true,
      `interaction overflow ${width}`,
    );
    await page.close();
  }
  const moving = await browser.newPage({ viewport: { width: 1440, height: 1000 } });
  moving.on('pageerror', (error) => errors.push(error.message));
  await moving.goto(base, { waitUntil: 'domcontentloaded' });
  await moving.waitForTimeout(300);
  await moving.waitForFunction(
    () => Number(document.querySelector('.overture-player svg')?.getAttribute('data-frame')) > 6,
  );
  await moving.waitForFunction(
    () => Number(document.querySelector('input[aria-label="拖动纸灯序幕"]')?.value) > 0,
  );
  const running = await moving.getByRole('slider', { name: '拖动纸灯序幕' }).inputValue();
  assert.notEqual(running, '0');
  await moving.getByRole('button', { name: '暂停纸灯序幕' }).click();
  const paused = await moving.getByRole('slider', { name: '拖动纸灯序幕' }).inputValue();
  await moving.waitForTimeout(150);
  assert.equal(await moving.getByRole('slider', { name: '拖动纸灯序幕' }).inputValue(), paused);
  await moving.getByRole('button', { name: '播放纸灯序幕' }).click();
  await moving.locator('#after').scrollIntoViewIfNeeded();
  await moving.waitForTimeout(500);
  const offscreenFrame = await moving.locator('.overture-player svg').getAttribute('data-frame');
  await moving.waitForTimeout(250);
  assert.equal(
    await moving.locator('.overture-player svg').getAttribute('data-frame'),
    offscreenFrame,
  );
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
