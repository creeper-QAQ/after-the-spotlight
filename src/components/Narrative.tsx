import { dataset, type IndicatorRecord } from '../content/data';
import { lazy, Suspense } from 'react';
import type { SourceTopic } from '../content/story';
import { CraftStudio } from './CraftStudio';
import { EvidenceWall } from './EvidenceWall';
import { EvidenceSource } from './EvidenceSource';
import { publicMeasure } from '../content/evidence';

const CatalogueViz = lazy(() =>
  import('./CatalogueViz').then((m) => ({ default: m.CatalogueViz })),
);
const LeadDesk = lazy(() => import('./DeliveryExplorers').then((m) => ({ default: m.LeadDesk })));
const PeopleExplorer = lazy(() =>
  import('./DeliveryExplorers').then((m) => ({ default: m.PeopleExplorer })),
);
const ReportObservatory = lazy(() =>
  import('./ReportObservatory').then((m) => ({ default: m.ReportObservatory })),
);

const archiveLoading = <p role="status">正在翻开资料……</p>;

type SourceAction = (topic: SourceTopic) => void;
type Stage = IndicatorRecord['stage'];
const stages: { id: Stage; label: string; question: string; needed: string }[] = [
  {
    id: 'attention',
    label: '被关注',
    question: '热度出现在哪个平台、哪段时间？',
    needed: '平台、指标、日期范围、统计单位与原始出处',
  },
  {
    id: 'participation',
    label: '走向现场',
    question: '有人从观看走向现场或第一次动手吗？',
    needed: '活动日期、参与方式、去重口径与现场记录',
  },
  {
    id: 'continuity',
    label: '持续实践',
    question: '活动结束后，谁还在学习与制作？',
    needed: '同一案例、同一对象、跨时间的学习或制作记录',
  },
];

function findSource(id: string) {
  return dataset.sources.find((source) => source.id === id);
}

function indicatorsAt(stage: Stage) {
  return dataset.indicators.filter((item) => item.stage === stage && findSource(item.sourceId));
}

function StageMark({ number, label }: { number: string; label: string }) {
  return (
    <div className="story-stage-mark">
      <span>{number}</span>
      <strong>{label}</strong>
      <i />
    </div>
  );
}

function RecordLink({ sourceId }: { sourceId: string }) {
  const source = findSource(sourceId);
  if (!source) return null;
  return (
    <a href={source.url} target="_blank" rel="noreferrer" className="record-source">
      来源：{source.title} ↗
    </a>
  );
}

function IndicatorList({ stage }: { stage: Stage }) {
  const records = indicatorsAt(stage);
  if (!records.length) return null;
  return (
    <div className="story-indicators">
      {records.map((record) => (
        <article key={record.id} className="story-indicator">
          <span>{record.label}</span>
          <strong>
            {record.valueText} {record.unit}
          </strong>
          <small>
            {record.period} · {record.scope}
          </small>
          <RecordLink sourceId={record.sourceId} />
        </article>
      ))}
    </div>
  );
}

function DataGap({ stage, onSource }: { stage: Stage; onSource: SourceAction }) {
  const item = stages.find((entry) => entry.id === stage)!;
  return (
    <div className="data-gap">
      <div className="data-gap-state">
        <span className="data-gap-dot" />
        <strong>线索仍在寻找</strong>
        <small>{item.label}</small>
      </div>
      <div className="data-gap-detail">
        <p>{item.question}</p>
        <span>需要：{item.needed}</span>
      </div>
      <button onClick={() => onSource(stage === 'continuity' ? 'people' : 'reports')}>
        查看口径 ↗
      </button>
    </div>
  );
}

export function Attention({ onSource }: { onSource: SourceAction }) {
  const records = indicatorsAt('attention');
  return (
    <section id="phenomenon" className="section story-section story-attention">
      <StageMark number="01" label="灯火如何被看见" />
      <div className="story-lead">
        <span className="eyebrow">THE ATTENTION / 从屏幕上的热闹说起</span>
        <h2>
          “爆火”之后，
          <br />
          <em>究竟发生了什么？</em>
        </h2>
        <div>
          <p>
            一尾鱼灯游进短视频，远方的人也看见了村里的夜色。转发、收藏、相约出发，热闹从屏幕漫向长街。故事的开头，是一门手艺忽然被许多人看见。
          </p>
          <p>
            播放与搜索留下了关注的痕迹。把平台、时间与统计口径放在一起，才能看清这阵热闹的来路。
          </p>
        </div>
      </div>
      <div className="story-evidence-head">
        <span className="eyebrow">证据 01 / 传播记录</span>
        <span>播放 ≠ 到访 ≠ 学习</span>
      </div>
      {records.length ? (
        <IndicatorList stage="attention" />
      ) : (
        <DataGap stage="attention" onSource={onSource} />
      )}
      <p className="story-method-note">
        名录按安徽申报地区或单位子项统计，逐条来源随记录保留。
        <EvidenceSource id="pub-ink-2026" compact />
      </p>
      <a className="story-next" href="#viral-burst">
        看看这股关注如何进入公众视野 <span>↓</span>
      </a>
    </section>
  );
}

