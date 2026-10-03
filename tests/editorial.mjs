import assert from 'node:assert/strict';
import { chromium } from 'playwright';
import { mkdir, writeFile } from 'node:fs/promises';
const browser = await chromium.launch({
  executablePath: 'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',
  headless: true,
  args: ['--enable-unsafe-swiftshader', '--no-first-run'],
});
const results = [];
await mkdir('artifacts/integrated-v09', { recursive: true });
try {
  for (const width of [320, 390, 768, 1440]) {
    const page = await browser.newPage({
      viewport: { width, height: 900 },
      isMobile: width < 650,
      hasTouch: width < 650,
    });
    const errors = [];
    page.on('pageerror', (e) => errors.push(e.message));
    await page.route('https://player.bilibili.com/**', (r) => r.abort());
    await page.goto(process.env.TEST_BASE_URL || 'http://127.0.0.1:5173', {
      waitUntil: 'domcontentloaded',
    });
    await page.locator('h1').waitFor();
    assert.equal(
      await page.locator('.editorial-findings').count(),
      1,
      'Three source-backed findings must be near the opening',
    );
    assert.equal(await page.locator('.editorial-finding').count(), 3);
    assert.ok(
      (await page
        .locator('.editorial-findings')
        .evaluate((n) => n.getBoundingClientRect().top + scrollY)) < 1900,
      'Findings must arrive early',
    );
    assert.equal(
      await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth),
      true,
      `${width}: overflow`,
    );
    const baseHeight = await page.evaluate(() => document.documentElement.scrollHeight);
    const reader = page.locator('.evidence-reader');
    await reader.scrollIntoViewIfNeeded();
    await reader.getByRole('button', { name: '接待人次', exact: true }).click();
    assert.match(await reader.innerText(), /19/);
    assert.match(await reader.innerText(), /同一人/);
    assert.match(await reader.innerText(), /不能/);
    await reader.getByRole('button', { name: '持续学习', exact: true }).click();
    assert.match(await reader.innerText(), /未知/);
    assert.equal(await reader.locator('.evidence-missing-rate').count(), 1);
    assert.equal(await page.locator('.people-story').count(), 3);
    assert.match(await page.locator('#after').innerText(), /体验者.*未知|体验者.*未|同一批/);
    assert.equal(await page.locator('.research-archive').getAttribute('open'), null);
    assert.equal(await page.locator('#participation').count(), 1);
    await page.locator('#viral-burst').scrollIntoViewIfNeeded();
    assert.ok(
      await page.locator('.observer-disclaimer').isVisible(),
      'Fiction notice must be visible on mobile',
    );
    assert.equal(
      await page.locator('.swarm-avatar img').count(),
      width < 650 ? 66 : 132,
      'Original avatar assets remain in narrative',
    );
    await page.waitForTimeout(5200);
    assert.ok(
      await page.locator('.video-fallback-note').isVisible(),
      'Blocked external video must have an explicit fallback',
    );
    await page.locator('#intro').evaluate((n) => scrollTo({ top: 0, behavior: 'instant' }));
    await page.waitForTimeout(350);
    await page.screenshot({ path: `artifacts/integrated-v09/${width}-opening.png` });
    await page
      .locator('#participation')
      .evaluate((n) =>
        scrollTo({ top: n.getBoundingClientRect().top + scrollY - 75, behavior: 'instant' }),
      );
    await page.screenshot({ path: `artifacts/integrated-v09/${width}-evidence.png` });
    await page
      .locator('#case-followup')
      .evaluate((n) =>
        scrollTo({ top: n.getBoundingClientRect().top + scrollY - 75, behavior: 'instant' }),
      );
    await page.screenshot({ path: `artifacts/integrated-v09/${width}-people.png` });
    assert.deepEqual(errors, [], `${width}: runtime errors`);
    results.push({ width, baseHeight, errors });
    await page.close();
  }
  console.log(JSON.stringify(results, null, 2));
  await writeFile(
    'artifacts/integrated-v09/editorial-results.json',
    JSON.stringify(results, null, 2),
  );
} finally {
  await browser.close();
}
