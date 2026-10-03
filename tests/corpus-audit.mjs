import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { stripTypeScriptTypes } from 'node:module';

const [reports, heritage, evidence, viewSource, auditSource] = await Promise.all([
  readFile('src/content/reports.json', 'utf8').then(JSON.parse),
  readFile('src/content/heritage.json', 'utf8').then(JSON.parse),
  readFile('src/content/public-evidence.json', 'utf8').then(JSON.parse),
  readFile('src/content/report-view.ts', 'utf8'),
  readFile('src/content/corpus-audit.ts', 'utf8'),
]);

function replaceImport(source, statement, replacement) {
  assert.ok(source.includes(statement), `Expected import changed: ${statement}`);
  return source.replace(statement, replacement);
}

async function importTypescript(source) {
  const compiled = stripTypeScriptTypes(source);
  return import(`data:text/javascript;base64,${Buffer.from(compiled).toString('base64')}`);
}

async function loadView(reportLedger, publicLedger) {
  let source = replaceImport(
    viewSource,
    "import reports from './reports.json';",
    `const reports = ${JSON.stringify(reportLedger)};`,
  );
  source = replaceImport(
    source,
    "import { publicEvidence, publicMeasure } from './evidence';",
    `
    const publicEvidence = ${JSON.stringify(publicLedger)};
    const publicMeasure = id => {
      const measure = publicEvidence.measures.find(row => row.id === id);
      if (!measure) throw new Error('Missing test measure: ' + id);
      return measure;
    };
  `,
  );
  return importTypescript(source);
}

const view = await loadView(reports, evidence);
let source = replaceImport(
  auditSource,
  "import reports from './reports.json';",
  `const reports = ${JSON.stringify(reports)};`,
);
source = replaceImport(
  source,
  "import heritage from './heritage.json';",
  `const heritage = ${JSON.stringify(heritage)};`,
);
source = replaceImport(
  source,
  "import { reportIndicators, reportSources } from './report-view';",
  `
  const reportIndicators = ${JSON.stringify(view.reportIndicators)};
  const reportSources = ${JSON.stringify(view.reportSources)};
`,
);
const {
  corpusAudit: audit,
  createCorpusAudit,
  auditUrlKey,
  auditUnitFamily,
  auditPeriodShape,
} = await importTypescript(source);
const input = (reportLedger = reports, heritageLedger = heritage, currentView = view) => ({
  reportLedger,
  heritageLedger,
  indicatorsView: currentView.reportIndicators,
  sourcesView: currentView.reportSources,
});

function checkPartition(groups, rows) {
  assert.equal(
    groups.reduce((sum, group) => sum + group.count, 0),
    rows.length,
  );
  const members = groups.flatMap((group) => group.rowIds);
  assert.deepEqual([...members].sort(), rows.map((row) => row.id).sort());
  for (const group of groups) {
    assert.equal(group.denominator, rows.length);
    assert.equal(group.count, group.rowIds.length);
    assert.equal(group.share, group.count / rows.length);
    assert.equal(new Set(group.rowIds).size, group.rowIds.length);
    assert.deepEqual(
      group.references.map((reference) => reference.id),
      group.sourceIds,
    );
  }
}

assert.equal(audit.integrity.passed, true, JSON.stringify(audit.integrity.issues));
assert.equal(audit.counts.reports, reports.reports.length);
assert.equal(audit.counts.indicators, reports.indicators.length);
assert.equal(audit.counts.reportSourceEntries, reports.sources.length);
assert.equal(audit.counts.leadNotes, heritage.leads.length);
assert.equal(
  audit.counts.leadSourceUrls,
  new Set(heritage.leads.map((row) => auditUrlKey(row.source_url))).size,
);
assert.equal(audit.counts.catalogueSubentries, heritage.catalogue.length);
assert.equal(
  audit.counts.uniqueProjectCodes,
  new Set(heritage.catalogue.map((row) => row.project_code)).size,
);
assert.equal(
  audit.counts.confirmedPersonProjectLinks,
  heritage.links.filter((row) => row.confirmed).length,
);
assert.equal(audit.counts.featuredCards, reports.featured.length);
assert.equal(
  audit.counts.featuredParentRows,
  new Set(reports.featured.map((row) => row.parentId)).size,
);
assert.equal(
  audit.counts.numericIndicators + audit.indicators.nonnumericRowIds.length,
  audit.counts.indicators,
);
assert.equal(
  audit.heritageQuality.peopleWithoutBirthYear,
  heritage.people.filter((row) => row.birth_year === null).length,
);
assert.equal(
  Object.values(audit.heritageQuality.livingStatusCounts).reduce((sum, count) => sum + count, 0),
  heritage.people.length,
);
assert.equal(auditUrlKey('https://example.com/article/#section'), 'https://example.com/article');
assert.equal(
  auditUrlKey('https://example.com/article/?value=/'),
  'https://example.com/article?value=/',
);
assert.notEqual(
  auditUrlKey('http://example.com/article'),
  auditUrlKey('https://example.com/article'),
);