export function ParticipationContext({ onSource }: { onSource: SourceAction }) {
  const records = indicatorsAt('participation');
  return (
    <section
      id="participation-context"
      className="section story-section story-participation-context"
    >
      <div className="story-lead compact">
        <span className="eyebrow">从全国视野，回到具体现场</span>
        <h2>
          从名录上的名字，
          <br />
          <em>走到亲手制作的现场。</em>
        </h2>
        <div>
          <p>
            翻开名录，一门门手艺有了名字与归属。再往前走，才是点灯的长街、飘着墨香的工坊，以及第一次拿起工具的人。
          </p>
        </div>
      </div>
      <details className="research-annex catalogue-annex">
        <summary>
          <span>资料附页 / 安徽名录统计</span>
          <small>点击展开 · 按类别、地区与批次查阅</small>
          <b>＋</b>
        </summary>
        <Suspense fallback={archiveLoading}>
          <CatalogueViz onSource={() => onSource('catalogue')} />
        </Suspense>
      </details>
      <div className="story-layer">
        <div className="story-layer-label">
          <b>B</b>
          <span>
            调查层
            <br />
            <small>谁实际参与了活动</small>
          </span>
        </div>
        <div className="story-layer-main">
          {records.length ? (
            <IndicatorList stage="participation" />
          ) : (
            <DataGap stage="participation" onSource={onSource} />
          )}
          <p className="story-method-note">
            人次记下现场的热闹，人数记下走进来的人。一个人可以来很多回；从屏幕到工坊的路，也需要前后相接的记录。
          </p>
        </div>
      </div>
      <a className="story-next" href="#case-followup">
        把镜头交给同一个案例 <span>↓</span>
      </a>
      <Suspense fallback={archiveLoading}>
        <ReportObservatory />
      </Suspense>
    </section>
  );
}

export function CaseFollowup() {
  return (
    <section id="case-followup-archive" className="section story-section story-case">
      <StageMark number="03" label="把时间拉长" />
      <div className="story-lead">
        <span className="eyebrow">FOLLOW ONE CASE / 追踪同一项技艺</span>
        <h2>
          一次热闹结束后，
          <br />
          <em>故事还在继续吗？</em>
        </h2>
        <div>
          <p>
            把不同时间的报道放在一起，热闹之后的日常渐渐显出来：有人来体验，有人继续接单，也有人每周教课。沿着这些记录，我们继续寻找当初那些来体验的人。
          </p>
        </div>
      </div>
      <EvidenceWall />
      <details className="research-annex leads-annex">
        <summary>
          <span>资料案卷</span>
          <small>点击展开 · 鱼灯与徽墨 30 条采集线索</small>
          <b>＋</b>
        </summary>
        <Suspense fallback={archiveLoading}>
          <LeadDesk />
        </Suspense>
      </details>
    </section>
  );
}

export function CraftContext({
  onSource,
  motion,
  kind,
  onKindChange,
}: {
  onSource: SourceAction;
  motion: boolean;
  kind?: 'fish' | 'ink';
  onKindChange?: (kind: 'fish' | 'ink') => void;
}) {
  return (
    <section id="craft" className="section story-section story-craft-context">
      <div className="story-lead compact">
        <span className="eyebrow">调查补充 / 第一次动手</span>
        <h2>
          跟着工序，
          <br />
          <em>让一件手艺成形。</em>
        </h2>
        <div>
          <p>
            从竹骨到纸面，从烟料到墨锭。跟着步骤，观察材料怎样成为一件作品。
          </p>
        </div>
      </div>
      <CraftStudio
        motion={motion}
        activeKind={kind}
        onKindChange={onKindChange}
        onSource={() => onSource('craft')}
      />
      <p className="story-method-note">
        徽墨有八道大工序，晾墨需半年以上。制作台带你认识其中的动作。
        <EvidenceSource id="pub-ink-2026" compact />
      </p>
    </section>
  );
}

export function PeopleContext({ onSource }: { onSource: SourceAction }) {
  const people = dataset.people.filter((person) => findSource(person.sourceId));
  return (
    <section id="people" className="section story-section story-people-context">
      <div className="story-lead compact">
        <span className="eyebrow">调查补充 / 人与实践</span>
        <h2>
          真正留下的，
          <br />
          <em>是把手艺做下去的人。</em>
        </h2>
        <div>
          <p>
            手艺有人教、有人学，也有人靠它过日子。循着名录上的名字走近，才有机会看见谁在开工、谁在授课，谁接过了上一辈的工具。
          </p>
        </div>
      </div>
      <Suspense fallback={archiveLoading}>
        <PeopleExplorer />
      </Suspense>
      {people.length ? (
        <div className="person-ledger">
          {people.map((person) => (
            <article key={person.id}>
              <strong>{person.name}</strong>
              <span>
                {person.project} · {person.region}
              </span>
              <p>{person.description}</p>
              <RecordLink sourceId={person.sourceId} />
            </article>
          ))}
        </div>
      ) : (
        <div className="people-gap">
          <span>寻找做手艺的人</span>
          <p>谁在教，谁在学，又坚持了多久？这些人的日常，是接下来要寻找的记录。</p>
          <button onClick={() => onSource('people')}>查看人物资料口径 ↗</button>
        </div>
      )}
      {indicatorsAt('continuity').length > 0 && (
        <div className="people-indicators">
          <span className="eyebrow">COUNT WITH CONTEXT / 人才与实践的一个侧面</span>
          <IndicatorList stage="continuity" />
          <p>
            县域人才库记下当地登记在册的人才。这个数字属于整个县域；具体到一门手艺，还要回到各自的学习与制作记录。
          </p>
        </div>
      )}
    </section>
  );
}

