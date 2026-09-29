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
async function open(viewport, mobile = false) {
  const page = await browser.newPage({
    viewport,
    isMobile: mobile,
    hasTouch: mobile,
    reducedMotion: mobile ? 'reduce' : 'no-preference',
  });
  page.on('pageerror', (error) => errors.push(error.message));
  await page.goto('http://127.0.0.1:5173', { waitUntil: 'networkidle' });
  await page.locator('#craft').scrollIntoViewIfNeeded();
  return page;
}
async function finishStep(page, names) {
  const studio = page.locator('.craft-studio');
  const before = Number(await studio.getAttribute('data-step'));
  for (const name of names) await studio.getByRole('button', { name, exact: true }).click();
  assert.equal(
    await studio.getByRole('button', { name: /进入下一工序|查看体验结果/ }).isVisible(),
    true,
  );
  await studio.getByRole('button', { name: /进入下一工序|查看体验结果/ }).click();
  assert.equal(Number(await studio.getAttribute('data-step')), before + 1);
}
try {
  const desktop = await open({ width: 1440, height: 1000 });
  const studio = desktop.locator('.craft-studio');
  assert.match(await studio.locator('.studio-instruction').innerText(), /四处连接点/);
  await finishStep(desktop, ['鱼头连接处', '鱼背连接处', '鱼腹连接处', '鱼尾连接处']);
  const paperBoard = await studio.locator('.studio-board').boundingBox();
  assert.ok(paperBoard);
  await desktop.mouse.move(
    paperBoard.x + paperBoard.width * 0.29,
    paperBoard.y + paperBoard.height * 0.5,
  );
  await desktop.mouse.down();
  await desktop.mouse.move(
    paperBoard.x + paperBoard.width * 0.69,
    paperBoard.y + paperBoard.height * 0.5,
    { steps: 24 },
  );
  await desktop.mouse.up();
  assert.equal(
    await studio.locator('.studio-count strong').innerText(),
    '4',
    'swiping across paper regions covers all four',
  );
  await studio.getByRole('button', { name: '进入下一工序 ↗' }).click();
  await studio.getByRole('button', { name: '青绿' }).click();
  assert.equal(
    await studio.getByRole('button', { name: '青绿' }).getAttribute('aria-pressed'),
    'true',
  );
  await finishStep(desktop, [
    '第1片上鳞',
    '第1片下鳞',
    '第2片上鳞',
    '第2片下鳞',
    '第3片上鳞',
    '第3片下鳞',
  ]);
  await finishStep(desktop, ['点亮鱼灯']);
  assert.equal(await studio.getAttribute('data-complete'), 'true');
  assert.match(await studio.locator('.studio-complete').innerText(), /真正的传承/);
  await desktop.locator('#craft').screenshot({ path: 'artifacts/studio-desktop-fish.png' });
  await studio.getByRole('button', { name: '徽墨 · 6 道工序' }).click();
  await finishStep(desktop, ['第一处烟料', '第二处烟料', '第三处烟料']);
  await finishStep(desktop, ['沿碗上方搅拌', '沿碗右侧搅拌', '沿碗下方搅拌', '沿碗左侧搅拌']);
  await finishStep(desktop, ['落下第一槌', '落下第二槌', '落下第三槌']);
  const leverStart = await studio.getByRole('button', { name: '压杆起点' }).boundingBox();
  const leverEnd = await studio.getByRole('button', { name: '压杆落点' }).boundingBox();
  assert.ok(leverStart && leverEnd);
  await desktop.mouse.move(
    leverStart.x + leverStart.width / 2,
    leverStart.y + leverStart.height / 2,
  );
  await desktop.mouse.down();
  await desktop.mouse.move(leverEnd.x + leverEnd.width / 2, leverEnd.y + leverEnd.height / 2, {
    steps: 10,
  });
  await desktop.mouse.up();
  assert.match(await studio.locator('.studio-feedback').innerText(), /做到了/);
  await studio.getByRole('button', { name: '进入下一工序 ↗' }).click();
  await studio.getByRole('button', { name: '烈日暴晒' }).click();
  assert.match(await studio.locator('.studio-feedback').innerText(), /干燥过快/);
  await finishStep(desktop, ['阴凉晾架']);
  await finishStep(desktop, ['描上第一处金纹', '描上第二处金纹', '描上第三处金纹']);
  assert.equal(await studio.getAttribute('data-complete'), 'true');
  await desktop.locator('#craft').screenshot({ path: 'artifacts/studio-desktop-ink.png' });
  await studio.getByRole('button', { name: '查看工序来源 ↗' }).click();
  assert.equal(await desktop.locator('.source-dialog').evaluate((node) => node.open), true);
  await desktop.keyboard.press('Escape');
  await studio.getByRole('button', { name: /重新体验徽墨/ }).click();
  assert.equal(await studio.getAttribute('data-step'), '0');
  await studio.getByRole('button', { name: '第一处烟料' }).focus();
  await desktop.keyboard.press('Enter');
  assert.equal(
    await studio.getByRole('button', { name: '第一处烟料' }).getAttribute('aria-pressed'),
    'true',
  );
  await desktop.close();
  const mobile = await open({ width: 390, height: 844 }, true);
  const mobileStudio = mobile.locator('.craft-studio');
  await mobileStudio.getByRole('button', { name: '鱼头连接处' }).click();
  assert.match(await mobileStudio.locator('.studio-feedback').innerText(), /1\/4/);
  await mobile.locator('#craft').screenshot({ path: 'artifacts/studio-mobile-fish.png' });
  assert.equal(
    await mobile.evaluate(() => document.documentElement.scrollWidth <= innerWidth),
    true,
  );
  assert.deepEqual(errors, []);
  console.log(
    'Craft studio: visual fish/ink steps, direct hotspots, process feedback, source and mobile pass.',
  );
} finally {
  await browser.close();
}
