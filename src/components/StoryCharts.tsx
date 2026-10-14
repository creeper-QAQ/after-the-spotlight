import { useState } from 'react';
import { publicEvidence, publicMeasure } from '../content/evidence';
import { SourceNote } from './StorySourceNote';

export function CourseChart() {
  const [selected, setSelected] = useState(0);
  const courses = publicMeasure('ink-course');
  const families = publicMeasure('ink-course-families');
  const places = Number(courses.valueText) * Number(families.valueText);
  return (
    <figure className="story-chart course-chart">
      <figcaption>
        <span className="eyebrow">把一次体验排进课程</span>
        <h3>不是只有路过，已经有人预约坐下来。</h3>
        <p>
          2025年寒假，申易鑫介绍，提前预订的非遗体验课有{courses.valueText}期，每期
          {families.valueText}个家庭。
        </p>
      </figcaption>
      <div
        className="course-grid"
        aria-label={`${courses.valueText}期已预订课程，每期${families.valueText}个家庭参与名额`}
      >
        {Array.from({ length: Number(courses.valueText) }, (_, i) => (
          <button
            key={i}
            type="button"
            className="course-session"
            aria-pressed={selected === i}
            onClick={() => setSelected(i)}
            aria-label={`第${i + 1}期，${families.valueText}个家庭名额`}
          >
            <span className="course-index">{String(i + 1).padStart(2, '0')}期</span>
            <span className="family-marks">
              {Array.from({ length: Number(families.valueText) }, (_, j) => (
                <i key={j} className="family-mark" aria-hidden="true">
                  <b />
                  <b />
                </i>
              ))}
            </span>
          </button>
        ))}
      </div>
      <p className="chart-selection" aria-live="polite">
        第{selected + 1}期 · {families.valueText}个家庭参与名额
      </p>
      <p className="readable-caption">
        一组符号代表一个家庭名额，不限定家庭人数。合计{places}
        个家庭参与名额；同一家庭可参加多期，不等于{places}
        个独立家庭。期次为图中排布，报道未列开课日期。
      </p>
      <SourceNote id={families.sourceId} />
    </figure>
  );
}

export function ContinuityTrails() {
  return (
    <div className="continuity-trails">
      {['pan-min', 'shen-yixin'].map((id) => {
        const person = publicEvidence.people.find((p) => p.id === id)!;
        const milestones = person.milestones.filter((m) => !m.date.includes('未详'));
        return (
          <article className="continuity-trail" data-person-trail={id} key={id}>
            <div className="trail-title">
              <span className="trail-seal" aria-hidden="true">
                {id === 'pan-min' ? '灯' : '墨'}
              </span>
              <div>
                <span className="eyebrow">{person.craft}</span>
                <h3>{person.name}</h3>
              </div>
            </div>
            <p>
              {id === 'pan-min'
                ? '因喜欢嬉鱼表演，她找瞻淇老人学做鱼灯。后来她以教学为业，也曾担心年节后的客流能否支撑门店。'
                : '他原是民宿管家，接触徽墨后跟师傅学艺。再往后找，他已在教别人动手。'}
            </p>
            <ol className="trail-milestones">
              {milestones.map((m) => (
                <li key={m.date}>
                  <time>{m.date}</time>
                  <p>{m.text}</p>
                  <SourceNote id={m.sourceId} />
                </li>
              ))}
            </ol>
            <p className="trail-result">
              {id === 'pan-min'
                ? '从学做灯，到连续不同年份的教学现场。'
                : '从接触制墨，到2026年仍在指导游客。'}
            </p>
          </article>
        );
      })}
    </div>
  );
}

export function YouthChart() {
  const [kind, setKind] = useState<'fish' | 'ink'>('fish');
  const fish = kind === 'fish';
  const fact = publicMeasure(fish ? 'fish-young-workers' : 'ink-young-workers');
  const lowerBound = Number(fact.valueText.replace('超', ''));
  return (
    <figure className="story-chart youth-chart">
      <figcaption>
        <span className="eyebrow">再看做这门手艺的人</span>
        <h3>年轻人，已经坐在工作台前。</h3>
      </figcaption>
      <div className="chart-switch" role="group" aria-label="选择青年从业者的统计范围">
        <button type="button" aria-pressed={fish} onClick={() => setKind('fish')}>
          鱼灯相关行业
        </button>
        <button type="button" aria-pressed={!fish} onClick={() => setKind('ink')}>
          墨厂青年员工
        </button>
      </div>
      <div className="youth-plot" aria-live="polite">
        <p>{fish ? '歙县鱼灯相关行业 · 35岁以下从业者' : '歙县老胡开文墨业 · “90后”“00后”员工'}</p>
        <strong>
          {fact.valueText}
          <small>%</small>
        </strong>
        <div
          className="share-track"
          role="img"
          aria-label={`${fact.scope}，占比${fact.valueText}%，色条只画已知下限`}
        >
          <span
            className="share-fill"
            data-lower-bound={lowerBound}
            style={{ width: `${lowerBound}%` }}
          >
            <b>→</b>
          </span>
        </div>
        <div className="share-axis" aria-hidden="true">
          <span>0%</span>
          <span>50%</span>
          <span>100%</span>
        </div>
        <p className="readable-caption">
          色条画到报道下限，箭头表示实际占比更高。
          {fish
            ? `范围是全县${publicMeasure('fish-related-workers').valueText}名相关从业者。`
            : '范围是这家企业的员工，由企业负责人介绍。'}
          两项的年龄定义与范围不同，分别阅读。
        </p>
        <p className="readable-caption">{fact.period}</p>
        <SourceNote id={fact.sourceId} />
      </div>
    </figure>
  );
}

export function MentoringChart() {
  const rows = [
    ['ink-trained-province', '省级'],
    ['ink-trained-city', '市级'],
    ['ink-trained-county', '县级'],
  ] as const;
  return (
    <figure className="story-chart mentoring-chart">
      <figcaption>
        <span className="eyebrow">学艺之后，也能成为传艺的人</span>
        <h3>师带徒，留下了具体的培养记录。</h3>
        <p>黄山日报2026年8月实访老胡开文墨业，负责人介绍了企业培养的各级传承人。</p>
      </figcaption>
      <div className="mentor-axis" aria-hidden="true">
        <span>0</span>
        <span>10</span>
        <span>20人</span>
      </div>
      <div
        className="mentor-rows"
        role="img"
        aria-label="企业负责人自述培养省级三人、市级十九人、县级十六人；级别可能重叠，不相加"
      >
        {rows.map(([id, label]) => {
          const fact = publicMeasure(id);
          return (
            <div className="mentor-row" key={id} data-fact-id={id}>
              <span>{label}</span>
              <div className="mentor-track">
                <i style={{ width: `${Number(fact.valueText) * 5}%` }} />
              </div>
              <b>
                {fact.valueText}
                <small>人</small>
              </b>
            </div>
          );
        })}
      </div>
      <p className="readable-caption">
        企业自述，按原文的认定级别分别展示；可能存在晋级重叠，不作人数合计。不是体验游客的转化人数。
      </p>
      <SourceNote id="pub-work-2026" />
      <p className="mentoring-reason">
        为什么有人愿意留下？这家厂给新工人从入职第一天发工资、缴五险，并和学校开设技艺班。学艺有师傅，也要有生活的支撑。
      </p>
    </figure>
  );
}