export function Verdict({ onSource }: { onSource: SourceAction }) {
  const views = publicMeasure('keyword-views');
  const visits = publicMeasure('ink-visits');
  const talents = publicMeasure('fish-talents');
  const attention = indicatorsAt('attention').length > 0;
  const participation =
    indicatorsAt('participation').length > 0 ||
    dataset.caseEvents.some((row) => row.stage === 'participation' && findSource(row.sourceId));
  const continuity = dataset.caseEvents.some(
    (row) => row.stage === 'continuity' && findSource(row.sourceId),
  );
  const states = [attention, participation, continuity];
  const findings = [
    '春节相关视频的播放与账号粉丝，留下了鱼灯被关注的痕迹；这些记录各有时间与口径。',
    `鱼灯有人来体验，老胡开文墨厂2025年研学接待${visits.valueText}${visits.unit}。接待记录记的是人次，同一人可多次到访。`,
    '鱼灯工坊继续接单，申易鑫每周授课。师傅的日常有迹可循，来体验的人后来如何，记录还没有接上。',
  ];
  return (
    <section id="after" className="section story-section story-verdict">
      <StageMark number="04" label="回到开篇的问题" />
      <div className="story-lead">
        <span className="eyebrow">AFTER THE CROWD / 人潮散去，手艺留下</span>
        <h2>
          被看见之后，
          <br />
          <em>传承发生了吗？</em>
        </h2>
        <div>
          <p>
            屏幕上的关注、工坊里的体验、师傅的日常，各自留下了记录。把它们放在一起，我们看见了手艺与更多人的相遇，也看见了一个仍需追问的后来。
          </p>
        </div>
      </div>
      <div className="verdict-table" role="table" aria-label="四类证据核对表">
        <div className="verdict-head" role="row">
          <span role="columnheader">调查环节</span>
          <span role="columnheader">记录的来处</span>
          <span role="columnheader">沿线看见的事</span>
        </div>
        {stages.map((stage, index) => (
          <div className="verdict-row" role="row" key={stage.id}>
            <strong role="cell">
              <i>0{index + 1}</i>
              {stage.label}
            </strong>
            <span role="cell" className={states[index] ? 'has-source' : ''}>
              {states[index] ? '有报道可循' : '线索仍在寻找'}
            </span>
            <p role="cell">{states[index] ? findings[index] : stage.needed}</p>
          </div>
        ))}
        <div className="verdict-row verdict-unknown" role="row">
          <strong role="cell">
            <i>04</i>体验者持续学习
          </strong>
          <span role="cell">仍未知</span>
          <p role="cell">
            缺少同一批体验者的首次体验与后续回访记录，无法计算持续学习的比例。未知不等于没有人留下。
          </p>
        </div>
      </div>
      <div className="verdict-note">
        <span>热闹之后 / 我们已经知道</span>
        <p>
          <b>手艺确实被看见了。</b>
          黄山等关键词相关视频在2025年春节报告窗口播放{views.valueText}
          {views.unit}；汪满田的工坊在鱼灯节后仍在接单。
        </p>
        <p>
          <b>也确实有人走近了现场。</b>
          老胡开文墨厂2025年研学接待{visits.valueText}
          {visits.unit}；申易鑫每周到民宿授课；{talents.valueText}
          位鱼灯手艺人进了歙县人才库。
        </p>
        <p>
          <b>年轻人也在鱼灯相关行业中工作。</b>
          新华社报道，歙县相关行业从业者中，35岁以下占比
          {publicMeasure('fish-young-workers').valueText}
          {publicMeasure('fish-young-workers').unit}
          。这是县域年龄结构，不能说明这些人从一次体验走向了学艺。
        </p>
        <p>
          <b>但"看见"和"传承"之间，还差一段没接上的路。</b>
          那户做灯的住客、那些来研学的人，后来有没有继续学、继续做？体验者持续学习的比例仍未知，现有报道还没有接上同一批人的回访。
        </p>
        <p>
          热闹之后，我们继续问：谁来接着做？播放留下关注的记录，下一次开工和授课，才让实践有了跨期的线索。
        </p>
        <p>
          我们想继续寻找那些来过的人：过了一季、一年，谁还在学，谁开始独自制作，谁又教会了别人？
        </p>
        <button onClick={() => onSource('method')}>阅读研究方法与来源 ↗</button>
      </div>
    </section>
  );
}
