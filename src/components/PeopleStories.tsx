import { publicEvidence, publicMeasure } from '../content/evidence';
import { EvidenceSource } from './EvidenceSource';

export function PeopleStories({ kind = 'fish' }: { kind?: 'fish' | 'ink' } = {}) {
  return (
    <section
      id="case-followup"
      className="section people-stories"
      aria-labelledby="people-stories-heading"
    >
      <div className="editorial-section-heading">
        <span className="eyebrow">03 / 把同一个名字留在时间里</span>
        <h2 id="people-stories-heading">
          灯火之外，<em>他们继续开工。</em>
        </h2>
        <p>
          公开报道让三个具体的人有了跨期记录。我们追踪的是他们的制作与教学，不把他们写成此前游客的去向。
        </p>
        <p className="case-path-note">
          红签对应当前选择的{kind === 'fish' ? '鱼灯' : '徽墨'}
          线索；各人的村落与经历分别核对，不拼成同一队伍。
        </p>
      </div>
      <nav className="people-index" aria-label="人物路径索引">
        {publicEvidence.people.map((person, index) => (
          <a href={`#person-${person.id}`} key={person.id}>
            <span className="mono">0{index + 1}</span>
            <b>{person.name}</b>
            <small>{person.craft}</small>
            <span aria-hidden="true">↓</span>
          </a>
        ))}
      </nav>
      <div className="people-story-list">
        {publicEvidence.people.map((person, index) => (
          <article
            id={`person-${person.id}`}
            className={`people-story${(person.id === 'shen-yixin' ? kind === 'ink' : kind === 'fish') ? ' is-current-case' : ''}`}
            data-case={person.id === 'shen-yixin' ? 'ink' : 'fish'}
            key={person.id}
          >
            <div className="people-story-name">
              <span className="eyebrow">人物 / 0{index + 1}</span>
              <h3>{person.name}</h3>
              <span>{person.craft}</span>
              <small>{person.place}</small>
              <p>{person.role}</p>
            </div>
            <div className="people-story-records">
              <p className="people-story-intro">{person.intro}</p>
              <ol className="person-timeline">
                {person.milestones.map((event, i) => (
                  <li key={i}>
                    <time>{event.date}</time>
                    <div>
                      <p>{event.text}</p>
                      <EvidenceSource id={event.sourceId} compact />
                    </div>
                  </li>
                ))}
              </ol>
              <p className="person-takeaway">{person.takeaway}</p>
              <details className="person-boundary">
                <summary>这条人物线能说明到哪里？</summary>
                <p>{person.limit}</p>
              </details>
            </div>
          </article>
        ))}
      </div>
      <div className="young-practice-context">
        <div>
          <span className="eyebrow">放大到县域 / 年轻人已在相关行业中</span>
          <h3>年轻从业者的记录，和体验者的后来，分开看。</h3>
          <p>
            新华社2025年11月的报道记载，歙县有{publicMeasure('fish-related-workers').valueText}
            {publicMeasure('fish-related-workers').unit}从事鱼灯相关行业。其中，35岁以下占比
            {publicMeasure('fish-young-workers').valueText}
            {publicMeasure('fish-young-workers').unit}。
          </p>
          <EvidenceSource id={publicMeasure('fish-young-workers').sourceId} compact />
        </div>
        <div className="young-practice-number">
          <span>35岁以下 · 相关行业从业者</span>
          <strong>
            {publicMeasure('fish-young-workers').valueText}
            {publicMeasure('fish-young-workers').unit}
          </strong>
          <p>
            这是县域三项非遗鱼灯的年龄结构记录，包含相关行业，不能换成新学徒人数。
            同一批游客是否后来入行，仍需相连的回访记录。
          </p>
        </div>
      </div>
      <ContinuityConditions />
    </section>
  );
}

function ContinuityConditions() {
  const workshop = publicMeasure('fish-workshops'),
    talent = publicMeasure('fish-talents'),
    school = publicMeasure('fish-schools');
  return (
    <div className="continuity-conditions">
      <div>
        <span className="eyebrow">把学习接到日常 / 公开记录里的条件</span>
        <h3>
          有地方做，有人教，<em>也能靠手艺生活。</em>
        </h3>
      </div>
      <div className="condition-grid">
        <article>
          <span className="condition-number">01 / 场所</span>
          <h4>
            <b>{workshop.valueText}</b> 家鱼灯工坊
          </h4>
          <p>歙县的制作空间，让手艺有机会在灯会之外继续发生。</p>
          <small>{workshop.period} · 歙县全县，非单村</small>
          <EvidenceSource id={workshop.sourceId} compact />
        </article>
        <article>
          <span className="condition-number">02 / 教学</span>
          <h4>
            <b>{talent.valueText}</b> 人入库 · <b>{school.valueText}</b> 所学校
          </h4>
          <p>县域人才库给予带徒补贴，鱼灯制作进入中小学第二课堂。</p>
          <small>2025年11月报道 · 是供给条件，非学徒留存</small>
          <EvidenceSource id={talent.sourceId} compact />
        </article>
        <article>
          <span className="condition-number">03 / 生活</span>
          <h4>工资与五险</h4>
          <p>黄山日报实访记录墨厂为新工人提供工资与五险，并与学校开设技艺班。</p>
          <small>2026年8月 · 企业负责人自述，未独立审计</small>
          <EvidenceSource id="pub-work-2026" compact />
        </article>
      </div>
      <p className="conditions-boundary">
        这些条件支持我们理解实践怎样延续；它们来自不同对象，不能据此推导传播的因果效果或体验者留存率。
      </p>
    </div>
  );
}
