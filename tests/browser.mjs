import { chromium } from 'playwright';
import assert from 'node:assert/strict';
import { mkdir } from 'node:fs/promises';

await mkdir('artifacts', { recursive: true });
const browser = await chromium.launch({
  executablePath: 'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',
  headless: true,
  args: ['--enable-unsafe-swiftshader', '--no-first-run'],
});
const errors = [];
async function check(width, height, mobile = false) {
  const page = await browser.newPage({
    viewport: { width, height },
    isMobile: mobile,
    hasTouch: mobile,
    reducedMotion: mobile ? 'reduce' : 'no-preference',
  });
  page.on('pageerror', (error) => errors.push(error.message));
  await page.goto('http://127.0.0.1:5173', { waitUntil: 'networkidle' });
  await page.waitForSelector('.overture-player svg', { timeout: 30000 });
  assert.equal(await page.locator('h1').count(), 1);
  assert.equal(await page.locator('section[id]').count(), 11);
  assert.equal(
    await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth),
    true,
    `${width}px horizontal overflow`,
  );
  assert.match(
    await page.locator('#after .verdict-note').innerText(),
    /目前不能说“走红带来了传承”/,
  );
  assert.match(await page.locator('#phenomenon').innerText(), /超15万/);
  const catalogue = page.locator('.catalogue-viz');
  await page.locator('.catalogue-annex > summary').click();
  assert.match(await catalogue.innerText(), /99 条安徽申报地区或单位子项/);
  assert.match(await catalogue.innerText(), /72 个不同官方项目编号/);
  assert.equal(await catalogue.locator('.real-bar').count(), 10);
  await catalogue.getByRole('button', { name: '按批次' }).click();
  assert.equal(await catalogue.locator('.real-bar').count(), 5);
  await catalogue.locator('summary').click();
  await catalogue.getByRole('searchbox').fill('徽墨');
  assert.match(await catalogue.innerText(), /当前显示 3 \/ 99 条/);
  await catalogue.getByRole('searchbox').fill('');
  await catalogue.getByRole('button', { name: '按类别' }).click();
  const roster = page.locator('.delivery-people-explorer');
  assert.match(await roster.innerText(), /119 位有出生年份 · 24 位未公布/);
  await roster.getByRole('button', { name: '出生年代' }).click();
  assert.match(await roster.innerText(), /只统计有出生年份的 119 人/);
  await roster.getByRole('button', { name: '项目关联' }).click();
  assert.match(await roster.innerText(), /CR022 的具体子项归属待复核/);
  await roster.locator('summary').click();
  await roster.getByRole('searchbox').fill('周美洪');
  assert.match(await roster.innerText(), /匹配 1 \/ 143 人/);
  assert.equal(await roster.getByRole('link', { name: /官方详情页/ }).count(), 1);
  const leads = page.locator('.delivery-lead-desk');
  await page.locator('.leads-annex > summary').click();
  assert.match(await leads.innerText(), /30 条线索笔记/);
  assert.match(await leads.innerText(), /14 个不同网页链接/);
  assert.equal(await leads.locator('.delivery-lead-list article').count(), 15);
  await leads.getByRole('button', { name: '徽墨' }).click();
  assert.equal(await leads.locator('.delivery-lead-list article').count(), 15);
  await leads.getByRole('button', { name: '工艺' }).click();
  assert.ok((await leads.locator('.delivery-lead-list article').count()) > 0);
  await catalogue.screenshot({ path: `artifacts/${mobile ? 'mobile' : 'desktop'}-catalogue.png` });
  await roster.screenshot({ path: `artifacts/${mobile ? 'mobile' : 'desktop'}-people.png` });
  await leads.screenshot({ path: `artifacts/${mobile ? 'mobile' : 'desktop'}-leads.png` });
  const burst = page.locator('#viral-burst');
  const burstBounds = await burst.evaluate((node) => ({
    top: node.offsetTop,
    height: node.offsetHeight,
  }));
  await page.evaluate(
    (y) => scrollTo({ top: y, behavior: 'instant' }),
    burstBounds.top + (burstBounds.height - height) * 0.36,
  );
  await page.waitForTimeout(100);
  assert.equal(await burst.locator('.viral-stage').getAttribute('data-phase'), '1');
  assert.match(await burst.locator('.viral-fact').innerText(), /超15万/);
  const beforeSpread = mobile ? await burst.locator('.viral-canvas').screenshot() : null;
  await page.evaluate(
    (y) => scrollTo({ top: y, behavior: 'instant' }),
    burstBounds.top + (burstBounds.height - height) * 0.63,
  );
  await page.waitForTimeout(1600);
  assert.equal(await burst.locator('.viral-stage').getAttribute('data-phase'), '2');
  assert.equal(await burst.locator('.viral-copy').count(), 1);
  assert.match(await burst.locator('.viral-fact').innerText(), /300余场/);
  assert.match(await burst.locator('.viral-secondary').innerText(), /超1500人次/);
  assert.match(
    await burst.locator('.viral-fact a').getAttribute('href'),
    /news\.cn\/local\/20251107/,
  );
  if (beforeSpread)
    assert.notDeepEqual(beforeSpread, await burst.locator('.viral-canvas').screenshot());
  assert.match(await burst.locator('.viral-bottom').innerText(), /不编码人数/);
  await burst.getByRole('button', { name: '轻点画面，试着点亮一束光' }).click();
  assert.match(await burst.locator('.viral-pulse-indicator').innerText(), /已点亮 1 次光波/);
  await page.screenshot({ path: `artifacts/${mobile ? 'mobile' : 'desktop'}-viral-burst.png` });
  await page.evaluate(
    (y) => scrollTo({ top: y, behavior: 'instant' }),
    burstBounds.top + (burstBounds.height - height) * 0.92,
  );
  await page.waitForTimeout(120);
  assert.equal(await burst.locator('.viral-stage').getAttribute('data-phase'), '3');
  assert.match(await burst.locator('.viral-copy').innerText(), /还有谁留下/);
  const wall = page.locator('.evidence-investigation');
  assert.equal(await wall.locator('.evidence-pin').count(), 3);
  assert.equal(await wall.locator('.evidence-pin a').count(), 3);
  await wall.locator('.evidence-step').last().scrollIntoViewIfNeeded();
  await page.waitForTimeout(100);
  assert.equal(await wall.locator('.evidence-step.is-active').getAttribute('data-step'), '2');
  assert.equal(await wall.locator('.evidence-thread path').last().getAttribute('opacity'), '1');
  if (mobile) {
    const board = await wall.locator('.evidence-board').boundingBox();
    assert.ok(
      board && board.y >= 60 && board.y < 80,
      'mobile evidence board stays visible while scrolling',
    );
  }
  await page.screenshot({ path: `artifacts/${mobile ? 'mobile' : 'desktop'}-evidence-active.png` });
  await wall.getByRole('button', { name: '徽墨制作' }).click();
  assert.match(await wall.innerText(), /证据空白/);
  assert.match(await wall.innerText(), /申易鑫持续授课/);
  assert.equal(await wall.locator('.evidence-pin a').count(), 2);
  await page
    .locator('#case-followup')
    .screenshot({ path: `artifacts/${mobile ? 'mobile' : 'desktop'}-evidence-wall.png` });
  await page.getByRole('button', { name: /数据口径与来源/ }).click();
  assert.equal(await page.locator('.source-dialog').evaluate((node) => node.open), true);
  await page.keyboard.press('Escape');
  await page.screenshot({
    path: `artifacts/${mobile ? 'mobile' : 'desktop'}-full.png`,
    fullPage: true,
  });
  if (mobile) {
    await page.setViewportSize({ width: 320, height: 800 });
    assert.equal(
      await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth),
      true,
      '320px horizontal overflow',
    );
  }
  await page.close();
}
try {
  await check(1440, 1000);
  await check(390, 844, true);
  assert.deepEqual(errors, []);
  console.log('Narrative, scroll evidence wall, source links and responsive layout pass.');
} finally {
  await browser.close();
}
