import assert from 'node:assert/strict';
import { chromium } from 'playwright';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
const evidence = JSON.parse(await readFile('src/content/public-evidence.json', 'utf8'));
const base = process.env.TEST_BASE_URL || 'http://127.0.0.1:4173';
const output = 'artifacts/ninety-polish/production';
const browser = await chromium.launch({
  executablePath: 'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',
  headless: true,
  args: ['--no-first-run'],
});
const observations = [];
await mkdir(output, { recursive: true });
try {
  for (const width of [390, 1440]) {
    const page = await browser.newPage({
      viewport: { width, height: 900 },
      reducedMotion: 'reduce',
    });
    await page.addInitScript(() => {
      const getContext = HTMLCanvasElement.prototype.getContext;
      HTMLCanvasElement.prototype.getContext = function (type, ...args) {
        return /webgl/i.test(type) ? null : getContext.call(this, type, ...args);
      };
    });
    const errors = [];
    page.on('pageerror', (e) => errors.push(e.message));
    await page.goto(base, { waitUntil: 'domcontentloaded' });
    await page.locator('.overture-enter').click();
    await page.waitForTimeout(400);
    assert.equal(new URL(page.url()).hash, '#history');
    await page.locator('#history').screenshot({ path: `${output}/${width}-findings.png` });
    await page.locator('#craft').scrollIntoViewIfNeeded();
    await page.getByRole('button', { name: '重新打开制作台' }).waitFor();
    if (width === 390) {
      const board = await page.locator('.studio-board').boundingBox(),
        side = await page.locator('.studio-side').boundingBox();
      assert.ok(board.y < side.y, 'Mobile craft board must precede detailed instructions');
    }
    await page.locator('.source-registry > summary').click();
    assert.equal(
      await page.locator('.source-registry .evidence-source-link').count(),
      evidence.sources.length,
    );
    await page.locator('.source-registry > summary').click();
    if (!(await page.locator('.method-annex').evaluate((n) => n.open)))
      await page.locator('.method-annex > summary').click();
    await page.locator('.coverage-annex > summary').click();
    assert.equal(await page.locator('.coverage-row').count(), 11);
    assert.equal(
      await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth),
      true,
    );
    await page.locator('.coverage-annex > summary').click();
    await page.locator('.measure-register > summary').click();
    assert.equal(
      await page.locator('.measure-register-grid article').count(),
      evidence.measures.length,
    );
    assert.match(
      await page.locator('[data-fact-id="fish-young-workers"]').innerText(),
      /35岁以下[\s\S]*超50/,
    );
    assert.match(await page.locator('#after').innerText(), /制作和教学继续/);
    assert.equal(await page.locator('.verdict-unknown').count(), 0);
    assert.equal(
      await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth),
      true,
    );
    await page.locator('.measure-register > summary').click();
    await page.locator('.research-archive > summary').click();
    await page.waitForSelector('.heritage-seal');
    const duplicates = await page.evaluate(() => {
      const ids = [...document.querySelectorAll('[id]')].map((n) => n.id);
      return ids.filter((id, i) => ids.indexOf(id) !== i);
    });
    assert.deepEqual(duplicates, [], 'Expanded archive must not duplicate chapter IDs');
    await page.locator('.research-archive > summary').click();
    await page.locator('.ai-annex > summary').click();
    await page.locator('#continuity-loom textarea').fill('半年后，如何核对是否继续学习？');
    assert.equal(
      await page.getByRole('button', { name: '发送问题', exact: true }).isEnabled(),
      true,
    );
    assert.equal(await page.getByRole('button', { name: '下载回访问题卡' }).isEnabled(), true);
    await page.locator('.ai-annex > summary').click();
    await page.locator('#after').screenshot({ path: `${output}/${width}-verdict.png` });
    await page.locator('.followup-guide').screenshot({ path: `${output}/${width}-followup.png` });
    await page.evaluate(() => scrollTo({ top: 0, behavior: 'instant' }));
    await page.screenshot({
      path: `${output}/${width}-main-full.png`,
      fullPage: true,
    });
    assert.deepEqual(errors, []);
    observations.push({
      width,
      webgl: false,
      mainHeight: await page.evaluate(() => document.documentElement.scrollHeight),
      errors,
    });
    await page.close();
  }
  console.log(JSON.stringify(observations, null, 2));
  await writeFile(`${output}/production-results.json`, JSON.stringify(observations, null, 2));
} finally {
  await browser.close();
}
