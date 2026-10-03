import assert from 'node:assert/strict';
import { mkdir, writeFile } from 'node:fs/promises';
import { chromium } from 'playwright';
const base = process.env.TEST_BASE_URL || 'http://127.0.0.1:5173';
const browser = await chromium.launch({
  executablePath: 'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',
  args: ['--enable-unsafe-swiftshader', '--no-first-run'],
});
const output = 'artifacts/ninety-polish/media';
await mkdir(output, { recursive: true });
const results = [];
try {
  for (const width of [390, 1440]) {
    const page = await browser.newPage({
      viewport: { width, height: 900 },
      reducedMotion: 'no-preference',
    });
    const errors = [],
      remote = [];
    page.on('pageerror', (error) => errors.push(error.message));
    await page.route('**/*', (route) => {
      const url = route.request().url();
      if (url.startsWith(base)) return route.continue();
      remote.push(url);
      return route.abort();
    });
    await page.goto(base, { waitUntil: 'domcontentloaded' });
    await page
      .locator('#viral-burst')
      .evaluate((node) =>
        scrollTo({ top: node.getBoundingClientRect().top + scrollY - 100, behavior: 'instant' }),
      );
    await page.waitForFunction(
      () => document.querySelector('#viral-burst video')?.currentTime > 0.1,
    );
    const film = page.locator('#viral-burst video');
    const metadata = await film.evaluate((video) => ({
      width: video.videoWidth,
      height: video.videoHeight,
      duration: video.duration,
      controls: video.controls,
      muted: video.muted,
      loop: video.loop,
    }));
    assert.equal(metadata.width, 960);
    assert.equal(metadata.height, 540);
    assert.ok(Math.abs(metadata.duration - 10) < 0.05);
    assert.equal(metadata.controls, false);
    assert.equal(metadata.muted, true);
    assert.equal(metadata.loop, true);
    assert.equal(await page.locator('#viral-burst iframe').count(), 0);
    await page.getByRole('button', { name: '暂停背景灯影', exact: true }).click();
    const pausedAt = await film.evaluate((video) => video.currentTime);
    await page.waitForTimeout(350);
    assert.equal(await film.evaluate((video) => video.currentTime), pausedAt);
    const pixels = await film.evaluate((video) => {
      const canvas = document.createElement('canvas');
      canvas.width = 96;
      canvas.height = 54;
      const ctx = canvas.getContext('2d');
      ctx.drawImage(video, 0, 0, 96, 54);
      const data = ctx.getImageData(0, 0, 96, 54).data;
      let light = 0,
        warm = 0;
      for (let i = 0; i < data.length; i += 4) {
        if (data[i] + data[i + 1] + data[i + 2] > 140) light++;
        if (data[i] > data[i + 2] * 1.5 && data[i] > 80) warm++;
      }
      return { light, warm };
    });
    assert.ok(
      pixels.light > 200 && pixels.warm > 200,
      'Decoded scene contains visible warm fish lanterns',
    );
    await page.screenshot({ path: `${output}/${width}-crowd.png` });
    await page.getByRole('button', { name: '播放背景灯影', exact: true }).click();
    await page.waitForFunction(() => !document.querySelector('#viral-burst video')?.paused);
    await film.evaluate((video) => {
      video.currentTime = 9.8;
    });
    await page.waitForFunction(
      () => document.querySelector('#viral-burst video')?.currentTime < 1,
      undefined,
      { timeout: 10000 },
    );
    await page.locator('#intro').scrollIntoViewIfNeeded();
    await page.waitForFunction(() => document.querySelector('#viral-burst video')?.paused);
    // Installed endpoint protection can inject its own Edge script. It was blocked
    // with all other external traffic and is absent from the built site's sources.
    const injectedSecurityHosts = remote.filter((url) =>
      new URL(url).hostname.endsWith('.kaspersky-labs.com'),
    );
    assert.deepEqual(
      remote.filter((url) => !injectedSecurityHosts.includes(url)),
      [],
      'The ambient film must not depend on third-party requests',
    );
    assert.deepEqual(errors, []);
    results.push({
      width,
      metadata,
      pixels,
      externalNetworkBlocked: true,
      blockedBrowserSecurityHosts: [
        ...new Set(injectedSecurityHosts.map((url) => new URL(url).hostname)),
      ],
      pauseResume: true,
      loop: true,
      stopsOffscreen: true,
      errors,
    });
    await page.close();
  }
  const fallback = await browser.newPage({
    viewport: { width: 390, height: 900 },
    reducedMotion: 'no-preference',
  });
  await fallback.route('**/media/lantern-night.webm', (route) => route.abort());
  await fallback.goto(base, { waitUntil: 'domcontentloaded' });
  await fallback.locator('#viral-burst').scrollIntoViewIfNeeded();
  await fallback.getByText('原创三维灯影 · 工艺意象 · 静帧阅读', { exact: true }).waitFor();
  assert.equal(
    await fallback
      .locator('.avatar-video-bg > img')
      .evaluate((img) => img.complete && img.naturalWidth > 0),
    true,
  );
  await fallback.getByRole('button', { name: '下一条评论', exact: true }).click();
  assert.match(await fallback.locator('.crowd-reading').innerText(), /山风慢慢来/);
  results.push({ failedFilmStillReadable: true, posterAvailable: true });
  await fallback.close();
  const reduced = await browser.newPage({ reducedMotion: 'reduce' });
  await reduced.goto(base, { waitUntil: 'domcontentloaded' });
  await reduced.locator('#viral-burst').scrollIntoViewIfNeeded();
  await pageWaitPoster(reduced);
  assert.equal(await reduced.locator('#viral-burst video').count(), 0);
  results.push({ reducedMotionUsesStaticPoster: true });
  await reduced.close();
  await writeFile(`${output}/results.json`, JSON.stringify(results, null, 2));
  console.log(JSON.stringify(results, null, 2));
} finally {
  await browser.close();
}
async function pageWaitPoster(page) {
  await page.waitForFunction(() => {
    const img = document.querySelector('.avatar-video-bg > img');
    return img?.complete && img.naturalWidth > 0;
  });
}
