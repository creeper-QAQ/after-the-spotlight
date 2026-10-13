import assert from 'node:assert/strict';
import { chromium } from 'playwright';
import { mkdir, readdir, writeFile } from 'node:fs/promises';
const avatarFiles = (await readdir('public/avatars/observers-web')).filter((name) =>
  /^observer-\d+\.jpg$/.test(name),
);
const avatarTotal = avatarFiles.length;
const browser = await chromium.launch({
  executablePath: 'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',
  headless: true,
  args: ['--enable-unsafe-swiftshader', '--no-first-run'],
});
await mkdir('artifacts/integrated-v09', { recursive: true });
const results = [];
try {
  for (const width of [390, 1440]) {
    const page = await browser.newPage({
      viewport: { width, height: 900 },
      hasTouch: width < 600,
      reducedMotion: 'reduce',
    });
    const errors = [];
    page.on('pageerror', (e) => errors.push(e.message));
    await page.goto(process.env.TEST_BASE_URL || 'http://127.0.0.1:5173', {
      waitUntil: 'domcontentloaded',
    });
    assert.equal(await page.locator('.research-archive').getAttribute('open'), null);
    assert.equal(
      await page.locator('#seal-atlas .heritage-seal').count(),
      99,
      '印谱必须在主线，无需打开资料卷',
    );
    assert.equal(await page.locator('#map-context').count(), 0, 'Map removed from the story');
    await page.locator('.method-annex > summary').click();
    await page.locator('.people-annex > summary').click();
    await page.locator('#evidence-method .evidence-investigation').waitFor();
    await page.locator('.people-story').first().waitFor();
    assert.equal(
      await page.locator('#evidence-method .evidence-investigation').count(),
      1,
      '调查板必须融入证据章',
    );
    assert.equal(await page.locator('.swarm-avatar img').count(), width < 600 ? 66 : 132);
    await page.locator('#viral-burst').scrollIntoViewIfNeeded();
    const positions = await page.locator('.swarm-avatar').evaluateAll(
      (ns) =>
        new Set(
          ns.map((n) => {
            const r = n.getBoundingClientRect();
            return [Math.round(r.x), Math.round(r.y)].join(',');
          }),
        ).size,
    );
    assert.equal(positions, width < 600 ? 66 : 132, 'Every avatar has a distinct position');
    assert.equal(await page.locator('.observer-disclaimer').count(), 0);
    await page
      .locator('.crowd-field')
      .evaluate((n) =>
        scrollTo({ top: n.getBoundingClientRect().top + scrollY - 110, behavior: 'instant' }),
      );
    await page.locator('.crowd-reading').scrollIntoViewIfNeeded();
    const label = await page.locator('.crowd-fiction-label').boundingBox();
    assert.ok(
      label.y >= 80 && label.y + label.height < 900,
      'Fiction label accompanies the selected comment',
    );
    const initialComment = await page.locator('.crowd-reading blockquote').innerText();
    await page.waitForTimeout(3400);
    assert.equal(
      await page.locator('.crowd-reading blockquote').innerText(),
      initialComment,
      'Comments wait for the reader, including when motion is reduced',
    );
    assert.equal(
      await page.locator('.crowd-whisper').count(),
      0,
      'No default floating comment bubbles',
    );
    await page.getByRole('button', { name: '下一条评论', exact: true }).click();
    assert.match(await page.locator('.crowd-reading').innerText(), /山风慢慢来/);
    await page.screenshot({ path: `artifacts/integrated-v09/${width}-crowd.png` });
    if (width === 390) {
      for (let i = 0; i < Math.ceil(avatarTotal / 66) - 1; i++) {
        await page.getByRole('button', { name: '换一批评论' }).click();
      }
      const selection = await page.locator('.crowd-reading blockquote').innerText();
      await page.setViewportSize({ width: 1440, height: 900 });
      const desktopRemainder = avatarTotal % 132 || 132;
      await page.waitForFunction(
        (count) => document.querySelectorAll('.swarm-avatar').length === count,
        desktopRemainder,
      );
      assert.equal(await page.locator('.crowd-reading blockquote').innerText(), selection);
      assert.equal(
        await page.locator('.swarm-avatar').count(),
        desktopRemainder,
        'Last desktop batch is valid',
      );
      await page.setViewportSize({ width: 390, height: 900 });
      const mobileRemainder = avatarTotal % 66 || 66;
      await page.waitForFunction(
        (count) => document.querySelectorAll('.swarm-avatar').length === count,
        mobileRemainder,
      );
      assert.equal(
        await page.locator('.swarm-avatar').count(),
        mobileRemainder,
        'Resize preserves last selected voice',
      );
      await page.getByRole('button', { name: '换一批评论' }).click();
    }
    const avatar = page.locator('.swarm-avatar[tabindex="0"]');
    await avatar.focus();
    await page.keyboard.press('ArrowRight');
    assert.equal(
      await page
        .locator('.swarm-avatar[tabindex="0"]')
        .evaluate((n) => n === document.activeElement),
      true,
    );
    await page
      .locator('.evidence-switch')
      .getByRole('button', { name: '徽墨制作', exact: true })
      .click();
    await page.waitForFunction(
      () => document.querySelector('.craft-studio')?.dataset.kind === 'ink',
    );
    assert.equal(await page.locator('.people-story.is-current-case[data-case="ink"]').count(), 1);
    assert.equal(await page.locator('.people-story.is-current-case[data-case="fish"]').count(), 0);
    assert.equal(await page.locator('.evidence-investigation').count(), 1);
    await page
      .locator('.evidence-investigation')
      .screenshot({ path: `artifacts/integrated-v09/${width}-investigation.png` });
    const order = await page.evaluate(() =>
      [
        'history',
        'seal-atlas',
        'phenomenon',
        'viral-burst',
        'participation',
        'craft',
        'after',
        'research',
      ].map((id) => document.getElementById(id).getBoundingClientRect().top + scrollY),
    );
    assert.ok(
      order.every((n, i) => i === 0 || n > order[i - 1]),
      'Modules follow one continuous story',
    );
    await page.locator('.research-archive > summary').click();
    const ids = await page.locator('[id]').evaluateAll((nodes) => nodes.map((n) => n.id));
    assert.equal(
      new Set(ids).size,
      ids.length,
      'Expanded materials must not duplicate main sections',
    );
    assert.equal(
      await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth),
      true,
    );
    assert.deepEqual(errors, []);
    results.push({ width, mainModulesVisible: true, linkedCase: true, errors });
    await page.close();
  }
  console.log(JSON.stringify(results, null, 2));
  await writeFile(
    'artifacts/integrated-v09/integration-results.json',
    JSON.stringify(results, null, 2),
  );
} finally {
  await browser.close();
}
