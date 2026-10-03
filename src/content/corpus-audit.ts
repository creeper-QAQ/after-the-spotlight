import reports from './reports.json';
import heritage from './heritage.json';
import { reportIndicators, reportSources } from './report-view';

export interface AuditReference {
  id: string;
  title: string;
  publisher: string;
  url: string;
  verification: string;
}

export interface AuditBucket {
  id: string;
  label: string;
  count: number;
  denominator: number;
  share: number | null;
  rowIds: string[];
  sourceIds: string[];
  sourceUrls: string[];
  references: AuditReference[];
}

export interface CorpusAuditInput {
  reportLedger: typeof reports;
  heritageLedger: typeof heritage;
  indicatorsView: typeof reportIndicators;
  sourcesView: typeof reportSources;
}

type RefRow = { id: string; sourceIds: string[]; sourceUrls: string[] };
const unique = <T>(values: T[]) => [...new Set(values)];

// URL identity preserves scheme, hostname, path and query. Only fragments and
// a final slash are removed; different pages are never merged by article title.
export function auditUrlKey(value: string) {
  try {
    const url = new URL(value.trim());
    return `${url.origin}${url.pathname.replace(/\/$/, '')}${url.search}`;
  } catch {
    return value.trim();
  }
}

function isPublicUrl(value: string) {
  try {
    return ['http:', 'https:'].includes(new URL(value).protocol);
  } catch {
    return false;
  }
}

// These are unit-string families, not content coding or compatible quantities.
// 人次 includes visits and media exposures; 人/位/名 does not prove deduplication.
export const auditUnitFamilies = [
  {
    id: 'person-occurrences',
    label: '人次（含每年口径）',
    units: ['亿人次', '万人次', '万人次/年'],
  },
  {
    id: 'people',
    label: '人 / 位 / 名（含每年口径）',
    units: ['万人', '亿人', '万人/年', '位', '人', '名'],
  },
  { id: 'occurrences', label: '次数', units: ['亿次'] },
  { id: 'percentage', label: '百分比', units: ['%'] },
  { id: 'currency', label: '金额（不同币种）', units: ['亿元', '万元', '万美元'] },
  { id: 'content-items', label: '条数', units: ['亿条', '万条', '条'] },
  { id: 'events', label: '场数（含日均）', units: ['万场/天', '万场'] },
  {
    id: 'objects',
    label: '单 / 项 / 个 / 款 / 件',
    units: ['亿单', '项', '万个', '款', '万件', '个'],
  },
  { id: 'organizations', label: '家 / 所', units: ['家', '万家', '所'] },
  { id: 'unspecified', label: '未填单位', units: [''] },
] as const;

export function auditUnitFamily(unit: string) {
  return (
    auditUnitFamilies.find((family) => (family.units as readonly string[]).includes(unit))?.id ??
    'unclassified'
  );
}

export const auditPeriodShapes: Record<string, string> = {
  'day-range': '以完整日期写起止',
  'month-range': '以月份写起止',
  incomplete: '含缺期提示或无年份的年度口径',
  cutoff: '截止点或报道时点写法',
  'named-window': '节日 / 年份 / 事件等其他写法',
};

// Classify the existing period field's literal form. This does not harmonize
// windows, verify their correctness, or imply that rows can be compared.
export function auditPeriodShape(period: string) {
  if (/未写明|未详|待复核|^年度|^—\s*—/.test(period)) return 'incomplete';
  if (/^\d{4}-\d{2}-\d{2}\s*—\s*\d{4}-\d{2}-\d{2}$/.test(period)) return 'day-range';
  if (/^\d{4}-\d{2}\s*—\s*\d{4}-\d{2}$/.test(period)) return 'month-range';
  if (/截至|报道时点/.test(period)) return 'cutoff';
  return 'named-window';
}

function groupRows<T extends RefRow>(
  rows: T[],
  key: (row: T) => string,
  sourceIndex: Map<string, AuditReference>,
  labels: Record<string, string> = {},
): AuditBucket[] {
  const groups = new Map<string, T[]>();
  for (const row of rows) {
    const id = key(row);
    const members = groups.get(id) ?? [];
    members.push(row);
    groups.set(id, members);
  }
  return [...groups]
    .map(([id, members]) => {
      const sourceIds = unique(members.flatMap((row) => row.sourceIds));
      return {
        id,
        label: labels[id] ?? id,
        count: members.length,
        denominator: rows.length,
        share: rows.length ? members.length / rows.length : null,
        rowIds: members.map((row) => row.id),
        sourceIds,
        sourceUrls: unique(members.flatMap((row) => row.sourceUrls).map(auditUrlKey)),
        references: sourceIds.flatMap((id) => {
          const source = sourceIndex.get(id);
          return source ? [source] : [];
        }),
      };
    })
    .sort((a, b) => b.count - a.count);
}

