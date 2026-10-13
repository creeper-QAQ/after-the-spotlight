import { chromium } from 'playwright';
import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const base = process.env.LANTERN_RENDER_URL || 'http://127.0.0.1:5173';
const out = path.join(root, 'artifacts', 'ninety-polish');
await mkdir(out, { recursive: true });
const browser = await chromium.launch({
  executablePath:
    process.env.LANTERN_EDGE_PATH || 'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',
  args: ['--enable-unsafe-swiftshader', '--no-first-run'],
});
const results = [];
try {
  for (const mode of process.argv.includes('--isolated')
    ? ['isolated']
    : ['isolated', 'website-mobile', 'website-desktop']) {
    const page = await browser.newPage({
      viewport: { width: mode === 'website-desktop' ? 1440 : 390, height: 900 },
      reducedMotion: 'no-preference',
    });
    const pageErrors = [];
    page.on('pageerror', (error) => pageErrors.push(error.message));
    if (mode === 'isolated') {
      await page.goto(`${base}/scripts/lantern-film/playback.html`, {
        waitUntil: 'domcontentloaded',
      });
    } else {
      await page.goto(`${base}/#viral-burst`, { waitUntil: 'domcontentloaded' });
      await page
        .locator('#viral-burst')
        .evaluate((node) =>
          scrollTo({ top: node.getBoundingClientRect().top + scrollY - 100, behavior: 'instant' }),
        );
    }
    const selector = mode === 'isolated' ? '#probe' : '#viral-burst video';
    await page.locator(selector).waitFor({ state: 'attached', timeout: 15_000 });
    const probe = await page.evaluate(async (selector) => {
      const video = document.querySelector(selector);
      const start = performance.now();
      const samples = [];
      let wraps = 0;
      let previous = 0;
      let highest = 0;
      let started = false;
      while (performance.now() - start < 13_000) {
        const s = {
          elapsedMs: Math.round(performance.now() - start),
          time: video.currentTime,
          paused: video.paused,
          readyState: video.readyState,
          error: video.error ? { code: video.error.code, message: video.error.message } : null,
        };
        samples.push(s);
        if (s.time > 0.1) started = true;
        if (s.time < previous - 0.5) wraps++;
        previous = s.time;
        highest = Math.max(highest, s.time);
        if (s.error) break;
        if (!started && s.elapsedMs > 8_000) break;
        await new Promise((resolve) => setTimeout(resolve, 200));
      }
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
      return {
        duration: video.duration,
        width: video.videoWidth,
        height: video.videoHeight,
        highestTime: highest,
        wraps,
        started,
        samples,
        pixels: { light, warm },
        quality: video.getVideoPlaybackQuality().toJSON?.() ?? {
          totalVideoFrames: video.getVideoPlaybackQuality().totalVideoFrames,
          droppedVideoFrames: video.getVideoPlaybackQuality().droppedVideoFrames,
        },
        motion: document.querySelector('.viral-stage')?.getAttribute('data-motion'),
        canvasCount: document.querySelectorAll('canvas').length,
      };
    }, selector);
    const passed =
      probe.started &&
      probe.highestTime > 9 &&
      probe.wraps >= 1 &&
      probe.samples.at(-1).elapsedMs >= 12_000 &&
      probe.samples.every((sample) => !sample.error) &&
      probe.pixels.light > 200 &&
      probe.pixels.warm > 200 &&
      pageErrors.length === 0;
    results.push({ mode, passed, pageErrors, ...probe });
    await writeFile(
      path.join(out, 'lantern-film-playback.json'),
      `${JSON.stringify(results, null, 2)}\n`,
    );
    await page.screenshot({ path: path.join(out, `lantern-playback-${mode}.png`) });
    console.log(
      JSON.stringify({
        mode,
        passed,
        duration: probe.duration,
        highestTime: probe.highestTime,
        wraps: probe.wraps,
        lastSample: probe.samples.at(-1),
        pixels: probe.pixels,
        quality: probe.quality,
        pageErrors,
      }),
    );
    await page.close();
  }
  await writeFile(
    path.join(out, 'lantern-film-playback.json'),
    `${JSON.stringify(results, null, 2)}\n`,
  );
  if (results.some((result) => !result.passed)) process.exitCode = 1;
} finally {
  await browser.close();
}
