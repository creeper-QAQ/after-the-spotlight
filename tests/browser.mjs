import { chromium } from 'playwright';
import assert from 'node:assert/strict';
import { mkdir } from 'node:fs/promises';

await mkdir('artifacts', { recursive: true });
const browser = await chromium.launch({
  executablePath: 'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',
  headless: true,
  args: ['--enable-unsafe-swiftshader', '--no-first-run'],
});
const baseUrl = process.env.TEST_BASE_URL || 'http://127.0.0.1:5173';
const errors = [];
async function check(width, height, mobile = false) {
  const page = await browser.newPage({
    viewport: { width, height },
    isMobile: mobile,
    hasTouch: mobile,
    reducedMotion: mobile ? 'reduce' : 'no-preference',
  });
  page.on('pageerror', (error) => errors.push(error.message));
  await page.route('https://player.bilibili.com/**', (route) =>
    route.fulfill({
      status: 200,
      contentType: 'text/html',
      body: '<!doctype html><title>player</title>',
    }),
  );
  await page.goto(baseUrl, { waitUntil: 'domcontentloaded' });
  await page.waitForSelector('.overture-player svg', { timeout: 30000 });
  assert.equal(await page.locator('h1').count(), 1);
  assert.equal(await page.locator('.readable-section').count(), 4);
  await page.locator('.research-archive > summary').click();
  assert.equal(
    await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth),
    true,
    `${width}px horizontal overflow`,
  );
  assert.match(await page.locator('#after').innerText(), /制作和教学继续/);
  assert.match(await page.locator('#phenomenon').innerText(), /17\.1/);
  const catalogue = page.locator('.catalogue-viz');
  if (!(await page.locator('.catalogue-annex').evaluate((node) => node.open)))
    await page.locator('.catalogue-annex > summary').click();
  await catalogue.scrollIntoViewIfNeeded();
  await page.waitForTimeout(1000);
  assert.match(await catalogue.innerText(), /99 条安徽申报地区或单位子项/);
  assert.match(await catalogue.innerText(), /72 个不同官方项目编号/);
  assert.equal(await catalogue.locator('.real-bar').count(), 10);
  await catalogue.getByRole('button', { name: '按批次' }).click();
  assert.equal(await catalogue.locator('.real-bar').count(), 5);
  if (!(await catalogue.locator('details').evaluate((node) => node.open)))
    await catalogue.locator('details > summary').click();
  await catalogue.getByRole('searchbox').fill('徽墨');
  assert.match(await catalogue.innerText(), /当前显示 3 \/ 99 条/);
  await catalogue.getByRole('searchbox').fill('');
  await catalogue.getByRole('button', { name: '按类别' }).click();
  const roster = page.locator('.delivery-people-explorer');
  await roster.scrollIntoViewIfNeeded();
  await page.waitForTimeout(1000);
  assert.match(await roster.innerText(), /119 位有出生年份 · 24 位未公布/);
  await roster.getByRole('button', { name: '出生年代' }).click();
  assert.match(await roster.innerText(), /只统计有出生年份的 119 人/);
  await roster.getByRole('button', { name: '项目关联' }).click();
  assert.match(await roster.innerText(), /CR022 的具体子项归属待复核/);
  if (!(await roster.locator('details').evaluate((node) => node.open)))
    await roster.locator('details > summary').click();
  await roster.getByRole('searchbox').fill('周美洪');
  assert.match(await roster.innerText(), /匹配 1 \/ 143 人/);
  assert.equal(await roster.getByRole('link', { name: /官方详情页/ }).count(), 1);
  const leads = page.locator('.delivery-lead-desk');
  if (!(await page.locator('.leads-annex').evaluate((node) => node.open)))
    await page.locator('.leads-annex > summary').click();
  assert.match(await leads.innerText(), /30 条线索笔记/);
  assert.match(await leads.innerText(), /14 个不同网页链接/);
  assert.equal(await leads.locator('.delivery-lead-list article').count(), 15);
  if (!(await page.locator('.report-index').evaluate((node) => node.open)))
    await page.locator('.report-index > summary').click();
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
  assert.equal(await burst.locator('.viral-stage').getAttribute('data-phase'), 'avatar-space');
  if (!mobile) {
    const film = burst.locator('.avatar-video-bg video');
    await film.waitFor();
    assert.match(await film.getAttribute('src'), /media\/lantern-night\.webm$/);
    await page.waitForFunction(() => {
      const video = document.querySelector('#viral-burst video');
      return video?.readyState >= 2 && video.currentTime > 0;
    });
    await page.getByRole('button', { name: '暂停背景灯影', exact: true }).click();
    assert.equal(await film.evaluate((video) => video.paused), true);
    await page.getByRole('button', { name: '播放背景灯影', exact: true }).click();
    await page.waitForFunction(() => !document.querySelector('#viral-burst video')?.paused);
  } else assert.equal(await burst.locator('.avatar-video-bg video').count(), 0);
  assert.equal(await burst.locator('.avatar-video-bg iframe').count(), 0);
  assert.match(
    await burst.locator('.avatar-video-credit').getAttribute('href'),
    /bilibili\.com\/video\/BV1Qd4y1V7he/,
  );
  assert.equal(await burst.locator('.swarm-avatar').count(), mobile ? 66 : 132);
  assert.equal(await burst.locator('.swarm-avatar img').count(), mobile ? 66 : 132);
  assert.equal(await burst.locator('.observer-disclaimer').count(), 0);
  await burst.getByRole('button', { name: '下一条评论' }).click();
  assert.match(await burst.locator('.crowd-reading').innerText(), /山风慢慢来/);
  await page.locator('.method-annex > summary').click();
  await page.locator('.people-annex > summary').click();
  const wall = page.locator('.evidence-investigation');
  await wall.locator('.evidence-pin').first().waitFor();
  assert.equal(await wall.locator('.evidence-pin').count(), 3);
  assert.equal(await wall.locator('.evidence-pin a').count(), 3);
  await wall.locator('.evidence-step').last().scrollIntoViewIfNeeded();
  await page.waitForTimeout(500);
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
  assert.match(await wall.innerText(), /寻找传播的起点/);
  assert.match(await wall.innerText(), /申易鑫.*授课/);
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
  await page.locator('.ai-annex > summary').click();
  const letter = page.locator('#continuity-loom');
  await letter.locator('textarea').fill('半年后如何核对体验者是否继续学习？');
  await letter.getByRole('button', { name: '发送问题', exact: true }).click();
  await letter.locator('.letter-reply[data-state="done"]').waitFor({ timeout: 20000 });
  assert.match(await letter.locator('.letter-reply p').innerText(), /未知/);
  assert.match(await letter.locator('.letter-reply p').innerText(), /匿名编号/);
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
