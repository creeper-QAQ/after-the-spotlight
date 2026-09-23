import { useState } from 'react';
import { chapters, craftStories, type SourceTopic } from '../content/story';
import { dataSlots, dataset } from '../content/data';
import { CatalogueViz } from './CatalogueViz';
import { ModelView } from './ModelView';
import { Icon } from './Icon';

type SourceAction = (topic: SourceTopic) => void;
function ChapterLabel({ index }: { index: number }) {
  const chapter = chapters[index];
  return (
    <div className="chapter-label">
      <span className="chapter-number">{chapter.number}</span>
      <span>{chapter.en}</span>
      <span className="chapter-rule" />
    </div>
  );
}

export function Overview({ onSource }: { onSource: SourceAction }) {
  return (
    <section id="overview" className="section section-overview">
      <ChapterLabel index={0} />
      <div className="section-heading">
        <h2>
          在热闹之外，
          <br />
          看见非遗的<span className="accent">全貌。</span>
        </h2>
        <p>
          哪些手艺被记录，分布在哪里，又在何时进入名录？
          <br className="desktop-break" />
          先从一张更完整的底图出发，再讨论关注与传承。
        </p>
      </div>
      <div className="overview-layout">
        <CatalogueViz onSource={() => onSource('catalogue')} />
        <aside className="editor-note">
          <span className="eyebrow">BEFORE THE NUMBERS</span>
          <span className="large-quote">“</span>
          <h3>
            看见的，
            <br />
            是否就是全部？
          </h3>
          <p>
            名录记录的是认定与保护。
            <br />
            屏幕记录的是传播与关注。
            <br />
            它们是两种不同的视角。
          </p>
          <button className="text-button" onClick={() => onSource('method')}>
            我们的观察方法 <Icon name="arrow" size={17} />
          </button>
        </aside>
      </div>
      <div className="data-slots">
        {dataSlots.map((slot, i) => (
          <button className="data-slot" key={slot.label} onClick={() => onSource(slot.topic)}>
            <span className="slot-index mono">0{i + 1}</span>
            <div>
              <h3>{slot.label}</h3>
              <p>{slot.detail}</p>
              <span className="slot-status">{slot.state}</span>
            </div>
            <Icon name="plus" size={19} />
          </button>
        ))}
      </div>
    </section>
  );
}

export function Craft({ onSource, motion }: { onSource: SourceAction; motion: boolean }) {
  const [kind, setKind] = useState<'fish' | 'ink'>('fish');
  const [exploded, setExploded] = useState(false);
  const [rotation, setRotation] = useState(0);
  const [part, setPart] = useState(0);
  const story = craftStories[kind];
  return (
    <section id="craft" className="section section-craft">
      <ChapterLabel index={1} />
      <div className="section-heading">
        <h2>
          走近它，
          <br />
          才知道光从哪里来。
        </h2>
        <div>
          <p>
            一盏鱼灯，一方徽墨。
            <br />
            从可见的物件，走进不易被看见的手艺。
          </p>
          <div className="craft-tabs" aria-label="选择案例">
            {(['fish', 'ink'] as const).map((key) => (
              <button
                aria-pressed={kind === key}
                onClick={() => {
                  setKind(key);
                  setPart(0);
                  setExploded(false);
                  setRotation(0);
                }}
                key={key}
              >
                {craftStories[key].label}
                <span>{key === 'fish' ? '01' : '02'}</span>
              </button>
            ))}
          </div>
        </div>
      </div>
      <div className="craft-layout">
        <div className={`craft-exhibit exhibit-${kind}`}>
          <div className="exhibit-top">
            <span className="eyebrow">{story.english}</span>
            <span className="exhibit-mark">物 / {kind === 'fish' ? '壹' : '贰'}</span>
          </div>
          <ModelView kind={kind} exploded={exploded} motion={motion} rotation={rotation} />
          <div className="exhibit-controls">
            <span>拖动旋转 · 原创示意模型</span>
            <div>
              <button
                className="icon-button"
                onClick={() => setRotation((r) => r + Math.PI / 4)}
                aria-label="旋转模型"
              >
                <Icon name="rotate" />
              </button>
              <button
                className={`outline-button ${exploded ? 'selected' : ''}`}
                aria-pressed={exploded}
                onClick={() => setExploded(!exploded)}
              >
                <Icon name="expand" size={16} />
                {exploded ? '合拢结构' : '展开结构'}
              </button>
            </div>
          </div>
        </div>
        <div className="craft-narrative">
          <span className="eyebrow">ANATOMY OF A CRAFT</span>
          <h3>{story.title}</h3>
          <p>{story.description}</p>
          <div className="part-tabs" aria-label="模型观察位置">
            {story.parts.map((item, i) => (
              <button
                key={item.title}
                aria-pressed={part === i}
                onClick={() => {
                  setPart(i);
                  setExploded(i === 0);
                }}
              >
                <span className="mono">0{i + 1}</span>
                {item.title}
              </button>
            ))}
          </div>
          <div className="part-description" aria-live="polite">
            <h4>{story.parts[part].subtitle}</h4>
            <p>{story.parts[part].text}</p>
          </div>
          <button className="text-button" onClick={() => onSource('craft')}>
            工艺资料与模型说明 <Icon name="source" size={16} />
          </button>
        </div>
      </div>
    </section>
  );
}

