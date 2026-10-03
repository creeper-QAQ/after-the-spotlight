import reports from './reports.json';
import { publicEvidence, publicMeasure } from './evidence';

// Keep the delivered register intact; verified facts drive repeated display values.
export const sharedFacts: Record<string, { measureId: string; indicatorId: string }> = {
  'fish-videos-2025': { measureId: 'keyword-views', indicatorId: 'ZB014' },
  'ink-study-2025': { measureId: 'ink-visits', indicatorId: 'ZB038' },
};
export const reportFeatured = reports.featured.map((record) => {
  const link = sharedFacts[record.id];
  if (!link) return record;
  const fact = publicMeasure(link.measureId);
  return {
    ...record,
    valueText: fact.valueText,
    unit: fact.unit,
    period: fact.period,
    scope: fact.scope,
    sourceId: fact.sourceId,
  };
});
export const reportIndicators = reports.indicators.map((record) => {
  const link = Object.values(sharedFacts).find((item) => item.indicatorId === record.id);
  if (!link) return { ...record, linkedFactId: null };
  const fact = publicMeasure(link.measureId);
  return {
    ...record,
    value: Number.isFinite(Number(fact.valueText)) ? Number(fact.valueText) : null,
    valueText: fact.valueText,
    unit: fact.unit,
    period: fact.period,
    sourceIds: [fact.sourceId],
    notes: `${fact.scope}；${fact.limitation}`,
    linkedFactId: fact.id,
  };
});
export const reportSources = [
  ...reports.sources,
  ...publicEvidence.sources.map((source) => ({
    ...source,
    accessedAt: source.checkedAt,
  })),
];
