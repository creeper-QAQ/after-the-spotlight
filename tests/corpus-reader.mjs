import assert from 'node:assert/strict';
import { mkdir, writeFile } from 'node:fs/promises';
import { chromium } from 'playwright';

const browser = await chromium.launch({
  executablePath: 'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',
  headless: true,
  args: ['--enable-unsafe-swiftshader', '--no-first-run'],
});
const output = 'artifacts/ninety-polish/corpus-reader';
await mkdir(output, { recursive: true });
const results = [];
try {
  for (const width of [320, 390, 768, 1440]) {
    const page = await browser.newPage({
      viewport: { width, height: 900 },
      reducedMotion: 'reduce',
    });
    const errors = [];
    page.on('pageerror', (error) => errors.push(error.message));
    await page.goto(process.env.TEST_BASE_URL || 'http://127.0.0.1:5173', {
      waitUntil: 'domcontentloaded',
    });
    await page.locator('.method-annex > summary').click();
    await page.locator('#corpus-audit').scrollIntoViewIfNeeded();
    await page.locator('.corpus-audit').waitFor();
    assert.equal(await page.locator('.corpus-ruler i').count(), 94);
    assert.equal(await page.locator('.corpus-ruler .is-current').count(), 24);
    assert.match(await page.locator('.corpus-audit').innerText(), /28种非空单位写法/);
    const bars = page.locator('.corpus-unit-bars button');
    assert.equal(await bars.count(), 10);
    const counts = await bars.evaluateAll((nodes) =>
      nodes.map((node) => Number(node.querySelector('b').firstChild.textContent)),
    );
    assert.equal(
      counts.reduce((sum, count) => sum + count, 0),
      94,
    );
    await page.getByRole('button', { name: /单位缺失.*3.*94/ }).click();
    assert.equal(await page.locator('.corpus-ruler .is-current').count(), 3);
    assert.equal(await page.locator('.corpus-records li').count(), 3);
    assert.match(await page.locator('.corpus-records').innerText(), /定性资料|方法资料/);
    for (const href of await page
      .locator('.corpus-records li a')
      .evaluateAll((nodes) => nodes.map((node) => node.href))) {
      assert.match(href, /^https:\/\//);
    }
    await page.getByRole('button', { name: /人数类.*8.*94/ }).click();
    assert.equal(await page.locator('.corpus-ruler .is-current').count(), 8);
    await page.getByRole('button', { name: '查看这一类的全部8条 ↓' }).click();
    assert.equal(await page.locator('.corpus-records li').count(), 8);
    await page.getByRole('button', { name: '收回到前三条 ↑' }).click();
    assert.equal(await page.locator('.corpus-records li').count(), 3);
    assert.match(
      await page.locator('.corpus-grain-note').innerText(),
      /30条用途笔记，来自14个网页链接/,
    );
    assert.equal(
      await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth),
      true,
    );
    assert.deepEqual(errors, []);
    await page.locator('.corpus-audit').screenshot({ path: `${output}/${width}.png` });
    results.push({ width, rows: 94, classified: 94, linkedSources: true, overflow: false, errors });
    await page.close();
  }
  await writeFile(`${output}/results.json`, JSON.stringify(results, null, 2));
  console.log(JSON.stringify(results, null, 2));
} finally {
  await browser.close();
}
