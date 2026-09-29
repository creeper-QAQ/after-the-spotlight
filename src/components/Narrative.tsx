import { dataset, type IndicatorRecord } from '../content/data';
import type { SourceTopic } from '../content/story';
import { CatalogueViz } from './CatalogueViz';
import { LeadDesk, PeopleExplorer } from './DeliveryExplorers';
import { CraftStudio } from './CraftStudio';
import { EvidenceWall } from './EvidenceWall';

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
        <strong>证据待核验</strong>
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
      <StageMark number="01" label="先界定热度" />
      <div className="story-lead">
        <span className="eyebrow">THE CLAIM / 一个需要核对的说法</span>
        <h2>
          “爆火”之后，
          <br />
          <em>究竟发生了什么？</em>
        </h2>
        <div>
          <p>
            屏幕上的刷屏、活动现场的人潮和手艺的延续，常被连成同一个故事。但它们记录的是不同的事。调查从最前面的一环开始：被看见，具体是怎样被记录的？
          </p>
          <p>只有在相同平台、相同指标和明确时间范围内，热度变化才有可比较的基础。</p>
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
        即使找到播放或搜索数据，也只能先说明关注的规模与变化；它不能单独证明人们走进现场，更不能证明技艺得到传承。
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
          地图记录的是项目，
          <br />
          <em>现场记录的才是参与。</em>
        </h2>
        <div>
          <p>
            名录告诉我们哪些技艺被认定和保护，它不能告诉我们一次走红之后有多少人开始接触手艺。因此，这里把“名录背景”和“现场参与”分成两层证据。
          </p>
        </div>
      </div>
      <details className="research-annex catalogue-annex">
        <summary>
          <span>资料附页 / 安徽名录统计</span>
          <small>按类别、地区与批次继续查阅</small>
          <b>＋</b>
        </summary>
        <CatalogueViz onSource={() => onSource('catalogue')} />
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
            到访人次、体验报名和独立参与者的单位不同。缺少同一批人的追踪记录时，不能把现场人数除以播放量，称为“转化率”。
          </p>
        </div>
      </div>
      <a className="story-next" href="#case-followup">
        把镜头交给同一个案例 <span>↓</span>
      </a>
    </section>
  );
}

export function CaseFollowup() {
  return (
    <section id="case-followup" className="section story-section story-case">
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
            像整理案卷一样，把公开报道钉在同一面墙上。沿红线往下看：先出现的是关注，接着是一次体验，最后是已有匠人的持续制作。关键在于，这三张卡是否记录了同一批人。
          </p>
        </div>
      </div>
      <EvidenceWall />
      <details className="research-annex leads-annex">
        <summary>
          <span>打开资料案卷</span>
          <small>鱼灯与徽墨 · 30 条采集线索</small>
          <b>＋</b>
        </summary>
        <LeadDesk />
      </details>
    </section>
  );
}

export function CraftContext({ onSource }: { onSource: SourceAction; motion: boolean }) {
  return (
    <section id="craft" className="section story-section story-craft-context">
      <div className="story-lead compact">
        <span className="eyebrow">调查补充 / 第一次动手</span>
        <h2>
          体验一次制作，
          <br />
          <em>离学会还有多远？</em>
        </h2>
        <div>
          <p>
            制作体验帮我们看清镜头里容易省略的工序。它说明“参与”可以有不同深度；判断是否传承，还需要真实学习和持续制作的记录。
          </p>
        </div>
      </div>
      <CraftStudio onSource={() => onSource('craft')} />
      <p className="story-method-note">
        画面操作与完成状态只属于屏幕体验，不代表真实工时、技能掌握或传承成效。
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
          <em>应当能找到人和时间。</em>
        </h2>
        <div>
          <p>
            “传承”需要具体的人持续学习、制作或教学。名录上的名字是调查入口；师徒关系、活跃状态和后续实践都需要单独核实。
          </p>
        </div>
      </div>
      <PeopleExplorer />
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
          <span>人物记录待核验</span>
          <p>
            需要记录：谁在教、谁在学、做了多久、材料来自哪里。暂不展示示意人物或推测的关系连线。
          </p>
          <button onClick={() => onSource('people')}>查看人物资料口径 ↗</button>
        </div>
      )}
      {indicatorsAt('continuity').length > 0 && (
        <div className="people-indicators">
          <span className="eyebrow">COUNT WITH CONTEXT / 人才与实践的一个侧面</span>
          <IndicatorList stage="continuity" />
          <p>
            县域人才库人数只反映登记口径，不能直接说明走红后新增了多少学习者，也不能当成汪满田单一项目的人数。
          </p>
        </div>
      )}
    </section>
  );
}

export function Verdict({ onSource }: { onSource: SourceAction }) {
  const attention = indicatorsAt('attention').length > 0;
  const participation =
    indicatorsAt('participation').length > 0 ||
    dataset.caseEvents.some((row) => row.stage === 'participation' && findSource(row.sourceId));
  const continuity = dataset.caseEvents.some(
    (row) => row.stage === 'continuity' && findSource(row.sourceId),
  );
  const states = [attention, participation, continuity];
  const findings = [
    '鱼灯有报道和单账号粉丝口径；没有平台热度曲线，徽墨暂无可比关注数据。',
    '报道记录一户住客制作鱼灯、徽墨民宿开设体验；没有完整参与人数。',
    '鱼灯工坊继续接单，申易鑫每周授课；这不是对前述体验者的追踪。',
  ];
  return (
    <section id="after" className="section story-section story-verdict">
      <StageMark number="04" label="回到开篇的问题" />
      <div className="story-lead">
        <span className="eyebrow">THE VERDICT / 证据允许我们说到哪一步</span>
        <h2>
          被看见之后，
          <br />
          <em>传承发生了吗？</em>
        </h2>
        <div>
          <p>
            把三段证据放回一起，并不意味着它们自动构成因果关系。每一步都要核对统计对象、时间和来源；缺少连接材料的地方，结论就应停下来。
          </p>
        </div>
      </div>
      <div className="verdict-table" role="table" aria-label="三段证据核对表">
        <div className="verdict-head" role="row">
          <span role="columnheader">调查环节</span>
          <span role="columnheader">当前资料状态</span>
          <span role="columnheader">能够判断什么</span>
        </div>
        {stages.map((stage, index) => (
          <div className="verdict-row" role="row" key={stage.id}>
            <strong role="cell">
              <i>0{index + 1}</i>
              {stage.label}
            </strong>
            <span role="cell" className={states[index] ? 'has-source' : ''}>
              {states[index] ? '已接入带来源记录' : '证据待核验'}
            </span>
            <p role="cell">{states[index] ? findings[index] : stage.needed}</p>
          </div>
        ))}
      </div>
      <div className="verdict-note">
        <span>当前调查结论 / WHAT WE CAN SAY</span>
        <p>
          公开报道可以证明：鱼灯获得关注，有住客动手体验，既有工坊后来仍在制作；徽墨民宿有体验与持续授课。但这些记录没有追踪同一批体验者的后续学习，因此目前不能说“走红带来了传承”。
        </p>
        <p>下一步最需要的不是更大的播放数字，而是同一批人隔一段时间后是否仍在学习、制作或教学。</p>
        <button onClick={() => onSource('method')}>阅读研究方法与来源 ↗</button>
      </div>
    </section>
  );
}
