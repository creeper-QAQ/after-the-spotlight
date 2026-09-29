import { useState } from 'react';
import type { SourceTopic } from '../content/story';
const lenses = [
  {
    name: '屏幕上的热度',
    word: '看见',
    question: '“爆火”，具体指什么？',
    metric: '播放量 / 搜索趋势 / 讨论量',
    need: '预留同一平台、同一口径、明确时间区间的传播记录。不同平台的数字分别呈现。',
    boundary: '播放量可以说明内容被传播，不能直接说明有多少人来到现场或开始学习。',
  },
  {
    name: '现场的参与',
    word: '走近',
    question: '从屏幕到现场，发生了什么？',
    metric: '活动人次 / 体验报名 / 到访记录',
    need: '预留活动日期、参与方式、人数口径和来源。区分累计人次与去重人数。',
    boundary: '参加过一次活动，并不等于掌握技艺；现场人次不能直接除以播放量计算转化率。',
  },
  {
    name: '热闹后的日常',
    word: '留下',
    question: '过了这个节点，还有人继续吗？',
    metric: '持续学习 / 制作实践 / 后续活动',
    need: '预留同一案例跨时间的学习、制作与组织记录，标注跟踪时段和缺失资料。',
    boundary: '持续实践更接近传承问题，但仍需核验参与者、实践内容和持续时间。',
  },
];
export function Phenomenon({ onSource }: { onSource: (topic: SourceTopic) => void }) {
  const [active, setActive] = useState(0);
  const item = lenses[active];
  return (
    <section id="phenomenon" className="section phenomenon-section">
      <div className="chapter-label">
        <span className="chapter-number">01</span>
        <span>THE PHENOMENON</span>
        <span className="chapter-rule" />
      </div>
      <div className="section-heading">
        <h2>
          被转发，被打卡。
          <br />
          然后<span className="accent">呢？</span>
        </h2>
        <p>
          我们从“爆火”的说法出发。
          <br />
          先问清热度如何被记录，再追问它是否带来了持续传承。
        </p>
      </div>
      <div className="phenomenon-board">
        <div className="observation-tabs" aria-label="选择调查视角">
          {lenses.map((lens, i) => (
            <button key={lens.name} aria-pressed={active === i} onClick={() => setActive(i)}>
              <span>0{i + 1}</span>
              {lens.name}
              <b>↗</b>
            </button>
          ))}
        </div>
        <div className="observation-body" aria-live="polite">
          <span className="observation-word" aria-hidden="true">
            {item.word}
          </span>
          <span className="eyebrow">调查起点 / {String(active + 1).padStart(2, '0')}</span>
          <h3>{item.question}</h3>
          <div className="metric-reserve">
            <strong>—</strong>
            <span>
              {item.metric}
              <small>数据位置已预留 · 待采集与核验</small>
            </span>
          </div>
          <p>{item.need}</p>
          <p className="evidence-boundary">{item.boundary}</p>
          <button className="text-button" onClick={() => onSource('reports')}>
            查看指标口径 ↗
          </button>
        </div>
      </div>
      <p className="investigation-bridge">
        下一个问题：当我们把镜头从热闹拉近，究竟要观察什么？ <span>↓</span>
      </p>
    </section>
  );
}
const trails = [
  {
    title: '活动发生时',
    question: '谁被吸引过来？',
    fish: '活动报道、参与方式、组织者与现场记录。',
    ink: '产品传播、工坊参观、体验活动与使用场景。',
  },
  {
    title: '第一次动手',
    question: '从体验到学习差多远？',
    fish: '是否亲手参与制作，学习内容与指导方式是否明确？',
    ink: '研墨体验、制墨体验与完整技艺学习分别记录。',
  },
  {
    title: '活动结束后',
    question: '还有谁继续？',
    fish: '后续制作、重复参与、学习记录与组织支持。',
    ink: '持续练习、独立制作、工坊实践与教学记录。',
  },
];
export function CaseTrail() {
  const [kind, setKind] = useState<'fish' | 'ink'>('fish');
  return (
    <div id="case-followup" className="section case-trail">
      <div className="trail-heading">
        <div>
          <span className="eyebrow">FOLLOW THE CASE / 把时间拉长</span>
          <h2>
            离开现场之后，
            <br />
            继续追踪同一个案例。
          </h2>
        </div>
        <div className="craft-tabs">
          {(['fish', 'ink'] as const).map((key) => (
            <button key={key} aria-pressed={kind === key} onClick={() => setKind(key)}>
              {key === 'fish' ? '追踪鱼灯' : '追踪徽墨'}
            </button>
          ))}
        </div>
      </div>
      <div className="trail-grid">
        {trails.map((item, i) => (
          <article key={item.title}>
            <span className="trail-dot">0{i + 1}</span>
            <small>{item.title}</small>
            <h3>{item.question}</h3>
            <p>{item[kind]}</p>
            <div className="trail-source">记录位置 / 时间、案例、来源待补</div>
          </article>
        ))}
      </div>
      <p className="trail-note">
        这是案例追踪框架，不是已发生事件的时间线。只有同一案例的可靠记录，才能连接前后变化。
      </p>
    </div>
  );
}
export function EvidenceReader() {
  const [active, setActive] = useState(0);
  return (
    <div className="section evidence-reader">
      <span className="eyebrow">READ THE EVIDENCE / 最后，检查判断</span>
      <h2>一条证据，能把结论推多远？</h2>
      <div className="evidence-reader-tabs">
        {['热度增长', '体验增加', '持续学习'].map((label, i) => (
          <button key={label} aria-pressed={active === i} onClick={() => setActive(i)}>
            {label}
          </button>
        ))}
      </div>
      <div className="evidence-verdict" aria-live="polite">
        <div>
          <span>可以支持的判断</span>
          <h3>{['传播受到关注', '出现了参与行为', '存在持续实践的线索'][active]}</h3>
          <p>
            {
              [
                '前提是平台、指标与时间可以比较。',
                '前提是参与记录、活动范围与人数口径明确。',
                '前提是同一案例跨时间的记录可以核验。',
              ][active]
            }
          </p>
        </div>
        <div>
          <span>还不能直接得出的结论</span>
          <h3>{['热度带来了传承', '体验者成为了传承者', '整个项目已经传承无忧'][active]}</h3>
          <p>{lenses[active].boundary}</p>
        </div>
      </div>
      <p className="open-verdict">当前结论：证据尚未齐备，暂不判断“爆火”是否转化为持续传承。</p>
    </div>
  );
}
