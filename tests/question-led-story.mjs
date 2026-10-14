import assert from 'node:assert/strict';
import { readFile, mkdir, writeFile } from 'node:fs/promises';
import { chromium } from 'playwright';

const evidence = JSON.parse(await readFile('src/content/public-evidence.json', 'utf8'));
for (const [id, value, source] of [
  ['ink-course-families', '8', 'pub-shen-2025b'],
  ['ink-young-workers', '超30', 'pub-work-2026'],
  ['ink-trained-province', '3', 'pub-work-2026'],
  ['ink-trained-city', '19', 'pub-work-2026'],
  ['ink-trained-county', '16', 'pub-work-2026'],
  ['fish-performance-team', '32', 'pub-pan-2024'],
  ['fish-performance-income', '约3', 'pub-pan-2024'],
  ['fish-student-day-pay', '80', 'pub-pan-2024'],
  ['fish-design-time', '半个月', 'pub-pan-2024'],
]) {
  const fact = evidence.measures.find((f) => f.id === id);
  assert.ok(fact, `Missing newly read reporting fact: ${id}`);
  assert.equal(fact.valueText, value);
  assert.equal(fact.sourceId, source);
  assert.ok(fact.scope && fact.period && fact.limitation);
}
assert.equal(evidence.retention.value, null);
assert.equal(evidence.coverage.length, 10);
if (process.argv.includes('--facts')) {
  console.log('Nine reporting facts, definitions and original cohort boundary pass.');
  process.exit(0);
}

const base = process.env.TEST_BASE_URL || 'http://127.0.0.1:5185';
const output = 'artifacts/question-led-story';
await mkdir(output, { recursive: true });
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
      maps = [];
    page.on('pageerror', (e) => errors.push(e.message));
    page.on('request', (r) => {
      if (/geojson|chinaMap|splatViewer/.test(r.url())) maps.push(r.url());
    });
    await page.route('**/*', (route) =>
      route.request().url().startsWith(base) || /^(data|blob):/.test(route.request().url())
        ? route.continue()
        : route.abort(),
    );
    await page.goto(base);
    assert.match(await page.locator('.overture-copy p').innerText(), /有人接着做/);
    assert.match(await page.locator('#participation h2').innerText(), /有人来学吗/);
    assert.match(await page.locator('#after h2').innerText(), /后来/);
    const narrative = await page.locator('main').innerText();
    assert.ok(narrative.indexOf('有人来学吗') < narrative.indexOf('来过一次，就会留下来吗'));
    assert.equal(await page.locator('.course-grid .course-session').count(), 6);
    assert.equal(await page.locator('.course-grid .family-mark').count(), 48);
    await page.locator('.course-session').last().click();
    assert.match(await page.locator('.chart-selection').innerText(), /第6期/);
    assert.match(await page.locator('.course-chart').innerText(), /预订|预定/);
    assert.match(await page.locator('.course-chart').innerText(), /名额/);
    const trails = page.locator('.continuity-trail');
    assert.equal(await trails.count(), 2);
    for (const person of ['pan-min', 'shen-yixin']) {
      const personTrail = page.locator(`[data-person-trail="${person}"]`);
      const sourceSet = await personTrail
        .locator('.story-source-note')
        .evaluateAll((ns) => [...new Set(ns.map((n) => n.getAttribute('href')))]);
      assert.ok(
        sourceSet.length >= 2,
        'A later result must follow the same person across different reports',
      );
    }
    assert.match(
      await page.locator('.continuity-trail').first().innerText(),
      /2023[\s\S]*2024[\s\S]*2025/,
    );
    assert.match(await page.locator('.continuity-trail').last().innerText(), /2025[\s\S]*2026/);
    assert.equal(await page.locator('.mentoring-chart .mentor-row').count(), 3);
    const mentoringRatios = await page
      .locator('.mentor-row')
      .evaluateAll((rows) =>
        rows.map(
          (row) =>
            row.querySelector('i').getBoundingClientRect().width /
            row.querySelector('.mentor-track').getBoundingClientRect().width,
        ),
      );
    for (const [i, expected] of [0.15, 0.95, 0.8].entries())
      assert.ok(
        Math.abs(mentoringRatios[i] - expected) < 0.015,
        'Rendered mentoring bars must encode the reported counts on the same scale',
      );
    assert.match(await page.locator('.mentoring-chart').innerText(), /不相加|不作.*合计/);
    const youth = page.locator('.youth-chart');
    await youth.getByRole('button', { name: '墨厂青年员工', exact: true }).click();
    assert.match(await youth.innerText(), /超30|超三成/);
    assert.match(await youth.innerText(), /90后.*00后/s);
    assert.equal(await youth.locator('.share-fill').getAttribute('data-lower-bound'), '30');
    const shareRatio = await youth
      .locator('.share-track')
      .evaluate(
        (track) =>
          track.querySelector('.share-fill').getBoundingClientRect().width /
          track.getBoundingClientRect().width,
      );
    assert.ok(
      Math.abs(shareRatio - 0.3) < 0.015,
      'Rendered share must show the reported lower bound',
    );
    await youth.getByRole('button', { name: '鱼灯相关行业', exact: true }).click();
    assert.equal(await youth.locator('.share-fill').getAttribute('data-lower-bound'), '50');
    assert.match(await youth.innerText(), /35岁以下/);
    assert.match(await youth.innerText(), /下限/);
    await youth.locator('.story-source-note').click();
    assert.equal(await page.locator('.source-registry').evaluate((n) => n.open), true);
    await page.locator('.source-registry').evaluate((n) => {
      n.open = false;
    });
    assert.equal(await page.locator('#research .people-story').count(), 0);
    assert.deepEqual(errors, []);
    assert.deepEqual(maps, []);
    assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth));
    for (const section of ['participation', 'after'])
      await page.locator(`#${section}`).screenshot({
        path: `${output}/${width}-${section}.png`,
        style: '.site-header,.ink-drop-button,.skip-link{visibility:hidden}',
      });
    results.push({
      width,
      coursePlaces: 48,
      samePeopleAcrossReports: 2,
      lowerBounds: [50, 30],
      externalBlocked: true,
      errors,
    });
    await page.close();
  }
} finally {
  await browser.close();
}
await writeFile(`${output}/results.json`, JSON.stringify(results, null, 2));
console.log(JSON.stringify(results, null, 2));
