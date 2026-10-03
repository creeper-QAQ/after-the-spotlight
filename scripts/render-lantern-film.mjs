import { chromium } from 'playwright';
import { mkdir, writeFile, stat, readFile } from 'node:fs/promises';
import { spawn } from 'node:child_process';
import { createHash } from 'node:crypto';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const artifacts = path.join(root, 'artifacts', 'ninety-polish');
const media = path.join(root, 'public', 'media');
const base = process.env.LANTERN_RENDER_URL || 'http://127.0.0.1:5173';
await mkdir(artifacts, { recursive: true });
await mkdir(media, { recursive: true });

const browser = await chromium.launch({
  executablePath:
    process.env.LANTERN_EDGE_PATH || 'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',
  headless: true,
  args: [
    '--use-angle=swiftshader',
    '--enable-unsafe-swiftshader',
    '--disable-gpu-sandbox',
    '--autoplay-policy=no-user-gesture-required',
  ],
});
const page = await browser.newPage({ viewport: { width: 960, height: 540 }, deviceScaleFactor: 1 });
const errors = [];
let createdVideo = false;
page.on('pageerror', (error) => errors.push(error.message));

try {
  await page.goto(`${base}/scripts/lantern-film/index.html`, { waitUntil: 'networkidle' });
  await page.waitForFunction(() => Boolean(window.lanternFilm), { timeout: 30_000 });
  const info = await page.evaluate(() => {
    const { width, height, duration, fps, recorderType, rendererInfo } = window.lanternFilm;
    return { width, height, duration, fps, recorderType, rendererInfo };
  });
  if (!info.recorderType) throw new Error('No native WebM MediaRecorder codec available.');
  console.log(JSON.stringify({ stage: 'scene-ready', ...info }));
  await page.screenshot({ path: path.join(artifacts, 'lantern-film-frame-000.png') });
  await page.evaluate(() => window.lanternFilm.render(5));
  await page.screenshot({ path: path.join(artifacts, 'lantern-film-frame-120.png') });
  await page.evaluate(() => window.lanternFilm.render(0));
  const poster = await page.evaluate(
    () => window.lanternFilm.canvas.toDataURL('image/jpeg', 0.93).split(',')[1],
  );
  await writeFile(path.join(media, 'lantern-night-poster.jpg'), Buffer.from(poster, 'base64'));
  const loopSeam = await page.evaluate(() => {
    const film = window.lanternFilm;
    const c = film.canvas.getContext('2d');
    const first = c.getImageData(0, 0, film.width, film.height).data;
    film.render(film.duration);
    const last = c.getImageData(0, 0, film.width, film.height).data;
    let total = 0;
    let max = 0;
    for (let i = 0; i < first.length; i++) {
      if (i % 4 === 3) continue;
      const d = Math.abs(first[i] - last[i]);
      total += d;
      max = Math.max(max, d);
    }
    const crop = document.createElement('canvas');
    crop.width = 390;
    crop.height = 1350;
    const context = crop.getContext('2d');
    const scale = crop.height / film.height;
    context.drawImage(
      film.canvas,
      (crop.width - film.width * scale) / 2,
      0,
      film.width * scale,
      crop.height,
    );
    film.render(0);
    return {
      meanAbsoluteChannelDifference: total / (film.width * film.height * 3),
      maxChannelDifference: max,
      mobileCrop: crop.toDataURL('image/png').split(',')[1],
    };
  });
  await writeFile(
    path.join(artifacts, 'lantern-film-mobile-crop.png'),
    Buffer.from(loopSeam.mobileCrop, 'base64'),
  );
  delete loopSeam.mobileCrop;
  if (process.argv.includes('--poster-only')) {
    console.log(JSON.stringify({ stage: 'poster-only', errors }));
    process.exitCode = 0;
  } else {
    const recorded = await page.evaluate(async () => {
      const film = window.lanternFilm;
      const fps = 16;
      const stream = film.canvas.captureStream(0);
      const track = stream.getVideoTracks()[0];
      film.render(0);
      track.requestFrame();
      // Warm the capture track before recording, so its first frame contains
      // the painted canvas rather than its initial blank backing buffer.
      await new Promise((resolve) => setTimeout(resolve, 120));
      const chunks = [];
      const recorder = new MediaRecorder(stream, {
        mimeType: film.recorderType,
        videoBitsPerSecond: 1_700_000,
      });
      const complete = new Promise((resolve, reject) => {
        recorder.ondataavailable = (event) => {
          if (event.data.size) chunks.push(event.data);
        };
        recorder.onerror = (event) => reject(new Error(String(event.error)));
        recorder.onstop = resolve;
      });
      recorder.start();
      const frameTimes = [];
      const start = performance.now();
      const targetEnd = start + film.duration * 1000;
      for (let frame = 0; frame < film.duration * fps; frame++) {
        const target = start + frame * (1000 / fps);
        if (target > performance.now())
          await new Promise((resolve) => setTimeout(resolve, target - performance.now()));
        // Keep phase tied to the actual clock under load. Late frames are
        // omitted instead of extending the loop or slowing its final phase.
        if (performance.now() >= targetEnd - 100) break;
        film.render((performance.now() - start) / 1000);
        track.requestFrame();
        frameTimes.push(performance.now() - start);
        // Yield for the video encoder even if a software renderer is behind schedule.
        await new Promise((resolve) => setTimeout(resolve, 0));
      }
      if (targetEnd > performance.now())
        await new Promise((resolve) => setTimeout(resolve, targetEnd - performance.now()));
      const stopRequestMs = performance.now() - start;
      recorder.stop();
      await complete;
      track.stop();
      const blob = new Blob(chunks, { type: film.recorderType });
      const data = await new Promise((resolve) => {
        const reader = new FileReader();
        reader.onload = () => resolve(String(reader.result).split(',')[1]);
        reader.readAsDataURL(blob);
      });
      return {
        data,
        recordingMs: performance.now() - start,
        stopRequestMs,
        frameTimes,
        requestedFps: fps,
      };
    });
    let video = Buffer.from(recorded.data, 'base64');
    if (recorded.stopRequestMs > info.duration * 1000 + 250)
      throw new Error('The native recorder fell behind its ten-second loop.');
    video = setWebmDuration(video, info.duration * 1000);
    const encodedFrameEvidence = inspectEncodedFrames(video, info.duration);
    // Check the real WebM blocks before replacing the current public movie.
    // A loaded machine can accept many capture requests but encode fewer frames.
    if (encodedFrameEvidence.averageEncodedFps < 12) {
      await writeFile(
        path.join(artifacts, 'lantern-film-rejected.json'),
        `${JSON.stringify({ reason: 'effective-frame-rate-below-12', ...encodedFrameEvidence, candidateBytes: video.length, candidateSha256: createHash('sha256').update(video).digest('hex') }, null, 2)}\n`,
      );
      throw new Error(
        `The recorder encoded only ${encodedFrameEvidence.averageEncodedFps} fps; the existing public movie was preserved.`,
      );
    }
    const videoPath = path.join(media, 'lantern-night.webm');
    await writeFile(videoPath, video);
    const decoded = await page.evaluate(async (url) => {
      const v = document.createElement('video');
      v.muted = true;
      v.src = url;
      await new Promise((resolve, reject) => {
        v.onloadedmetadata = resolve;
        v.onerror = () => reject(new Error('Exported WebM failed to load.'));
      });
      const metadata = { duration: v.duration, width: v.videoWidth, height: v.videoHeight };
      const samples = [];
      const out = document.createElement('canvas');
      out.width = v.videoWidth;
      out.height = v.videoHeight;
      const context = out.getContext('2d');
      for (const t of [0.1, Math.min(5, v.duration / 2), Math.max(0, v.duration - 0.15)]) {
        v.currentTime = t;
        await new Promise((resolve) => {
          v.onseeked = resolve;
        });
        await new Promise((resolve) => setTimeout(resolve, 60));
        context.drawImage(v, 0, 0);
        const px = context.getImageData(0, 0, out.width, out.height).data;
        let sum = 0;
        let warm = 0;
        for (let i = 0; i < px.length; i += 4) {
          sum += 0.2126 * px[i] + 0.7152 * px[i + 1] + 0.0722 * px[i + 2];
          if (px[i] > 80 && px[i] > px[i + 1] * 1.12) warm++;
        }
        samples.push({
          time: t,
          meanLuma: sum / (out.width * out.height),
          warmPixels: warm,
          image: out.toDataURL('image/png').split(',')[1],
        });
      }
      return { ...metadata, samples };
    }, `${base}/media/lantern-night.webm?render=${Date.now()}`);
    for (let i = 0; i < decoded.samples.length; i++) {
      await writeFile(
        path.join(artifacts, `lantern-film-decoded-${i}.png`),
        Buffer.from(decoded.samples[i].image, 'base64'),
      );
      delete decoded.samples[i].image;
    }
    const posterStat = await stat(path.join(media, 'lantern-night-poster.jpg'));
    const report = {
      ...info,
      fps: recorded.requestedFps,
      bytes: video.length,
      sha256: createHash('sha256').update(video).digest('hex'),
      posterBytes: posterStat.size,
      recordingMs: recorded.recordingMs,
      recorderStopRequestedAtMs: recorded.stopRequestMs,
      capturedFrames: recorded.frameTimes.length,
      encodedFrames: encodedFrameEvidence.encodedVideoFrames,
      effectiveFps: encodedFrameEvidence.averageEncodedFps,
      encodedFrameEvidence,
      encoder: 'native-mediarecorder-vp9',
      loopSeam,
      decoded,
      errors,
      createdUtc: new Date().toISOString(),
    };
    await writeFile(
      path.join(artifacts, 'lantern-film-verification.json'),
      `${JSON.stringify(report, null, 2)}\n`,
    );
    console.log(JSON.stringify({ stage: 'export-decoded', ...report }));
    if (
      errors.length ||
      decoded.width !== info.width ||
      decoded.height !== info.height ||
      decoded.duration < 8 ||
      decoded.duration > 12 ||
      decoded.samples.some((sample) => sample.meanLuma < 5 || sample.warmPixels < 1000)
    ) {
      throw new Error('Video verification failed; inspect artifacts/ninety-polish.');
    }
    createdVideo = true;
  }
} finally {
  await browser.close();
}

