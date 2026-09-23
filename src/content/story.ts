export const chapters = [
  { id: 'overview', number: '01', title: '看见非遗', en: 'THE LANDSCAPE' },
  { id: 'craft', number: '02', title: '走近手艺', en: 'INSIDE THE CRAFT' },
  { id: 'people', number: '03', title: '找到传承的人', en: 'THE PEOPLE' },
  { id: 'after', number: '04', title: '热闹之后', en: 'BEYOND THE MOMENT' },
] as const;

export const introduction = {
  eyebrow: '一部关于非遗的数据新闻',
  subtitle: '从一盏鱼灯，一方徽墨出发，',
  question: '追问“被看见”如何走向“被传承”。',
  description:
    '灯火会散场，墨香会留下。我们沿着数据与手艺的纹理，寻找热闹背后，那些让文化继续生长的人与日常。',
};

export const craftStories = {
  fish: {
    title: '一盏灯，不止一夜光。',
    label: '鱼灯',
    english: 'THE FISH LANTERN',
    description:
      '从外面的灯火，走向里面的结构。试着展开这盏鱼灯，观察纸面、骨架与光如何组成一个整体。',
    parts: [
      {
        title: '骨架',
        subtitle: '支起一盏灯的形状',
        text: '以弧线勾勒鱼形，呈现骨架与外层的关系。具体材料、连接方式与地方做法，等待工艺资料核验后补入。',
      },
      {
        title: '纸面',
        subtitle: '让光有了颜色',
        text: '半透明的外层与纹样共同构成视觉效果。此处预留纸面处理、彩绘方式和对应图像的说明。',
      },
      {
        title: '灯火',
        subtitle: '从物件走向共同参与',
        text: '这里将连接制作、巡游与社区参与的案例资料。不同村落的习俗与做法会分别标注。',
      },
    ],
  },
  ink: {
    title: '一方墨，时间的形状。',
    label: '徽墨',
    english: 'THE INK STICK',
    description:
      '转动一方墨，看见表面的纹理，也追问它背后的时间。工艺资料到位后，这里将展开具体工坊的制作过程。',
    parts: [
      {
        title: '墨体',
        subtitle: '从原料到成品',
        text: '此处承接原料、加工和成形的资料。步骤顺序以具体技艺或工坊的可靠来源为准。',
      },
      {
        title: '纹样',
        subtitle: '手艺留在表面',
        text: '模型上的“徽墨”字样与边饰为原创示意。真实墨模、纹样与制作者信息将在素材核验后替换。',
      },
      {
        title: '使用',
        subtitle: '一方墨的另一段旅程',
        text: '成品的使用体验与制作工艺分开展示。此处预留产品、体验活动和持续学习的案例证据。',
      },
    ],
  },
} as const;

export type SourceTopic = 'method' | 'catalogue' | 'craft' | 'people' | 'reports';
export const sources: Record<
  SourceTopic,
  { title: string; description: string; items: { title: string; text: string; url?: string }[] }
> = {
  method: {
    title: '关于这份数据新闻',
    description: '当前为视觉初版。页面结构与交互已建立，正式统计、人物与案例资料仍待采集和复核。',
    items: [
      {
        title: '数据如何进入页面',
        text: '公开资料 → 来源核验 → 统一口径 → 图表与文字。未完成核验的内容不显示为新闻事实。',
      },
      {
        title: '模型与示意图',
        text: '鱼灯、墨锭均为原创程序生成的视觉示意，不是实物扫描或精确复原。点阵用于演示排布，不代表真实项目或数量。',
      },
      {
        title: '研究范围',
        text: '以全国及安徽名录、安徽代表性传承人、鱼灯与徽墨案例、公开传播和文旅报告为四条资料线。本轮不以问卷或实地采集为前提。',
      },
    ],
  },
  catalogue: {
    title: '名录 · 数据与口径',
    description: '图表预留：全国类别结构、安徽地区分布、认定批次。正式数据尚未接入。',
    items: [
      {
        title: '公开来源入口',
        text: '国家级非物质文化遗产代表性项目名录。正式引用时记录统计日期、范围和原始字段。',
        url: 'https://www.ihchina.cn/project',
      },
      {
        title: '区分统计单位',
        text: '项目数与地区子项数分开计算；不同认定级别不混合。认定批次不解释为传播热度。',
      },
      {
        title: '当前画面',
        text: '点阵为布局示意，切换只演示呈现方式。没有真实数量、地图边界或地区定位。',
      },
    ],
  },
  craft: {
    title: '工艺 · 资料与模型',
    description: '模型供视觉校对和交互体验。页面不将示意结构作为具体地方工艺的事实依据。',
    items: [
      {
        title: '鱼灯与徽墨',
        text: '预留工艺步骤、材料、工具、地方或工坊、对应来源。资料不完整时保留未知，不自行编造工序。',
      },
      {
        title: '素材说明',
        text: '当前模型及程序纹理由本项目原创生成。后续图片、视频和声音需记录作者、来源及使用依据。',
      },
    ],
  },
  people: {
    title: '人物 · 关联与边界',
    description: '人物资料区尚未接入正式记录，不以虚构姓名和采访填充。',
    items: [
      {
        title: '公开来源入口',
        text: '国家级非物质文化遗产代表性传承人资料。',
        url: 'https://www.ihchina.cn/representative',
      },
      { title: '人物与项目', text: '仅展示核验后的关联。共同参与同一项目不自动表示师徒关系。' },
      {
        title: '出生信息',
        text: '优先呈现有证据的出生年代。出生信息缺失单独说明，名录也不等于全部活跃从业者。',
      },
    ],
  },
  reports: {
    title: '传播 · 可比较的证据',
    description: '预留公开报告指标和案例事件，待核验后呈现。',
    items: [
      {
        title: '各自的单位与时间',
        text: '播放、订单、游客人次、收入、学习人数不是同一指标。不同单位分别展示，不拼接成转化漏斗。',
      },
      {
        title: '暂不下结论',
        text: '未取得可比序列时不画增长曲线；缺少追踪证据时不计算持续参与或留存率。',
      },
    ],
  },
};