function duplicateKeys<T>(rows: T[], key: (row: T) => string) {
  const keys = rows.map(key);
  return unique(keys.filter((value, index) => keys.indexOf(value) !== index));
}

export function createCorpusAudit(input: CorpusAuditInput) {
  const ledger = input.reportLedger;
  const collection = input.heritageLedger;
  const rawSourceIndex = new Map(ledger.sources.map((source) => [source.id, source]));
  const displaySourceIndex = new Map(input.sourcesView.map((source) => [source.id, source]));
  const indicatorRows = ledger.indicators.map((row) => ({
    ...row,
    sourceUrls: row.sourceIds.flatMap((id) => {
      const source = rawSourceIndex.get(id);
      return source ? [source.url] : [];
    }),
  }));
  const displayRows = input.indicatorsView.map((row) => ({
    ...row,
    sourceUrls: row.sourceIds.flatMap((id) => {
      const source = displaySourceIndex.get(id);
      return source ? [source.url] : [];
    }),
  }));
  const leadRows = collection.leads.map((row) => ({
    ...row,
    sourceIds: [],
    sourceUrls: [row.source_url],
  }));
  const sourceRows = ledger.sources.map((source) => ({
    ...source,
    sourceIds: [source.id],
    sourceUrls: [source.url],
  }));
  const familyLabels: Record<string, string> = Object.fromEntries(
    auditUnitFamilies.map((family) => [family.id, family.label]),
  );
  familyLabels.unclassified = '新单位，待归类';
  const indicatorProfile = (
    rows: typeof indicatorRows | typeof displayRows,
    index: Map<string, AuditReference>,
  ) => ({
    topics: groupRows(rows, (row) => row.topic, index),
    statuses: groupRows(rows, (row) => row.status, index),
    units: groupRows(rows, (row) => row.unit || '__empty__', index, { __empty__: '未填单位' }),
    unitFamilies: groupRows(rows, (row) => auditUnitFamily(row.unit), index, familyLabels),
    periodLabels: groupRows(rows, (row) => row.period, index),
    periodShapes: groupRows(rows, (row) => auditPeriodShape(row.period), index, auditPeriodShapes),
  });
  const rawProfile = indicatorProfile(indicatorRows, rawSourceIndex);
  const rawIds = new Set(indicatorRows.map((row) => row.id));
  const viewIds = new Set(displayRows.map((row) => row.id));
  const reportIds = new Set(ledger.reports.map((row) => row.id));
  const peopleIds = new Set(collection.people.map((row) => row.id));
  const catalogueIds = new Set(collection.catalogue.map((row) => row.id));
  const usedSourceIds = unique(indicatorRows.flatMap((row) => row.sourceIds));
  const missingReportRows = indicatorRows
    .filter((row) => !row.reportIds.length)
    .map((row) => row.id);
  const summaryDisagreements: string[] = [];
  for (const [field, actual] of [
    ['reports', ledger.reports.length],
    ['uniqueIndicators', indicatorRows.length],
    ['sources', ledger.sources.length],
  ] as const) {
    if (ledger.summary[field] !== actual) summaryDisagreements.push(field);
  }
  const storedStatuses: Record<string, number> = ledger.summary.statusCounts;
  for (const status of unique([
    ...Object.keys(storedStatuses),
    ...rawProfile.statuses.map((row) => row.id),
  ])) {
    if (
      (storedStatuses[status] ?? 0) !==
      (rawProfile.statuses.find((row) => row.id === status)?.count ?? 0)
    ) {
      summaryDisagreements.push(`status:${status}`);
    }
  }
  const duplicateSignatures = duplicateKeys(indicatorRows, (row) =>
    JSON.stringify([
      row.label,
      row.valueText,
      row.unit,
      row.period,
      row.platform,
      row.region,
      row.object,
      [...row.sourceIds].sort(),
    ]),
  );
  const issues = {
    duplicateIndicatorIds: duplicateKeys(indicatorRows, (row) => row.id),
    duplicateIndicatorSignatures: duplicateSignatures,
    duplicateReportIds: duplicateKeys(ledger.reports, (row) => row.id),
    duplicateSourceIds: duplicateKeys(ledger.sources, (row) => row.id),
    duplicateLeadIds: duplicateKeys(leadRows, (row) => row.id),
    duplicateCatalogueIds: duplicateKeys(collection.catalogue, (row) => row.id),
    duplicatePersonIds: duplicateKeys(collection.people, (row) => row.id),
    duplicateDisplayIndicatorIds: duplicateKeys(displayRows, (row) => row.id),
    duplicateDisplaySourceIds: duplicateKeys(input.sourcesView, (row) => row.id),
    danglingIndicatorSources: indicatorRows.flatMap((row) =>
      row.sourceIds.filter((id) => !rawSourceIndex.has(id)).map((id) => `${row.id}:${id}`),
    ),
    danglingIndicatorReports: indicatorRows.flatMap((row) =>
      row.reportIds.filter((id) => !reportIds.has(id)).map((id) => `${row.id}:${id}`),
    ),
    danglingReportSources: ledger.reports.flatMap((row) =>
      row.sourceIds.filter((id) => !rawSourceIndex.has(id)).map((id) => `${row.id}:${id}`),
    ),
    danglingFeaturedParents: ledger.featured
      .filter((row) => !rawIds.has(row.parentId))
      .map((row) => row.id),
    danglingFeaturedSources: ledger.featured
      .filter((row) => !rawSourceIndex.has(row.sourceId))
      .map((row) => row.id),
    danglingDisplaySources: displayRows.flatMap((row) =>
      row.sourceIds.filter((id) => !displaySourceIndex.has(id)).map((id) => `${row.id}:${id}`),
    ),
    danglingPeopleLinks: collection.links
      .filter((row) => !peopleIds.has(row.person_id))
      .map((row) => row.person_id),
    danglingConfirmedProjectLinks: collection.links
      .filter((row) => row.confirmed && !catalogueIds.has(row.project_id))
      .map((row) => row.person_id),
    missingViewRows: indicatorRows.filter((row) => !viewIds.has(row.id)).map((row) => row.id),
    unexpectedViewRows: displayRows.filter((row) => !rawIds.has(row.id)).map((row) => row.id),
    invalidSourceUrls: ledger.sources.filter((row) => !isPublicUrl(row.url)).map((row) => row.id),
    invalidDisplaySourceUrls: input.sourcesView
      .filter((row) => !isPublicUrl(row.url))
      .map((row) => row.id),
    invalidLeadUrls: collection.leads
      .filter((row) => !isPublicUrl(row.source_url))
      .map((row) => row.id),
    summaryDisagreements,
  };
  const leadUrls = unique(leadRows.flatMap((row) => row.sourceUrls).map(auditUrlKey));
  const rawUrls = unique(ledger.sources.map((row) => auditUrlKey(row.url)));
  return {
    method: {
      title: '采集台账记录了什么',
      description:
        '全量统计现有结构化字段，以记录条数为分母；不对未读原文作内容编码，不汇总异质数值。',
      indicatorDenominator: 'reports.json 中保留的全部指标行（含待复核、计划、定性及方法行）',
      leadDenominator: 'heritage.json 中全部用途笔记；一页可对应多条笔记',
      reportUpdated: ledger.updated,
      heritageUpdated: collection.asOf,
      sourceVerification: '复核标签来自台账原字段，本次代码审计不等于重读原文。',
      periodClassification:
        '按统计窗口字段的字面写法分类；完整写法仍可能包含计划目标和待核实数值。',
      unitClassification:
        '按单位字符串分组；同组仍可跨对象、尺度、币种或每年／日均口径，不能相加。',
    },
    counts: {
      reports: ledger.reports.length,
      indicators: indicatorRows.length,
      featuredCards: ledger.featured.length,
      featuredParentRows: unique(ledger.featured.map((row) => row.parentId)).length,
      numericIndicators: indicatorRows.filter(
        (row) => typeof row.value === 'number' && Number.isFinite(row.value),
      ).length,
      reportSourceEntries: ledger.sources.length,
      reportSourceUrls: rawUrls.length,
      referencedReportSourceEntries: usedSourceIds.filter((id) => rawSourceIndex.has(id)).length,
      leadNotes: leadRows.length,
      leadSourceUrls: leadUrls.length,
      catalogueSubentries: collection.catalogue.length,
      uniqueProjectCodes: unique(collection.catalogue.map((row) => row.project_code)).length,
      namedPeopleRows: collection.people.length,
      confirmedPersonProjectLinks: collection.links.filter((row) => row.confirmed).length,
    },
    indicators: {
      ...rawProfile,
      qualifiers: groupRows(indicatorRows, (row) => row.qualifier || '__none__', rawSourceIndex, {
        __none__: '无限定词（不代表精确值）',
      }),
      withoutReportIds: missingReportRows,
      nonnumericRowIds: indicatorRows
        .filter((row) => typeof row.value !== 'number' || !Number.isFinite(row.value))
        .map((row) => row.id),
      topicUnitMatrix: rawProfile.topics.map((topic) => ({
        topic: topic.id,
        total: topic.count,
        unitFamilies: groupRows(
          indicatorRows.filter((row) => row.topic === topic.id),
          (row) => auditUnitFamily(row.unit),
          rawSourceIndex,
          familyLabels,
        ),
      })),
    },
    sources: {
      verification: groupRows(sourceRows, (row) => row.verification, rawSourceIndex),
      usedSourceIds,
      unusedSourceIds: ledger.sources
        .filter((row) => !usedSourceIds.includes(row.id))
        .map((row) => row.id),
      reportsWithoutIndicatorIds: ledger.reports
        .filter((row) => !indicatorRows.some((indicator) => indicator.reportIds.includes(row.id)))
        .map((row) => row.id),
      index: [...displaySourceIndex.values()],
    },
    leads: {
      topics: groupRows(leadRows, (row) => row.topic, rawSourceIndex),
      kinds: groupRows(leadRows, (row) => row.kind, rawSourceIndex),
      statuses: groupRows(leadRows, (row) => row.status, rawSourceIndex),
      urlGroups: groupRows(leadRows, (row) => auditUrlKey(row.source_url), rawSourceIndex),
      repeatedUrlGroups: leadUrls.filter(
        (url) => leadRows.filter((row) => auditUrlKey(row.source_url) === url).length > 1,
      ).length,
      notesBeyondUniqueUrls: leadRows.length - leadUrls.length,
      urlsAlsoInReportSources: leadUrls.filter((url) => rawUrls.includes(url)),
    },
    heritageQuality: {
      peopleWithoutBirthYear: collection.people.filter((row) => row.birth_year === null).length,
      livingStatusCounts: Object.fromEntries(
        unique(collection.people.map((row) => row.living_status)).map((status) => [
          status,
          collection.people.filter((row) => row.living_status === status).length,
        ]),
      ),
      unconfirmedPersonProjectLinks: collection.links.filter((row) => !row.confirmed).length,
    },
    displayOverlay: {
      ...indicatorProfile(displayRows, displaySourceIndex),
      sourceEntries: input.sourcesView.length,
      uniqueSourceUrls: unique(input.sourcesView.map((row) => auditUrlKey(row.url))).length,
      linkedRows: displayRows
        .filter((row) => row.linkedFactId)
        .map((row) => ({
          id: row.id,
          measureId: row.linkedFactId,
          sourceIds: row.sourceIds,
          storedSourceIds:
            ledger.indicators.find((stored) => stored.id === row.id)?.sourceIds ?? [],
          storedPeriod: ledger.indicators.find((stored) => stored.id === row.id)?.period ?? '',
          displayedPeriod: row.period,
        })),
    },
    deduplication: {
      retainedRows: indicatorRows.length,
      retainedUniqueIds: rawIds.size,
      retainedExactDuplicateSignatures: duplicateSignatures,
      inputRowsReportedByLedger: ledger.summary.inputIndicators,
      removedRowsReportedByLedger: ledger.summary.duplicates,
      recordedDelta: ledger.summary.inputIndicators - indicatorRows.length,
      inputRowsAvailableForReaudit: false,
      limitation:
        '原始被合并行未保存在公开 JSON 中；95→94 是交付摘要记录，不能从现存94行独立重演那一次合并。',
    },
    integrity: { passed: Object.values(issues).every((values) => !values.length), issues },
  };
}

export const corpusAudit = createCorpusAudit({
  reportLedger: reports,
  heritageLedger: heritage,
  indicatorsView: reportIndicators,
  sourcesView: reportSources,
});