if (createdVideo) {
  // Exercise a fresh native HTML player after releasing the rendering GPU.
  // Seeking to selected frames alone misses failures in dependent-frame decode.
  await new Promise((resolve, reject) => {
    const verifier = spawn(
      process.execPath,
      ['scripts/lantern-film/verify-playback.mjs', '--isolated'],
      {
        cwd: root,
        env: { ...process.env, LANTERN_RENDER_URL: base },
        stdio: 'inherit',
      },
    );
    verifier.once('error', reject);
    verifier.once('exit', (code) =>
      code === 0
        ? resolve()
        : reject(new Error('Continuous native video playback or loop verification failed.')),
    );
  });
  const playback = JSON.parse(
    await readFile(path.join(artifacts, 'lantern-film-playback.json'), 'utf8'),
  );
  const reportPath = path.join(artifacts, 'lantern-film-verification.json');
  const report = JSON.parse(await readFile(reportPath, 'utf8'));
  report.continuousNativePlayback = playback.find((result) => result.mode === 'isolated');
  await writeFile(reportPath, `${JSON.stringify(report, null, 2)}\n`);
  console.log(
    JSON.stringify({
      stage: 'continuous-playback-verified',
      passed: report.continuousNativePlayback.passed,
      wraps: report.continuousNativePlayback.wraps,
    }),
  );
}

