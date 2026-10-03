import { createServer } from 'node:http';
import { readFile, stat } from 'node:fs/promises';
import path from 'node:path';
const root = path.resolve('dist');
const prefix = '/after-the-spotlight/';
const mime = {
  '.html': 'text/html',
  '.js': 'text/javascript',
  '.css': 'text/css',
  '.json': 'application/json',
  '.geojson': 'application/geo+json',
  '.jpg': 'image/jpeg',
  '.png': 'image/png',
  '.svg': 'image/svg+xml',
  '.webm': 'video/webm',
};
const server = createServer(async (request, response) => {
  try {
    const url = new URL(request.url, 'http://localhost');
    if (!url.pathname.startsWith(prefix)) {
      response.writeHead(404).end();
      return;
    }
    const file = path.resolve(
      root,
      decodeURIComponent(url.pathname.slice(prefix.length)) || 'index.html',
    );
    if (!file.startsWith(root + path.sep)) {
      response.writeHead(404).end();
      return;
    }
    const info = await stat(file);
    if (!info.isFile()) {
      response.writeHead(404).end();
      return;
    }
    const bytes = await readFile(file);
    response.setHeader('Content-Type', mime[path.extname(file)] || 'application/octet-stream');
    response.setHeader('Accept-Ranges', 'bytes');
    const range = /^bytes=(\d+)-(\d*)$/.exec(request.headers.range || '');
    if (range) {
      const start = Number(range[1]),
        end = range[2] ? Math.min(Number(range[2]), bytes.length - 1) : bytes.length - 1;
      if (start > end) {
        response.writeHead(416).end();
        return;
      }
      response
        .writeHead(206, {
          'Content-Range': `bytes ${start}-${end}/${bytes.length}`,
          'Content-Length': end - start + 1,
        })
        .end(request.method === 'HEAD' ? undefined : bytes.subarray(start, end + 1));
    } else
      response
        .writeHead(200, { 'Content-Length': bytes.length })
        .end(request.method === 'HEAD' ? undefined : bytes);
  } catch {
    response.writeHead(404).end();
  }
});
await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
process.env.TEST_BASE_URL = `http://127.0.0.1:${server.address().port}${prefix}`;
try {
  await import('./local-reply-browser.mjs');
  console.log(
    'GitHub Pages project subpath passes with no fallback server, no API and no missing local assets.',
  );
} finally {
  await new Promise((resolve) => server.close(resolve));
}