for (const field of [
  'topics',
  'statuses',
  'units',
  'unitFamilies',
  'periodLabels',
  'periodShapes',
  'qualifiers',
]) {
  checkPartition(audit.indicators[field], reports.indicators);
}
for (const field of [
  'topics',
  'statuses',
  'units',
  'unitFamilies',
  'periodLabels',
  'periodShapes',
]) {
  checkPartition(audit.displayOverlay[field], view.reportIndicators);
}
for (const field of ['topics', 'kinds', 'statuses', 'urlGroups']) {
  checkPartition(audit.leads[field], heritage.leads);
}
checkPartition(audit.sources.verification, reports.sources);
for (const topic of audit.indicators.topicUnitMatrix) {
  checkPartition(
    topic.unitFamilies,
    reports.indicators.filter((row) => row.topic === topic.topic),
  );
  assert.equal(
    topic.total,
    topic.unitFamilies.reduce((sum, group) => sum + group.count, 0),
  );
}

assert.equal(
  audit.indicators.unitFamilies.some((row) => row.id === 'unclassified'),
  false,
);
assert.equal(
  audit.indicators.statuses.find((row) => row.id === '计划目标').rowIds.includes('ZB050'),
  true,
);
assert.equal(
  auditPeriodShape(reports.indicators.find((row) => row.id === 'ZB050').period),
  'day-range',
);
assert.equal(
  auditPeriodShape(reports.indicators.find((row) => row.id === 'ZB082').period),
  'incomplete',
);
assert.ok(reports.indicators.find((row) => row.id === 'ZB082').status.startsWith('已核对'));
assert.equal(auditUnitFamily('万人次'), 'person-occurrences');
assert.equal(auditUnitFamily('万人'), 'people');
assert.equal(auditUnitFamily('万美元'), 'currency');
assert.equal(auditUnitFamily('新单位'), 'unclassified');
assert.equal(audit.deduplication.inputRowsAvailableForReaudit, false);
assert.equal(audit.deduplication.recordedDelta, audit.deduplication.removedRowsReportedByLedger);
assert.deepEqual(audit.deduplication.retainedExactDuplicateSignatures, []);
assert.equal(
  audit.indicators.withoutReportIds.every(
    (id) => reports.indicators.find((row) => row.id === id).sourceIds.length > 0,
  ),
  true,
);
assert.equal(
  audit.leads.notesBeyondUniqueUrls,
  audit.counts.leadNotes - audit.counts.leadSourceUrls,
);
assert.ok(audit.leads.statuses.every((group) => /待逐条复核/.test(group.id)));

// Mutations are test-only fixtures. They prove the delivered TypeScript reads
// current rows rather than copying a stored count or the JSON summary.
const changedReports = structuredClone(reports);
const previousStatus = changedReports.indicators[0].status;
changedReports.indicators[0].unit = '测试新增单位';
changedReports.indicators[0].status = '计划目标';
changedReports.indicators[0].sourceIds = ['missing-source'];
const changedView = await loadView(changedReports, evidence);
const changedAudit = createCorpusAudit(input(changedReports, heritage, changedView));
assert.equal(
  changedAudit.indicators.unitFamilies.find((row) => row.id === 'unclassified').count,
  1,
);
assert.equal(
  changedAudit.indicators.statuses.find((row) => row.id === previousStatus).count,
  audit.indicators.statuses.find((row) => row.id === previousStatus).count - 1,
);
assert.equal(
  changedAudit.indicators.statuses.find((row) => row.id === '计划目标').count,
  audit.indicators.statuses.find((row) => row.id === '计划目标').count + 1,
);
assert.ok(
  changedAudit.integrity.issues.danglingIndicatorSources.includes(
    `${changedReports.indicators[0].id}:missing-source`,
  ),
);
assert.equal(changedAudit.integrity.passed, false);
assert.ok(changedAudit.integrity.issues.summaryDisagreements.length > 0);

