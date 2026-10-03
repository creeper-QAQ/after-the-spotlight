import { chromium } from 'playwright';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
const data = JSON.parse(await readFile('src/content/reports.json', 'utf8'));
assert.equal(data.indicators.length, 94);
assert.equal(
  data.indicators.some((r) => r.id === 'ZB051'),
  false,
);
assert.equal(data.indicators.find((r) => r.id === 'ZB050').status, '计划目标');
assert.equal(data.indicators.find((r) => r.id === 'ZB071').value, 10000);
assert.equal(data.indicators.find((r) => r.id === 'ZB042').valueText, '超2000');
assert.match(data.indicators.find((r) => r.id === 'ZB052').period, /具体起止原文未写明/);
const browser = await chromium.launch({
  executablePath: 'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',
  args: ['--enable-unsafe-swiftshader'],
});
try {
  for (const width of [1440, 390]) {
    const page = await browser.newPage({
      viewport: { width, height: 1000 },
      reducedMotion: 'reduce',
    });
    const errors = [];
    page.on('pageerror', (e) => errors.push(e.message));
    await page.goto('http://127.0.0.1:5173', { waitUntil: 'domcontentloaded' });
    await page.locator('.research-archive > summary').click();
    const section = page.locator('#report-observatory');
    await section.scrollIntoViewIfNeeded();
    assert.equal(await section.locator('.report-card').count(), 4);
    assert.match(await section.innerText(), /19万人次/);
    await section.getByRole('button', { name: '鱼灯', exact: true }).click();
    assert.match(await section.locator('.report-card').innerText(), /17.1亿次/);
    assert.equal(
      await section.locator('.report-card a').getAttribute('href'),
      'https://www.yangtse.com/news/community/202502/t20250218_188027.html',
    );
    await section.getByRole('button', { name: '文旅与产业', exact: true }).click();
    assert.match(await section.locator('.report-card').innerText(), /231个/);
    await section.getByRole('button', { name: '徽墨', exact: true }).click();
    await section.screenshot({ path: `artifacts/reports-${width}.png` });
    assert.equal(await section.locator('.report-index').getAttribute('open'), null);
    await section.locator('.report-index > summary').click();
    assert.match(await section.getByRole('status').innerText(), /94/);
    await section.getByLabel('复核状态').selectOption('计划目标');
    assert.match(await section.getByRole('status').innerText(), /1/);
    assert.match(await section.locator('.report-index-list').innerText(), /530/);
    await section.getByLabel('复核状态').selectOption('全部');
    await section.getByLabel('查找指标').fill('ZB083');
    await section.locator('.report-index-row > summary').click();
    assert.match(await section.locator('.report-index-row').innerText(), /统计截止未详/);
    await section.getByLabel('查找指标').fill('ZB051');
    assert.match(await section.getByRole('status').innerText(), /0/);
    assert.equal(
      await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth),
      true,
    );
    assert.deepEqual(errors, []);
    await page.close();
  }
  console.log(
    'Member4 data references, deduplication, qualifiers, featured cards, filters and responsive layout passed.',
  );
} finally {
  await browser.close();
}
