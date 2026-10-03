import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const buffer = await fs.readFile(path.join(root, 'public/media/lantern-night.webm'));
function vint(p, id = false) {
  let length = 1;
  while (length < 8 && !(buffer[p] & (1 << (8 - length)))) length++;
  let value = id ? buffer[p] : buffer[p] & ((1 << (8 - length)) - 1);
  for (let i = 1; i < length; i++) value = value * 256 + buffer[p + i];
  return { length, value };
}
function element(p) {
  const id = vint(p, true),
    size = vint(p + id.length);
  const data = p + id.length + size.length;
  return { id: id.value, data, end: data + size.value, size: size.value };
}
const ebml = element(0),
  segment = element(ebml.end);
const frames = [];
for (let p = segment.data; p < buffer.length;) {
  const item = element(p);
  if (item.id === 0x1f43b675) {
    let clusterTime = 0;
    for (let q = item.data; q < Math.min(item.end, buffer.length);) {
      const part = element(q);
      if (part.id === 0xe7) clusterTime = buffer.readUIntBE(part.data, part.size);
      if (part.id === 0xa3) {
        const track = vint(part.data);
        const timestamp = clusterTime + buffer.readInt16BE(part.data + track.length);
        const flags = buffer[part.data + track.length + 2];
        frames.push({
          timestamp,
          key: Boolean(flags & 0x80),
          data: buffer.subarray(part.data + track.length + 3, part.end).toString('base64'),
        });
      }
      q = part.end;
    }
  }
  p = item.end;
}
const browser = await chromium.launch({
  executablePath: 'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',
  args: ['--enable-unsafe-swiftshader', '--no-first-run'],
});
try {
  const page = await browser.newPage();
  await page.goto('http://127.0.0.1:5173/scripts/lantern-film/playback.html');
  const result = await page.evaluate(async (frames) => {
    const results = [];
    for (const codec of ['vp09.00.10.08', 'vp09.00.31.08']) {
      for (const hardwareAcceleration of ['prefer-software', 'prefer-hardware']) {
        const config = { codec, hardwareAcceleration };
        const supported = await VideoDecoder.isConfigSupported(config);
        let decoded = 0,
          error = null,
          lastTimestamp = 0;
        const decoder = new VideoDecoder({
          output(frame) {
            decoded++;
            lastTimestamp = frame.timestamp;
            frame.close();
          },
          error(e) {
            error = e.message;
          },
        });
        try {
          decoder.configure(config);
          for (const chunk of frames) {
            if (error) break;
            const data = Uint8Array.from(atob(chunk.data), (c) => c.charCodeAt(0));
            decoder.decode(
              new EncodedVideoChunk({
                type: chunk.key ? 'key' : 'delta',
                timestamp: chunk.timestamp * 1000,
                data,
              }),
            );
            while (decoder.decodeQueueSize > 6 && !error)
              await new Promise((resolve) => setTimeout(resolve, 4));
          }
          if (!error) await decoder.flush();
        } catch (e) {
          error = error || e.message;
        }
        if (decoder.state !== 'closed') decoder.close();
        results.push({ config, supported: supported.supported, decoded, lastTimestamp, error });
      }
    }
    return results;
  }, frames);
  const report = {
    encodedFrames: frames.length,
    firstFrameHeader: Buffer.from(frames[0].data, 'base64').subarray(0, 16).toString('hex'),
    results: result,
  };
  await fs.writeFile(
    path.join(root, 'artifacts/ninety-polish/lantern-codec-diagnosis.json'),
    JSON.stringify(report, null, 2) + '\n',
  );
  console.log(JSON.stringify(report));
} finally {
  await browser.close();
}