const repeatedHeritage = structuredClone(heritage);
repeatedHeritage.leads.push({ ...repeatedHeritage.leads[0], id: 'test-repeated-note' });
const repeatedAudit = createCorpusAudit(input(reports, repeatedHeritage));
assert.equal(repeatedAudit.counts.leadNotes, audit.counts.leadNotes + 1);
assert.equal(repeatedAudit.counts.leadSourceUrls, audit.counts.leadSourceUrls);
const newUrlHeritage = structuredClone(repeatedHeritage);
newUrlHeritage.leads.at(-1).source_url = 'https://example.com/test-only-fixture';
const newUrlAudit = createCorpusAudit(input(reports, newUrlHeritage));
assert.equal(newUrlAudit.counts.leadSourceUrls, audit.counts.leadSourceUrls + 1);

const duplicateReports = structuredClone(reports);
duplicateReports.indicators.push({ ...duplicateReports.indicators[0] });
const duplicateView = await loadView(duplicateReports, evidence);
const duplicateAudit = createCorpusAudit(input(duplicateReports, heritage, duplicateView));
assert.equal(duplicateAudit.counts.indicators, audit.counts.indicators + 1);
assert.ok(
  duplicateAudit.integrity.issues.duplicateIndicatorIds.includes(duplicateReports.indicators[0].id),
);
assert.equal(duplicateAudit.deduplication.retainedExactDuplicateSignatures.length, 1);

const renamedDuplicateReports = structuredClone(reports);
renamedDuplicateReports.indicators.push({
  ...renamedDuplicateReports.indicators[0],
  id: 'test-distinct-id-same-primary-row',
});
const renamedDuplicateView = await loadView(renamedDuplicateReports, evidence);
const renamedDuplicateAudit = createCorpusAudit(
  input(renamedDuplicateReports, heritage, renamedDuplicateView),
);
assert.deepEqual(renamedDuplicateAudit.integrity.issues.duplicateIndicatorIds, []);
assert.equal(renamedDuplicateAudit.integrity.issues.duplicateIndicatorSignatures.length, 1);
assert.equal(renamedDuplicateAudit.integrity.passed, false);

const changedEvidence = structuredClone(evidence);
changedEvidence.measures.find((row) => row.id === 'ink-visits').valueText = '21';
changedEvidence.measures.find((row) => row.id === 'ink-visits').period = '统计截止未详';
const evidenceView = await loadView(reports, changedEvidence);
const overlayAudit = createCorpusAudit(input(reports, heritage, evidenceView));
assert.equal(evidenceView.reportIndicators.find((row) => row.id === 'ZB038').valueText, '21');
assert.deepEqual(overlayAudit.indicators, audit.indicators);
assert.equal(
  overlayAudit.displayOverlay.periodShapes.find((row) => row.id === 'incomplete').count,
  audit.displayOverlay.periodShapes.find((row) => row.id === 'incomplete').count + 1,
);
assert.equal(
  overlayAudit.displayOverlay.linkedRows.find((row) => row.id === 'ZB038').displayedPeriod,
  '统计截止未详',
);
assert.equal(reports.indicators.find((row) => row.id === 'ZB038').valueText, '19');

console.log(
  JSON.stringify(
    {
      result: 'PASS: runtime TypeScript, exhaustive partitions, source joins and mutation checks',
      counts: audit.counts,
      units: audit.indicators.units.length,
      periodLabels: audit.indicators.periodLabels.length,
      topics: audit.indicators.topics.map(({ label, count }) => ({ label, count })),
      unitFamilies: audit.indicators.unitFamilies.map(({ label, count }) => ({ label, count })),
      periodShapes: audit.indicators.periodShapes.map(({ label, count }) => ({ label, count })),
      pendingLeadNotes: audit.leads.statuses.reduce((sum, row) => sum + row.count, 0),
      sourceEntriesWithoutIndicatorReferences: audit.sources.unusedSourceIds.length,
      indicatorsWithoutReportIds: audit.indicators.withoutReportIds.length,
      overlayLinkedRows: audit.displayOverlay.linkedRows,
    },
    null,
    2,
  ),
);
