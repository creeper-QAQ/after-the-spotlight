import assert from 'node:assert/strict';
import { chromium } from 'playwright';
import { mkdir, readFile } from 'node:fs/promises';
const base = process.env.TEST_BASE_URL || 'http://127.0.0.1:4173';
await mkdir('artifacts/local-reply', { recursive: true });
const browser = await chromium.launch({
  executablePath: 'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',
  headless: true,
  args: ['--enable-unsafe-swiftshader', '--no-first-run'],
});
try {
  for (const width of [390, 1440]) {
    const page = await browser.newPage({
      viewport: { width, height: 900 },
      reducedMotion: 'no-preference',
    });
    const apiRequests = [],
      errors = [],
      failedLocal = [];
    page.on('request', (req) => {
      if (req.url().includes('/api/')) apiRequests.push(req.url());
    });
    page.on('pageerror', (error) => errors.push(error.message));
    page.on('requestfailed', (request) => {
      if (new URL(request.url()).origin === new URL(base).origin) failedLocal.push(request.url());
    });
    page.on('response', (response) => {
      if (new URL(response.url()).origin === new URL(base).origin && response.status() >= 400)
        failedLocal.push(`${response.status()} ${response.url()}`);
    });
    await page.route('**/*', (route) =>
      route.request().url().startsWith(base) ? route.continue() : route.abort(),
    );
    await page.goto(base, { waitUntil: 'domcontentloaded' });
    await page.locator('.ai-annex > summary').click();
    const root = page.locator('#continuity-loom');
    const input = root.locator('textarea');
    const send = root.locator('button[type="submit"]');
    assert.equal(await send.isDisabled(), true);
    await input.fill('我想学徽墨，从哪里开始？');
    await send.click();
    await page.waitForFunction(
      () => (document.querySelector('.letter-reply p')?.textContent?.length || 0) > 8,
    );
    const partial = await root.locator('.letter-reply p').innerText();
    assert.equal(await send.isDisabled(), true);
    await root.getByRole('button', { name: '停止回复', exact: true }).click();
    const stopped = await root.locator('.letter-reply p').innerText();
    await page.waitForTimeout(300);
    assert.equal(await root.locator('.letter-reply p').innerText(), stopped);
    await root.getByRole('button', { name: '继续回复', exact: true }).click();
    await root.locator('.letter-reply[data-state="done"]').waitFor({ timeout: 20000 });
    const full = await root.locator('.letter-reply p').innerText();
    assert.ok(full.length > partial.length);
    assert.match(full, /徽墨/);
    await root.getByRole('button', { name: '那要多久呢？', exact: true }).click();
    assert.equal(await input.inputValue(), '那要多久呢？');
    await input.press('Control+Enter');
    await root.locator('.letter-reply[data-state="done"]').waitFor({ timeout: 20000 });
    assert.match(await root.locator('.letter-reply p').innerText(), /半年以上/);
    assert.equal(await root.locator('.reply-sources a[data-source-id="pub-ink-2026"]').count(), 1);
    await root.locator('.reply-history > summary').click();
    assert.match(await root.locator('.reply-history').innerText(), /我想学徽墨/);
    await input.fill('明天上海天气怎么样？');
    await send.click();
    await root.locator('.letter-reply[data-state="done"]').waitFor({ timeout: 20000 });
    assert.match(await root.locator('.letter-reply p').innerText(), /超出|没有对应资料/);
    assert.doesNotMatch(await root.innerText(), /AI 生成|请 AI|模型接口/);
    const [download] = await Promise.all([
      page.waitForEvent('download'),
      root.getByRole('button', { name: '下载回访问题卡' }).click(),
    ]);
    assert.match(await readFile(await download.path(), 'utf8'), /明天上海天气/);
    assert.deepEqual(apiRequests, []);
    assert.deepEqual(errors, []);
    assert.deepEqual(failedLocal, []);
    assert.equal(
      await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth),
      true,
    );
    await root.screenshot({ path: `artifacts/local-reply/${width}-conversation.png` });
    await page.locator('header').getByRole('button', { name: '阅读设置' }).click();
    await page.getByRole('button', { name: '减少动态', exact: true }).click();
    await page.keyboard.press('Escape');
    await input.fill('我想开始学习鱼灯，该从哪里入手？');
    await send.click();
    await root.locator('.letter-reply[data-state="done"]').waitFor({ timeout: 500 });
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await input.fill('鱼灯体验过的人后来还有多少在学？');
    await send.click();
    await root.locator('.letter-reply[data-state="done"]').waitFor({ timeout: 2000 });
    assert.match(await root.locator('.letter-reply p').innerText(), /未知/);
    await root.getByRole('button', { name: '清空对话', exact: true }).click();
    assert.equal(await root.locator('.letter-reply').count(), 0);
    assert.equal(await input.inputValue(), '');
    await page.close();
  }
  console.log(
    'Local replies pass on desktop/mobile: incremental display, stop/resume, context, sources, history, fallback, downloads, reduced motion, zero API requests.',
  );
} finally {
  await browser.close();
}
