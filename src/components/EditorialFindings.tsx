import { EvidenceSource } from './EvidenceSource';
import { publicEvidence, publicMeasure } from '../content/evidence';

const findings = [
  {
    number: '01',
    title: '热度留下数字',
    figure: publicMeasure('keyword-views').valueText,
    unit: publicMeasure('keyword-views').unit,
    text: '黄山、鱼灯、歙县等关键词相关视频的播放，记录了公众的目光。',
    note: '2025春节报告窗口 · 合集播放，非独立人数',
    source: publicMeasure('keyword-views').sourceId,
    href: '#phenomenon',
    action: '看清热度的口径',
  },
  {
    number: '02',
    title: '体验走进工厂',
    figure: publicMeasure('ink-visits').valueText,
    unit: publicMeasure('ink-visits').unit,
    text: `老胡开文墨厂2025年研学接待，同比增长${publicMeasure('ink-visits-growth').valueText}%。接待已经成为日常经营的一部分。`,
    note: '单一墨厂 · 人次不等于学徒人数',
    source: publicMeasure('ink-visits').sourceId,
    href: '#participation',
    action: '换一把尺，核对证据',
  },
  {
    number: '03',
    title: '继续，需要接续',
    figure: String(publicEvidence.people.length),
    unit: '条人物路径',
    text: '潘敏在教，申易鑫在教，汪华武在做。跨期报道能追踪他们，却还没接上同一批体验者的后来。',
    note: '本文选取的实名案例 · 不代表行业总体',
    source: 'pub-fish-2025',
    href: '#case-followup',
    action: '沿着名字往后看',
  },
];

export function EditorialFindings() {
  return (
    <section
      id="findings"
      className="editorial-findings section"
      aria-labelledby="findings-heading"
    >
      <div className="findings-heading">
        <span className="eyebrow">先读这一页 / 我们沿着公开记录发现</span>
        <h2 id="findings-heading">
          热闹有了来处。<em>后来，要循着人找。</em>
        </h2>
        <p>
          从安徽鱼灯与徽墨出发，我们把播放、接待和人物记录放回各自的时间与范围。这卷故事关心的，是手艺怎样进入日常。
        </p>
      </div>
      <div className="findings-grid">
        {findings.map((item) => (
          <article className="editorial-finding" key={item.number}>
            <div className="finding-index">
              <span>{item.number}</span>
              <h3>{item.title}</h3>
            </div>
            <div className="finding-figure">
              <strong>{item.figure}</strong>
              <span>{item.unit}</span>
            </div>
            <p>{item.text}</p>
            <small>{item.note}</small>
            <EvidenceSource id={item.source} compact />
            {item.number === '03' && <EvidenceSource id="pub-shen-2026" compact />}
            <a className="finding-next" href={item.href}>
              {item.action}
              <span>↘</span>
            </a>
          </article>
        ))}
      </div>
      <div className="reading-contract">
        <span>沿主线阅读，或直接走进制作</span>
        <p>能核对的是关注、现场与实名实践；体验者持续学习的比例，目前仍未知。</p>
        <div className="reading-shortcuts">
          <a href="#craft">亲手做鱼灯 / 徽墨 ↘</a>
          <a href="#research">查阅资料与方法 ↗</a>
        </div>
      </div>
    </section>
  );
}
