import publicData from './public-evidence.json';

export const publicEvidence = publicData;
export type PublicSource = (typeof publicData.sources)[number];
export type PublicMeasure = (typeof publicData.measures)[number];
export type PublicPerson = (typeof publicData.people)[number];
export type EvidenceKind = 'attention' | 'participation' | 'namedPractice' | 'sameVisitorFollowup';
export const evidenceKinds: { id: EvidenceKind; label: string; question: string }[] = [
  { id: 'attention', label: '被关注', question: '留下了平台上的关注记录吗？' },
  { id: 'participation', label: '到访体验', question: '记下了来到现场或动手的人吗？' },
  { id: 'namedPractice', label: '实名实践', question: '能找到具体的制作或教学者吗？' },
  { id: 'sameVisitorFollowup', label: '同批追踪', question: '能连接同一批体验者的后来吗？' },
];
/** Counts describe only the selected excerpts, never an industry population. */
export const coverageSummary = evidenceKinds.map((kind) => ({
  ...kind,
  supported: publicData.coverage.filter((record) => record[kind.id]).length,
  total: publicData.coverage.length,
}));
export function publicSource(id: string) {
  const source = publicData.sources.find((row) => row.id === id);
  if (!source) throw new Error(`Unresolved public evidence source: ${id}`);
  return source;
}
export function publicMeasure(id: string) {
  const measure = publicData.measures.find((row) => row.id === id);
  if (!measure) throw new Error(`Unresolved public measure: ${id}`);
  return measure;
}