function inspectEncodedFrames(input, duration) {
  function vint(p, id = false) {
    let length = 1;
    while (length < 8 && !(input[p] & (1 << (8 - length)))) length++;
    let value = id ? input[p] : input[p] & ((1 << (8 - length)) - 1);
    for (let i = 1; i < length; i++) value = value * 256 + input[p + i];
    return { length, value };
  }
  function element(p) {
    const id = vint(p, true),
      size = vint(p + id.length);
    const data = p + id.length + size.length;
    return { id: id.value, data, end: data + size.value, size: size.value };
  }
  const header = element(0),
    segment = element(header.end);
  const timestamps = [];
  let clusters = 0;
  for (let p = segment.data; p < input.length;) {
    const item = element(p);
    if (item.id === 0x1f43b675) {
      clusters++;
      let base = 0;
      for (let q = item.data; q < Math.min(item.end, input.length);) {
        const part = element(q);
        if (part.id === 0xe7) base = input.readUIntBE(part.data, part.size);
        if (part.id === 0xa3)
          timestamps.push(base + input.readInt16BE(part.data + vint(part.data).length));
        q = part.end;
      }
    }
    p = item.end;
  }
  return {
    encodedVideoFrames: timestamps.length,
    clusters,
    firstTimestampMs: timestamps[0],
    lastTimestampMs: timestamps.at(-1),
    averageEncodedFps: timestamps.length / duration,
  };
}