export function People({ onSource }: { onSource: SourceAction }) {
  return (
    <section id="people" className="section section-people">
      <ChapterLabel index={2} />
      <div className="section-heading">
        <h2>
          手艺的背后，
          <br />
          是一个个<span className="accent">具体的人。</span>
        </h2>
        <p>
          名字与项目之间，是长期的练习、生活与选择。
          <br />
          我们希望把抽象的“传承”，还原为具体的人与经历。
        </p>
      </div>
      <div className="people-layout">
        <div className="people-art" aria-hidden="true">
          <div className="people-orbit orbit-one" />
          <div className="people-orbit orbit-two" />
          <div className="people-orbit orbit-three" />
          <span className="people-word word-one">人</span>
          <span className="people-word word-two">艺</span>
          <span className="people-word word-three">地</span>
          <span className="people-art-caption mono">PEOPLE · CRAFT · PLACE</span>
        </div>
        <div className="people-records">
          <div className="records-title">
            <h3>从名字，走向故事</h3>
            <span className="small-tag">人物档案</span>
          </div>
          {dataset.people.length ? (
            dataset.people.map((person) => (
              <article className="person-record" key={person.id}>
                <h4>
                  {person.name} · {person.project}
                </h4>
                <p>
                  {person.region} / {person.description}
                </p>
              </article>
            ))
          ) : (
            <>
              <div className="empty-record">
                <span className="empty-avatar" />
                <div>
                  <span className="skeleton long" />
                  <span className="skeleton short" />
                </div>
                <span className="mono">01</span>
              </div>
              <div className="empty-record">
                <span className="empty-avatar" />
                <div>
                  <span className="skeleton medium" />
                  <span className="skeleton short" />
                </div>
                <span className="mono">02</span>
              </div>
              <p className="empty-explanation">
                人物资料正在整理。这里将呈现经核验的项目关联、实践经历与资料来源。
              </p>
            </>
          )}
          <button className="text-button" onClick={() => onSource('people')}>
            人物资料的记录方式 <Icon name="arrow" size={17} />
          </button>
        </div>
      </div>
    </section>
  );
}

export function After({ onSource }: { onSource: SourceAction }) {
  return (
    <section id="after" className="section section-after">
      <ChapterLabel index={3} />
      <div className="section-heading">
        <h2>
          当热闹散去，
          <br />
          什么会<span className="accent">留下？</span>
        </h2>
        <p>
          把“被看见”与“持续发生”放在一起观察。
          <br />
          关注、消费、学习与参与，各自需要怎样的证据？
        </p>
      </div>
      <div className="evidence-grid">
        {[
          {
            number: '01',
            title: '被关注',
            en: 'ATTENTION',
            text: '传播发生在什么平台与时段？',
            detail: '公开报告 · 传播指标',
            className: 'attention',
          },
          {
            number: '02',
            title: '被参与',
            en: 'PARTICIPATION',
            text: '人们以怎样的方式走近手艺？',
            detail: '案例事件 · 体验与实践',
            className: 'participation',
          },
          {
            number: '03',
            title: '被延续',
            en: 'CONTINUITY',
            text: '什么条件让实践持续发生？',
            detail: '人物经历 · 持续实践证据',
            className: 'continuity',
          },
        ].map((card) => (
          <article className={`evidence-card ${card.className}`} key={card.number}>
            <div className="evidence-card-top">
              <span className="mono">{card.number}</span>
              <span className="eyebrow">{card.en}</span>
            </div>
            <div className="evidence-glyph" aria-hidden="true">
              {card.number === '01' ? (
                <>
                  <i />
                  <i />
                  <i />
                  <i />
                  <i />
                </>
              ) : card.number === '02' ? (
                <>
                  <i />
                  <i />
                  <i />
                </>
              ) : (
                <>
                  <i />
                  <i />
                </>
              )}
            </div>
            <h3>{card.title}</h3>
            <p>{card.text}</p>
            <div className="evidence-card-bottom">
              <span>{card.detail}</span>
              <span className="small-tag">资料待核验</span>
            </div>
          </article>
        ))}
      </div>
      {dataset.indicators.length > 0 && (
        <div className="indicator-records">
          {dataset.indicators.map((row) => (
            <article key={row.id}>
              <h3>{row.label}</h3>
              <strong>
                {row.valueText} {row.unit}
              </strong>
              <p>
                {row.period} · {row.scope}
              </p>
            </article>
          ))}
        </div>
      )}
      <div className="evidence-foot">
        <p>三个观察维度，各自保留统计口径；不预设它们构成转化关系。</p>
        <button className="text-button" onClick={() => onSource('reports')}>
          指标与证据说明 <Icon name="source" size={15} />
        </button>
      </div>
    </section>
  );
}
