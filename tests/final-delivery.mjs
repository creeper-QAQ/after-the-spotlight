import assert from 'node:assert/strict';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { chromium } from 'playwright';

const base = process.env.TEST_BASE_URL || 'http://127.0.0.1:4173';
const out = 'artifacts/final-delivery/verified';
await mkdir(out, { recursive: true });
const browser = await chromium.launch({
  executablePath: 'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',
  args: ['--enable-unsafe-swiftshader', '--no-first-run'],
});
const results = [];
try {
  for (const width of [320, 390, 768, 1440]) {
    const page = await browser.newPage({
      viewport: { width, height: 900 },
      reducedMotion: 'reduce',
      hasTouch: width < 800,
    });
    const errors = [],
      apiRequests = [],
      failedLocal = [];
    page.on('pageerror', (error) => errors.push(error.message));
    page.on('request', (request) => {
      if (request.url().includes('/api/')) apiRequests.push(request.url());
    });
    page.on('response', (response) => {
      if (response.url().startsWith(base) && response.status() >= 400)
        failedLocal.push(response.url());
    });
    await page.route('**/*', (route) =>
      route.request().url().startsWith(base) ? route.continue() : route.abort(),
    );
    await page.goto(base, { waitUntil: 'domcontentloaded' });
    const links = page.locator('.people-index a');
    assert.equal(await links.count(), 3);
    for (const link of await links.all()) {
      const target = await link.getAttribute('href');
      await link.click();
      assert.equal(new URL(page.url()).hash, target);
      const article = page.locator(target);
      assert.equal(await article.count(), 1);
      const top = await article.evaluate((node) => node.getBoundingClientRect().top);
      const header = await page
        .locator('.site-header')
        .evaluate((node) => node.getBoundingClientRect().bottom);
      assert.ok(top >= header && top < 200, `${width}px person anchor hidden by header: ${top}`);
    }
    await page.locator('.people-index').screenshot({ path: `${out}/${width}-people-index.png` });
    await page.locator('.ai-annex > summary').click();
    const input = page.locator('#future-letter-input');
    const downloadButton = page.getByRole('button', { name: '下载回访问题卡' });
    await input.waitFor();
    assert.equal(await downloadButton.isDisabled(), true);
    await page.getByRole('button', { name: '半年后，怎么知道有人还在学？', exact: true }).click();
    assert.equal(await downloadButton.isEnabled(), true);
    const question = '半年后，你还在做鱼灯吗？\n请记录最近一次制作的日期，以及希望继续学习的工序。';
    await input.fill(question);
    await page.locator('.ai-annex > summary').click();
    await page.locator('.ai-annex > summary').click();
    assert.equal(await input.inputValue(), question, 'Closing the card must preserve the draft');
    assert.equal(
      await page.getByRole('button', { name: '发送问题', exact: true }).isEnabled(),
      true,
    );
    await downloadButton.focus();
    const [download] = await Promise.all([
      page.waitForEvent('download'),
      page.keyboard.press('Enter'),
    ]);
    assert.equal(await download.failure(), null);
    assert.equal(download.suggestedFilename(), '被看见之后-回访问题卡.txt');
    const card = await readFile(await download.path(), 'utf8');
    assert.ok(card.includes(question), 'Downloaded card must contain the actual reader question');
    assert.match(card, /失访人数/);
    assert.match(card, /不含采访结果/);
    assert.match(card, /匿名编号/);
    await page.locator('#continuity-loom').screenshot({
      path: `${out}/${width}-question-card.png`,
      style: '.site-header,.ink-drop-button,.skip-link{visibility:hidden}',
    });
    if (width === 390) {
      await page.evaluate(() => (document.documentElement.dataset.theme = 'night'));
      await page.locator('#continuity-loom').screenshot({
        path: `${out}/390-question-card-night.png`,
        style: '.site-header,.ink-drop-button,.skip-link{visibility:hidden}',
      });
      await page.evaluate(() => (document.documentElement.dataset.theme = 'paper'));
    }
    await page.locator('.ai-annex > summary').click();
    await page.locator('.overture-player svg').waitFor();
    await page.evaluate(() => scrollTo({ top: 0, behavior: 'instant' }));
    await page.screenshot({ path: `${out}/${width}-opening.png` });
    assert.equal(
      await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth),
      true,
    );
    assert.deepEqual(
      apiRequests,
      [],
      'Static reading and card downloads must make no API requests',
    );
    assert.deepEqual(errors, []);
    assert.deepEqual(failedLocal, []);
    results.push({
      width,
      cardDownloaded: true,
      draftSurvivesCollapse: true,
      personLinks: 3,
      apiRequests,
      errors,
      failedLocal,
    });
    await page.close();
  }
} finally {
  await browser.close();
}
await writeFile(`${out}/results.json`, JSON.stringify(results, null, 2));
console.log(JSON.stringify(results, null, 2));