// Chromium's recorder omits duration. Add the standard Matroska Info/Duration
// float so native HTML video can report a finite length without seeking to EOF.
function setWebmDuration(input, milliseconds) {
  function vint(offset, keepMarker = false) {
    const first = input[offset];
    let length = 1;
    while (length < 8 && !(first & (1 << (8 - length)))) length++;
    let value = keepMarker ? first : first & ((1 << (8 - length)) - 1);
    for (let i = 1; i < length; i++) value = value * 256 + input[offset + i];
    return { length, value };
  }
  function read(offset) {
    const id = vint(offset, true);
    const size = vint(offset + id.length);
    return {
      id: id.value,
      start: offset,
      sizeStart: offset + id.length,
      data: offset + id.length + size.length,
      size: size.value,
      sizeLength: size.length,
    };
  }
  const ebml = read(0);
  const segment = read(ebml.data + ebml.size);
  let cursor = segment.data;
  while (cursor < input.length) {
    const element = read(cursor);
    if (element.id === 0x1549a966) {
      let child = element.data;
      let scale = 1_000_000;
      while (child < element.data + element.size) {
        const part = read(child);
        if (part.id === 0x2ad7b1) scale = input.readUIntBE(part.data, part.size);
        if (part.id === 0x4489 && part.size === 8) {
          input.writeDoubleBE((milliseconds * 1_000_000) / scale, part.data);
          return input;
        }
        child = part.data + part.size;
      }
      const duration = Buffer.alloc(11);
      duration.set([0x44, 0x89, 0x88]);
      duration.writeDoubleBE((milliseconds * 1_000_000) / scale, 3);
      const newSize = element.size + duration.length;
      let sizeLength = 1;
      while (newSize >= 2 ** (7 * sizeLength) - 1) sizeLength++;
      const size = Buffer.alloc(sizeLength);
      let value = newSize;
      for (let i = sizeLength - 1; i >= 0; i--) {
        size[i] = value % 256;
        value = Math.floor(value / 256);
      }
      size[0] |= 1 << (8 - sizeLength);
      return Buffer.concat([
        input.subarray(0, element.sizeStart),
        size,
        input.subarray(element.data, element.data + element.size),
        duration,
        input.subarray(element.data + element.size),
      ]);
    }
    cursor = element.data + element.size;
  }
  throw new Error('Could not find WebM Info element.');
}
