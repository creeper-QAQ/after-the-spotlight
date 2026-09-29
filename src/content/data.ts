/** Published records only. Keep a source for every visible record; never put layout fixtures here. */
import heritage from './heritage.json';
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
  stage: 'attention' | 'participation' | 'continuity';
  label: string;
  valueText: string;
  unit: string;
  period: string;
  scope: string;
  sourceId: string;
}
export interface CaseEventRecord {
  id: string;
  caseId: 'fish' | 'ink';
  stage: 'attention' | 'participation' | 'continuity';
  date: string;
  actor: string;
  /** Stable identity used only when a source confirms the same person or cohort across records. */
  subjectId?: string;
  event: string;
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
  caseEvents: CaseEventRecord[];
  sources: EvidenceSource[];
} = {
  catalogue: heritage.catalogue.map((row) => ({
    id: row.id,
    name: row.name,
    category: row.category,
    region: row.region,
    batch: row.batch,
    sourceId: 'anhui-project-delivery',
  })),
  people: [
    {
      id: 'wang-huawu',
      name: '汪华武',
      project: '汪满田鱼灯',
      region: '安徽歙县汪满田村',
      description:
        '新华社2025年11月报道其工坊仍在制作、承接订单；这说明既有匠人的实践仍在继续，未追踪体验者是否留下。',
      sourceId: 'xinhua-fish-2025',
    },
    {
      id: 'shen-yixin',
      name: '申易鑫',
      project: '徽墨制作技艺',
      region: '安徽黟县龙江村',
      description:
        '新华社2025年1月报道其从接触制墨技艺到成为县级非遗代表性传承人，并在民宿每周授课；报道未给出完整学习时间线。',
      sourceId: 'xinhua-ink-2025',
    },
  ],
  indicators: [
    {
      id: 'panmin-followers-2025',
      stage: 'attention',
      label: '潘敏个人社交媒体账号粉丝',
      valueText: '超15万',
      unit: '人',
      period: '2025年11月报道时',
      scope: '个人账号粉丝存量；不是汪满田鱼灯全网播放量，也不是参与人数',
      sourceId: 'xinhua-fish-2025',
    },
    {
      id: 'wang-shengjuan-followers',
      stage: 'attention',
      label: '汪胜娟社交账号粉丝',
      valueText: '上万',
      unit: '人',
      period: '2025年1月报道时',
      scope: '单个账号，人民日报报道口径；没有可比较的历史序列',
      sourceId: 'people-fish-2025',
    },
    {
      id: 'she-fish-artisans',
      stage: 'continuity',
      label: '纳入歙县非遗人才库的鱼灯手艺人',
      valueText: '61',
      unit: '人',
      period: '2025年11月报道时',
      scope: '歙县三项鱼灯相关技艺的县域口径，并非汪满田单一项目',
      sourceId: 'xinhua-fish-2025',
    },
    {
      id: 'she-fish-events-2025',
      stage: 'participation',
      label: '歙县鱼灯相关演艺与巡游活动',
      valueText: '300余',
      unit: '场',
      period: '2025年初至11月报道时',
      scope: '歙县全县活动场次；不是汪满田单一项目，也不是去重参与人数',
      sourceId: 'xinhua-fish-2025',
    },
    {
      id: 'she-night-show-2025',
      stage: 'participation',
      label: '徽州古城鱼灯夜游单日观演',
      valueText: '超1500',
      unit: '人次',
      period: '2025年国庆中秋长假期间的单日',
      scope: '一个夜游项目的单日观演人次；不是整个假期的累计或独立人数',
      sourceId: 'xinhua-fish-2025',
    },
  ],
  caseEvents: [
    {
      id: 'fish-attention-2024',
      caseId: 'fish',
      stage: 'attention',
      date: '2024-05-20',
      actor: '汪满田村鱼灯工坊',
      event:
        '新华社报道汪满田鱼灯受到更多关注，鱼灯节后工坊仍有制作和订单。这是一条新闻观察，尚不是平台热度曲线。',
      sourceId: 'xinhua-fish-2024',
    },
    {
      id: 'fish-participation-2025',
      caseId: 'fish',
      stage: 'participation',
      date: '2025-01-31',
      actor: '传承人汪重德与一户住客',
      event:
        '新华社记录：汪重德在歙县民宿指导住客一家制作汪满田鱼灯。报道证实一次动手体验，没有追踪这户住客后来的学习。',
      sourceId: 'xinhua-ink-2025',
    },
    {
      id: 'fish-practice-2025',
      caseId: 'fish',
      stage: 'continuity',
      date: '2025-11-07',
      actor: '汪华武的鱼灯工坊',
      event:
        '新华社报道汪华武的工坊仍在制作并承接订单。它记录了既有匠人的后续实践，不能据此推断前一节点的住客继续学习。',
      sourceId: 'xinhua-fish-2025',
    },
    {
      id: 'ink-participation-2025',
      caseId: 'ink',
      stage: 'participation',
      date: '2025-01-31',
      actor: '黟县龙江村一处徽墨主题民宿的住客',
      event:
        '新华社报道该民宿每晚开设徽墨讲堂，让住客体验点烟、制墨和描金。报道没有给出参与人数或体验后的追踪记录。',
      sourceId: 'xinhua-ink-2025',
    },
    {
      id: 'ink-practice-2025',
      caseId: 'ink',
      stage: 'continuity',
      date: '2025-01-31',
      actor: '申易鑫',
      event:
        '同篇报道记下：申易鑫在接触徽墨制作技艺后成为县级代表性传承人，报道时每周到民宿授课。进入、学习与认定的具体日期仍待补。',
      sourceId: 'xinhua-ink-2025',
    },
  ],
  sources: [
    {
      id: 'anhui-project-delivery',
      title: '安徽国家级项目子项交付表（99条，结构清洗版）',
      url: 'https://www.ihchina.cn/project/representative.html?p=1',
      accessedAt: '2026-09-28',
      note: '组员交付表经字段与关联检查；缺逐条官网链接和采集日期，逐条原文复核待补。',
    },
    {
      id: 'anhui-inheritor-delivery',
      title: '安徽国家级代表性传承人交付表（143人，结构清洗版）',
      url: 'https://www.ihchina.cn/representative',
      accessedAt: '2026-09-28',
      note: '143条均附官方个人详情页；交付说明报告抽查13人。原始接口JSON未随包交付。',
    },
    {
      id: 'xinhua-fish-2024',
      title: '新华社《小镇有非遗丨鱼灯“游”出新业态》',
      url: 'https://www.news.cn/ci/20240520/455cf04f86c944a7a9682be830fbb49b/c.html',
      accessedAt: '2026-09-26',
      note: '2024年5月20日报道；鱼灯节后的工坊、订单与参与报道。',
    },
    {
      id: 'people-fish-2025',
      title: '人民日报《商品供应有保障 假日消费活力足》',
      url: 'https://www.news.cn/20250121/9e014a541ff147ea9d8580f0f6cefe3f/c.html',
      accessedAt: '2026-09-26',
      note: '2025年1月21日转载；汪胜娟社交账号粉丝为报道口径，非平台后台数据。',
    },
    {
      id: 'xinhua-ink-2025',
      title: '新华社《古民居里遇见最美徽州年》',
      url: 'https://www.news.cn/20250131/1a41a736b9e64bf4814b81a09c4007ee/c.html',
      accessedAt: '2026-09-26',
      note: '2025年1月31日报道；记录汪满田鱼灯住客体验和徽墨民宿授课。',
    },
    {
      id: 'xinhua-fish-2025',
      title: '新华社《“一尾鱼灯”点亮乡村文化》',
      url: 'https://www.news.cn/local/20251107/75ca609714dd4898a437a1fde157d554/c.html',
      accessedAt: '2026-09-26',
      note: '2025年11月7日报道；工坊、县域手艺人和非遗人才库口径。',
    },
  ],
};

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
