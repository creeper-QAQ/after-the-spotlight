import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { stripTypeScriptTypes } from 'node:module';
// Exercise the view by compiling its TypeScript after swapping the JSON import for literals.
const evidence = JSON.parse(await readFile('src/content/public-evidence.json', 'utf8'));
const reports = JSON.parse(await readFile('src/content/reports.json', 'utf8'));
const changed = structuredClone(evidence);
changed.measures.find((r) => r.id === 'keyword-views').valueText = '18.2';
changed.measures.find((r) => r.id === 'ink-visits').valueText = '21';
let source = await readFile('src/content/report-view.ts', 'utf8');
source = source
  .replace("import reports from './reports.json';", `const reports = ${JSON.stringify(reports)};`)
  .replace(
    "import { publicEvidence, publicMeasure } from './evidence';",
    `const publicEvidence = ${JSON.stringify(changed)}; const publicMeasure = id => publicEvidence.measures.find(r=>r.id===id);`,
  );
const compiled = stripTypeScriptTypes(source);
const view = await import(
  `data:text/javascript;base64,${Buffer.from(compiled).toString('base64')}`
);
assert.equal(view.reportFeatured.find((r) => r.id === 'ink-study-2025').valueText, '21');
assert.equal(view.reportIndicators.find((r) => r.id === 'ZB038').valueText, '21');
assert.equal(view.reportIndicators.find((r) => r.id === 'ZB014').valueText, '18.2');
assert.equal(view.reportIndicators.find((r) => r.id === 'ZB038').sourceIds[0], 'pub-ink-2026');
assert.equal(reports.indicators.find((r) => r.id === 'ZB038').valueText, '19');
const heritage = JSON.parse(await readFile('src/content/heritage.json', 'utf8'));
let mainSource = await readFile('src/content/data.ts', 'utf8');
mainSource = mainSource
  .replace(
    "import heritage from './heritage.json';",
    `const heritage = ${JSON.stringify(heritage)};`,
  )
  .replace(
    "import { publicEvidence, publicMeasure } from './evidence';",
    `const publicEvidence = ${JSON.stringify(changed)}; const publicMeasure = id => publicEvidence.measures.find(r=>r.id===id);`,
  );
const main = await import(
  `data:text/javascript;base64,${Buffer.from(stripTypeScriptTypes(mainSource)).toString('base64')}`
);
assert.equal(main.dataset.indicators.find((r) => r.id === 'fish-videos-2025').valueText, '18.2');
assert.equal(main.dataset.indicators.find((r) => r.id === 'ink-study-2025').valueText, '21');
assert.equal(
  main.dataset.indicators.find((r) => r.id === 'ink-study-2025').sourceId,
  'pub-ink-2026',
);
console.log(
  'PASS: changing a canonical fact updates repeated displays and preserves delivered snapshots.',
);
