import assert from 'node:assert/strict';

const response = await fetch('http://127.0.0.1:5173/api/bilibili-audio', {
  headers: { Range: 'bytes=0-2047' },
});

assert.ok(
  response.status === 200 || response.status === 206,
  `unexpected audio proxy status: ${response.status}`,
);
assert.match(
  response.headers.get('content-type') ?? '',
  /audio|video|octet-stream/i,
  'audio proxy must return media content',
);

const chunk = new Uint8Array(await response.arrayBuffer());
assert.ok(chunk.byteLength > 0, 'audio proxy returned an empty body');

console.log(
  JSON.stringify(
    {
      status: response.status,
      contentType: response.headers.get('content-type'),
      bytes: chunk.byteLength,
    },
    null,
    2,
  ),
);
