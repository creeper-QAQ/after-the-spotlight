import assert from 'node:assert/strict';
import { chromium } from 'playwright';
import { mkdir, writeFile } from 'node:fs/promises';

const base = process.env.TEST_BASE_URL || 'http://127.0.0.1:5185';
const contentOnly = process.argv.includes('--content');
const out = 'artifacts/readable-story';
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
    });
    const errors = [],
      mapRequests = [];
    page.on('pageerror', (e) => errors.push(e.message));
    page.on('request', (r) => {
      if (/geojson|GeoAtlas|chinaMap|splatViewer/.test(r.url())) mapRequests.push(r.url());
    });
    await page.goto(base, { waitUntil: 'domcontentloaded' });
    assert.equal(
      await page.locator('main #history').count(),
      1,
      'The story must begin with craft history',
    );
    assert.equal(await page.locator('.overture-enter').getAttribute('href'), '#history');
    const order = await page.evaluate(() =>
      ['history', 'phenomenon', 'participation', 'after'].map(
        (id) => document.getElementById(id).getBoundingClientRect().top,
      ),
    );
    assert.ok(
      order.every((y, i) => i === 0 || y > order[i - 1]),
      'History, attention, learning and daily practice must be in order',
    );
    assert.equal(await page.locator('#map-context').count(), 0);
    assert.equal(await page.locator('#research .people-story').count(), 0);
    const mainText = await page.evaluate(() =>
      [...document.querySelector('main').children]
        .filter((n) => n.id !== 'research')
        .map((n) => n.innerText)
        .join('\n'),
    );
    assert.ok(
      (mainText.match(/17\.1/g) || []).length <= 1,
      'Main story repeats the same playback figure',
    );
    assert.doesNotMatch(mainText, /可支持|需止步|原创声音示意|还差一段没接上|不能确认/);
    assert.match(await page.locator('#participation').innerText(), /陈贤杰[\s\S]*学习制作鱼灯/);
    assert.match(await page.locator('#after').innerText(), /2000|5\.1/);
    await page.locator('.people-annex > summary').click();
    await page.locator('#research .people-story').first().waitFor();
    assert.equal(await page.locator('#research .people-story').count(), 3);
    await page.locator('.people-annex > summary').click();
    await page.locator('.method-annex > summary').click();
    await page.locator('.coverage-annex > summary').click();
    assert.equal(await page.locator('.coverage-row:not(.coverage-head)').count(), 10);
    await page.locator('.method-annex > summary').click();
    const duplicateIds = await page.evaluate(() => {
      const ids = [...document.querySelectorAll('[id]')].map((n) => n.id);
      return ids.filter((id, i) => ids.indexOf(id) !== i);
    });
    assert.deepEqual(duplicateIds, []);
    await page.locator('#phenomenon .story-source-note').first().click();
    assert.equal(
      await page
        .locator('.source-registry')
        .evaluate((n) => n.open),
      true,
    );
    await page
      .locator('.source-registry')
      .evaluate((n) => (n.open = false));
    if (!contentOnly) {
      await page.evaluate(() => scrollTo({ top: 0, behavior: 'instant' }));
      const trigger = page.locator('header').getByRole('button', { name: '阅读设置' });
      const rect = await trigger.boundingBox();
      assert.ok(rect.height >= 44 && rect.width >= 44);
      await trigger.click();
      await page.getByRole('button', { name: '减少动态', exact: true }).click();
      assert.equal(await page.evaluate(() => document.documentElement.dataset.motion), 'off');
      await page.keyboard.press('Escape');
      assert.equal(await trigger.evaluate((n) => n === document.activeElement), true);
      await page.locator('#viral-burst').scrollIntoViewIfNeeded();
      assert.equal(await page.locator('#viral-burst video').count(), 0);
      await page.locator('#seal-atlas').scrollIntoViewIfNeeded();
      const positions = await page
        .locator('.heritage-seal')
        .first()
        .evaluate((n) => n.getAttribute('style'));
      await page.waitForTimeout(400);
      assert.equal(
        await page
          .locator('.heritage-seal')
          .first()
          .evaluate((n) => n.getAttribute('style')),
        positions,
      );
    }
    assert.equal(
      await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth),
      true,
    );
    assert.deepEqual(mapRequests, []);
    assert.deepEqual(errors, []);
    await page
      .locator('#participation')
      .screenshot({
        path: `${out}/${width}-learning.png`,
        style: '.site-header,.ink-drop-button{visibility:hidden}',
      });
    await page.evaluate(() => scrollTo({ top: 0, behavior: 'instant' }));
    await page.waitForTimeout(150);
    await page.screenshot({ path: `${out}/${width}-opening.png` });
    results.push({ width, chaptersOrdered: true, mapRequests, errors, contentOnly });
    await page.close();
  }
} finally {
  await browser.close();
}
await writeFile(`${out}/results.json`, JSON.stringify(results, null, 2));
console.log(JSON.stringify(results, null, 2));
