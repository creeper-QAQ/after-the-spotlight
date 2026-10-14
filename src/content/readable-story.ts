export const readableChapters = [
  { id: 'history', number: '01', title: '手艺来历', en: 'THE CRAFT' },
  { id: 'phenomenon', number: '02', title: '灯火出圈', en: 'THE ATTENTION' },
  { id: 'participation', number: '03', title: '有人来学吗', en: 'THE LEARNING' },
  { id: 'after', number: '04', title: '后来还在做吗', en: 'THE CONTINUITY' },
] as const;

export const craftHistories = [
  {
    name: '鱼灯',
    place: '歙县汪满田村',
    text: '正月十三到十六，村民带着鱼灯走过街巷，把平安的祝愿送到家家户户。这项年俗传承了六百多年，2022年进入安徽省级非遗名录。',
    points: [
      ['600多年', '村落里的嬉鱼灯年俗'],
      ['2022年', '进入安徽省级非遗名录'],
    ],
    sourceId: 'pub-fish-history-2024',
  },
  {
    name: '徽墨',
    place: '文房里的传统技艺',
    text: '徽墨生产可追溯到唐代末期。取烟、和料、捶打、晾墨，一方墨凝聚着匠人的经验。2006年，徽墨制作技艺进入首批国家级非遗名录。',
    points: [
      ['唐代末期', '徽墨生产的历史来处'],
      ['2006年', '进入国家级非遗名录'],
    ],
    sourceId: 'pub-ink-catalogue',
  },
] as const;

export const trainingMeasureIds = [
  'training-colleges',
  'training-classes',
  'training-person-times',
];
