import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
const path = 'src/content/public-evidence.json';
assert.ok(existsSync(path), 'A source-backed public evidence dataset must be present');
const data = JSON.parse(readFileSync(path, 'utf8'));
const unique = (rows, kind) =>
  assert.equal(new Set(rows.map((r) => r.id)).size, rows.length, `${kind} IDs must be unique`);
unique(data.sources, 'source');
unique(data.measures, 'measure');
unique(data.people, 'person');
unique(data.coverage, 'coverage');
const sources = new Map(data.sources.map((s) => [s.id, s]));
assert.ok(
  data.sources.length >= 6,
  'Independent public-source enrichment must include at least six original reports',
);
assert.ok(
  data.measures.length >= 8,
  'Evidence should include attention, participation, practice and time with context',
);
for (const source of data.sources) {
  assert.ok(/^https?:\/\//.test(source.url), `${source.id}: public URL required`);
  assert.ok(/^\d{4}-\d{2}-\d{2}$/.test(source.publishedAt), `${source.id}: article date required`);
  assert.ok(
    source.publisher && source.title && source.checkedAt && source.verification,
    `${source.id}: provenance required`,
  );
}
for (const measure of data.measures) {
  assert.ok(sources.has(measure.sourceId), `${measure.id}: unresolved source`);
  for (const field of [
    'label',
    'valueText',
    'unit',
    'period',
    'scope',
    'interpretation',
    'limitation',
  ])
    assert.ok(measure[field], `${measure.id}: ${field} required`);
  assert.ok(['attention', 'participation', 'practice', 'craft-time'].includes(measure.stage));
}
assert.equal(
  data.retention.value,
  null,
  'Unknown cohort retention must remain null, never zero or a made-up rate',
);
assert.ok(data.retention.reason.length > 10);
assert.ok(data.people.length >= 3, 'The story must include several named real people');
for (const person of data.people) {
  assert.ok(person.name && person.craft && person.place && person.limit);
  assert.ok(person.milestones.length >= 2, `${person.name}: dated path required`);
  assert.ok(
    new Set(person.milestones.map((m) => m.sourceId)).size >= 2,
    `${person.name}: separate reports needed for a cross-report path`,
  );
  for (const milestone of person.milestones)
    assert.ok(milestone.date && milestone.text && sources.has(milestone.sourceId));
}
for (const record of data.coverage) {
  assert.ok(sources.has(record.sourceId));
  assert.equal(typeof record.attention, 'boolean');
  assert.equal(typeof record.participation, 'boolean');
  assert.equal(typeof record.namedPractice, 'boolean');
  assert.equal(typeof record.sameVisitorFollowup, 'boolean');
  assert.ok(record.note);
}
assert.ok(
  data.method.includes('选取') && data.method.includes('总体'),
  'Selected-source coverage must not masquerade as a population estimate',
);
console.log(
  `PASS: ${data.sources.length} original sources, ${data.measures.length} scoped measures, ${data.people.length} people paths, ${data.coverage.length} coded documents; retention remains unknown.`,
);
