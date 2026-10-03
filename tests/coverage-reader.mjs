import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { chromium } from 'playwright';
const data = JSON.parse(readFileSync('src/content/public-evidence.json', 'utf8'));
const keys = ['attention', 'participation', 'namedPractice', 'sameVisitorFollowup'];
const browser = await chromium.launch({
  executablePath: 'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',
  args: ['--enable-unsafe-swiftshader'],
});
try {
  for (const width of [390, 1440]) {
    const page = await browser.newPage({
      viewport: { width, height: 900 },
      reducedMotion: 'reduce',
    });
    await page.goto('http://127.0.0.1:5173');
    const section = page.locator('#participation');
    const cards = section.locator('.coverage-counts > div');
    for (let i = 0; i < keys.length; i++) {
      assert.ok(
        (await cards.nth(i).innerText()).includes(
          `${data.coverage.filter((r) => r[keys[i]]).length}`,
        ),
      );
    }
    await section.locator('.coverage-annex > summary').click();
    await section.getByRole('button', { name: '同批追踪', exact: true }).click();
    assert.equal(await section.locator('.coverage-row:not(.coverage-head)').count(), 0);
    await section.locator('.coverage-empty').waitFor({ state: 'visible' });
    await section.getByRole('button', { name: '全部片段', exact: true }).click();
    assert.equal(
      await section.locator('.coverage-row:not(.coverage-head)').count(),
      data.coverage.length,
    );
    assert.equal(
      await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth),
      true,
    );
    await section
      .locator('.coverage-overview')
      .screenshot({ path: `artifacts/integrated-v09/${width}-coverage-counts.png` });
    await page.close();
  }
  console.log(
    'PASS: counts match selected excerpts, empty follow-up is explicit, all records restored, desktop/mobile fit.',
  );
} finally {
  await browser.close();
}
