import { lazy, Suspense, useState } from 'react';
import { ParticipationContext, PeopleContext } from './Narrative';
import { EvidenceSource } from './EvidenceSource';
import { publicEvidence } from '../content/evidence';
import type { SourceTopic } from '../content/story';
import { followupStages } from '../content/followup';

const LeadDesk = lazy(() => import('./DeliveryExplorers').then((m) => ({ default: m.LeadDesk })));
const ContinuityLoom = lazy(() =>
  import('./ContinuityLoom').then((m) => ({ default: m.ContinuityLoom })),
);

export function FollowupGuide() {
  const [letterOpened, setLetterOpened] = useState(false);
  return (
    <section className="section followup-guide" aria-labelledby="followup-heading">
      <span className="eyebrow">下一次回来 / 把追问留给真实的人</span>
      <h2 id="followup-heading">
        手艺的后来，<em>要有人接着问。</em>
      </h2>
      <p>
        如果你去过一场鱼灯体验，或在墨厂亲手描过金，可以从自己的下一次行动开始。以下是回访提纲，尚未开展的采访与追踪。
      </p>
      <ol className="followup-steps">
        {followupStages.map((stage) => (
          <li key={stage.title}>
            <b>{stage.title}</b>
            <span>{stage.summary}</span>
          </li>
        ))}
      </ol>
      <p className="human-ending">
        热闹让一门手艺进入视野。能够记录它怎样延续的，是下一次开工、下一次授课，以及同一个人的下一次回来。
      </p>
      <details
        className="ai-annex"
        onToggle={(event) => {
          if (event.currentTarget.open) setLetterOpened(true);
        }}
      >
        <summary>
          把问题带去下一次现场<span>和回访助手聊一聊 · 带走问题卡 ↗</span>
        </summary>
        {letterOpened && (
          <Suspense fallback={<p role="status">正在展开问题纸……</p>}>
            <ContinuityLoom />
          </Suspense>
        )}
      </details>
    </section>
  );
}

export function ReadingArchive({ onSource }: { onSource: (topic: SourceTopic) => void }) {
  const [open, setOpen] = useState(false);
  return (
    <section id="research" className="section reading-archive" aria-labelledby="research-heading">
      <span className="eyebrow">卷末资料 / 原文、方法与扩展探索</span>
      <h2 id="research-heading">
        每一条发现，<em>都可以往回查。</em>
      </h2>
      <p>{publicEvidence.method}</p>
      <details className="source-register">
        <summary>
          核对本文的10个公开来源<span>出版日期与原文链接 ↓</span>
        </summary>
        <ol>
          {publicEvidence.sources.map((source) => (
            <li key={source.id}>
              <EvidenceSource id={source.id} />
              <p>{source.verification}</p>
              {source.alternateUrl && (
                <a href={source.alternateUrl} target="_blank" rel="noreferrer">
                  {source.alternatePublisher}同报告转载 ↗
                </a>
              )}
            </li>
          ))}
        </ol>
      </details>
      <details className="source-register measure-register">
        <summary>
          展开{publicEvidence.measures.length}条带口径的证据记录
          <span>时间、对象、单位与解释边界 ↓</span>
        </summary>
        <div className="measure-register-grid">
          {publicEvidence.measures.map((measure) => (
            <article key={measure.id}>
              <span className="eyebrow">{measure.period}</span>
              <h3>{measure.label}</h3>
              <strong>
                {measure.valueText} <small>{measure.unit}</small>
              </strong>
              <p>{measure.scope}</p>
              <p>{measure.interpretation}</p>
              <small>{measure.limitation}</small>
              <EvidenceSource id={measure.sourceId} compact />
            </article>
          ))}
        </div>
      </details>
      <details className="research-archive" onToggle={(event) => setOpen(event.currentTarget.open)}>
        <summary>
          深读名录与资料台账<span>逐条名录 · 人物台账 · 采集线索 ↓</span>
        </summary>
        <p className="archive-boundary">
          这些材料提供地域与名录背景，不是体验者追踪数据。地图点位为布局示意，人物台账中的待匹配记录保留待核实状态。
        </p>
        {open && (
          <div className="archive-content">
            <ParticipationContext onSource={onSource} />
            <details className="research-annex leads-annex">
              <summary>鱼灯与徽墨采集线索</summary>
              <Suspense fallback={<p role="status">正在翻开采集线索……</p>}>
                <LeadDesk />
              </Suspense>
            </details>
            <PeopleContext onSource={onSource} />
          </div>
        )}
      </details>
    </section>
  );
}
