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
const PeopleStories = lazy(() =>
  import('./PeopleStories').then((m) => ({ default: m.PeopleStories })),
);
const EvidenceReader = lazy(() =>
  import('./EvidenceReader').then((m) => ({ default: m.EvidenceReader })),
);

export function FollowupGuide() {
  const [letterOpened, setLetterOpened] = useState(false);
  return (
    <section className="section followup-guide" aria-labelledby="followup-heading">
      <span className="eyebrow">下一次现场</span>
      <h2 id="followup-heading">
        带上一个问题，<em>再走近一门手艺。</em>
      </h2>
      <p>
        想进一步了解一门手艺，可以从一次动手、一次课程、一次与师傅的交谈开始。下面的提纲可以带去现场。
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

export function ReadingArchive({
  onSource,
  kind = 'fish',
  onKindChange,
}: {
  onSource: (topic: SourceTopic) => void;
  kind?: 'fish' | 'ink';
  onKindChange?: (kind: 'fish' | 'ink') => void;
}) {
  const [open, setOpen] = useState(false);
  const [peopleOpened, setPeopleOpened] = useState(false);
  const [methodOpened, setMethodOpened] = useState(false);
  return (
    <section id="research" className="section reading-archive" aria-labelledby="research-heading">
      <span className="eyebrow">卷末 / 证据中心</span>
      <h2 id="research-heading">
        每一条发现，<em>都可以往回查。</em>
      </h2>
      <p>正文所用的原文、人物时间线与研究记录，都放在这里。选择一项，展开核对。</p>
      <details
        id="people-evidence"
        className="people-annex source-register"
        onToggle={(e) => {
          if (e.currentTarget.open) setPeopleOpened(true);
        }}
      >
        <summary>
          人物与日常实践<span>潘敏 · 申易鑫 · 汪华武 ↓</span>
        </summary>
        {peopleOpened && (
          <div className="evidence-center-body">
            <Suspense fallback={<p role="status">正在展开人物记录……</p>}>
              <PeopleStories kind={kind} />
            </Suspense>
          </div>
        )}
      </details>
      <details className="source-register source-registry">
        <summary>
          核对本文的{publicEvidence.sources.length}个公开来源<span>出版日期与原文链接 ↓</span>
        </summary>
        <ol>
          {publicEvidence.sources.map((source) => (
            <li key={source.id} id={`source-${source.id}`}>
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
      <details
        className="method-annex source-register"
        onToggle={(e) => {
          if (e.currentTarget.open) setMethodOpened(true);
        }}
      >
        <summary>
          研究方法与采集台账<span>10组片段编码 · 94条指标复算 ↓</span>
        </summary>
        {methodOpened && (
          <div className="evidence-center-body">
            <Suspense fallback={<p role="status">正在展开方法与台账……</p>}>
              <EvidenceReader id="evidence-method" kind={kind} onKindChange={onKindChange} />
            </Suspense>
          </div>
        )}
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
          这里收录安徽名录与人物资料，逐条来源和复核状态随记录保留。
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
