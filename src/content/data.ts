/** Replace these empty collections only with verified records. Never put layout fixtures here. */
export interface CatalogueRecord {
  id: string;
  name: string;
  category: string;
  region: string;
  batch: string;
  sourceId: string;
}
export interface PersonRecord {
  id: string;
  name: string;
  project: string;
  region: string;
  description: string;
  sourceId: string;
}
export interface IndicatorRecord {
  id: string;
  label: string;
  valueText: string;
  unit: string;
  period: string;
  scope: string;
  sourceId: string;
}
export interface EvidenceSource {
  id: string;
  title: string;
  url: string;
  accessedAt: string;
  note: string;
}
export const dataset: {
  catalogue: CatalogueRecord[];
  people: PersonRecord[];
  indicators: IndicatorRecord[];
  sources: EvidenceSource[];
} = { catalogue: [], people: [], indicators: [], sources: [] };

export const dataSlots = [
  {
    label: '名录与分布',
    detail: '类别 / 地区 / 认定批次',
    state: '等待名录核验',
    topic: 'catalogue',
  },
  {
    label: '传播与关注',
    detail: '平台 / 时段 / 统计口径',
    state: '等待报告核验',
    topic: 'reports',
  },
  { label: '人物与实践', detail: '项目 / 人物 / 案例事件', state: '等待资料核验', topic: 'people' },
] as const;
