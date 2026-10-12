import { publicEvidence, publicMeasure } from '../content/evidence';
import { craftHistories, trainingMeasureIds } from '../content/readable-story';

export function SourceNote({ id }: { id: string }) {
  const index = publicEvidence.sources.findIndex((s) => s.id === id);
  if (index < 0) throw new Error(`Unresolved story source: ${id}`);
  return (
    <a
      className="story-source-note"
      href={`#source-${id}`}
      onClick={() => {
        let parent = document.getElementById(`source-${id}`)?.parentElement;
        while (parent) {
          if (parent instanceof HTMLDetailsElement) parent.open = true;
          parent = parent.parentElement;
        }
      }}
    >
      资料 {String(index + 1).padStart(2, '0')} ↗
    </a>
  );
}

function SectionHeading({
  number,
  label,
  title,
  text,
}: {
  number: string;
  label: string;
  title: string;
  text: string;
}) {
  return (
    <div className="readable-heading">
      <span className="eyebrow">
        {number} / {label}
      </span>
      <h2>{title}</h2>
      <p>{text}</p>
    </div>
  );
}

function Measure({ id, caption }: { id: string; caption?: string }) {
  const fact = publicMeasure(id);
  return (
    <div className="readable-measure" data-fact-id={id}>
      <span>{caption ?? fact.label}</span>
      <strong>
        {fact.valueText}
        <small>{fact.unit}</small>
      </strong>
      <p>{fact.period}</p>
      <SourceNote id={fact.sourceId} />
    </div>
  );
}

export function History() {
  return (
    <section id="history" className="section readable-section readable-history">
      <SectionHeading
        number="01"
        label="手艺来历"
        title="从年俗与文房，走进今天的生活。"
        text="一盏鱼灯，是村落共同守着的年俗；一方徽墨，是写在纸上的手艺。它们的故事，都由一代代亲手制作的人接着往下写。"
      />
      <div className="craft-history-pair">
        {craftHistories.map((craft) => (
          <article key={craft.name}>
            <span className="eyebrow">{craft.place}</span>
            <h3>{craft.name}</h3>
            <p>{craft.text}</p>
            <ol>
              {craft.points.map(([year, label]) => (
                <li key={year}>
                  <b>{year}</b>
                  <span>{label}</span>
                </li>
              ))}
            </ol>
            <SourceNote id={craft.sourceId} />
          </article>
        ))}
      </div>
      <p className="readable-join">
        鱼灯与徽墨之外，安徽还有许多延续至今的手艺。翻开印谱，看看它们的名字。
      </p>
    </section>
  );
}

export function AttentionStory() {
  const views = publicMeasure('keyword-views');
  return (
    <section id="phenomenon" className="section readable-section readable-attention">
      <SectionHeading
        number="02"
        label="灯火出圈"
        title="村里的灯火，被更多人看见。"
        text="短视频让远方的人看见徽州的鱼灯。春节的巡游走进屏幕，扎灯、绘鳞、嬉鱼的画面，也把人们的目光带向制作这盏灯的手。"
      />
      <div className="attention-record">
        <div data-fact-id={views.id}>
          <span>2025年春节 · 抖音相关视频合集</span>
          <strong>
            {views.valueText}
            <small>{views.unit}</small>
          </strong>
          <p>黄山、鱼灯、歙县等关键词相关视频播放</p>
        </div>
        <div>
          <p>
            这个数字记录了内容被播放的规模。接下来，把视线从屏幕移到现场：学生学做鱼灯，游客坐到描金台前，老师把手艺带进课堂。
          </p>
          <small>1月7日—2月12日 · 多关键词合集播放次数</small>
          <SourceNote id={views.sourceId} />
        </div>
      </div>
    </section>
  );
}

export function LearningStory() {
  const schools = publicMeasure('fish-schools');
  return (
    <section id="participation" className="section readable-section readable-learning">
      <SectionHeading
        number="03"
        label="坐下学艺"
        title="从看灯，到学做灯。"
        text="学习已经发生在村落、学校和开放的工坊。亲手扎起竹骨、覆上纸面，手艺也就在这些具体动作里被认识。"
      />
      <div className="learning-pair">
        <article className="fish-learning">
          <span className="eyebrow">鱼灯 / 村落与课堂</span>
          <h3>把亲手做的鱼灯，带进巡游。</h3>
          <p>
            清华大学美术学院学生陈贤杰和同学来到汪满田，向村民学习制作鱼灯。他们舞着亲手做的灯，和村民一起参加“嬉鱼灯”。新华社在2024年元宵报道中记录了这个现场。
          </p>
          <SourceNote id="pub-fish-history-2024" />
          <div
            className="school-strip"
            aria-label={`歙县${schools.valueText}所学校开展鱼灯制作第二课堂`}
          >
            {Array.from({ length: Number(schools.valueText) }, (_, i) => (
              <i key={i} aria-hidden="true">
                学
              </i>
            ))}
          </div>
          <Measure id="fish-schools" caption="歙县开展鱼灯制作第二课堂的学校" />
          <p className="readable-caption">一枚“学”字代表一所学校。</p>
        </article>
        <article className="ink-learning">
          <span className="eyebrow">徽墨 / 开放的墨厂</span>
          <h3>让学生坐到描金台前。</h3>
          <p>
            老胡开文墨厂把制墨和描金做成体验环节。原本用于生产的车间，也成为参观、科普和动手制作的课堂。
          </p>
          <Measure id="ink-visits" caption="2025年老胡开文墨厂研学接待" />
          <div className="learning-small-facts">
            <Measure id="ink-youth" caption="2026年暑期研学群体中的青少年" />
            <Measure id="ink-partners" caption="长期合作的研学机构与文旅平台" />
          </div>
        </article>
      </div>
      <p className="readable-join">接下来，跟着几道工序，亲手做一盏鱼灯，或体验一方徽墨的成形。</p>
    </section>
  );
}

export function DailyLifeStory() {
  return (
    <section id="after" className="section readable-section readable-daily">
      <SectionHeading
        number="04"
        label="日常接续"
        title="灯会散场，制作和教学继续。"
        text="传承也在节日之外发生：有人修灯、扎灯，有人带学生动手，有人把手艺做成可以维持生活的工作。"
      />
      <div className="daily-fish">
        <div>
          <span className="eyebrow">鱼灯 / 村落的组织与生产</span>
          <h3>有人组织灯会，也有人接着做灯。</h3>
          <p>
            2024年的汪满田，五个鱼会共同参加“嬉鱼灯”。村里的工匠修缮大灯，也制作小鱼灯；年轻人回乡组织活动，把年俗接在自己手里。
          </p>
          <SourceNote id="pub-fish-history-2024" />
        </div>
        <Measure id="fish-annual-capacity" caption="汪满田村工匠的年制作能力" />
      </div>
      <div className="daily-pair">
        <article>
          <Measure id="fish-young-workers" caption="歙县鱼灯相关行业中，35岁以下从业者占比" />
          <p>
            年轻人已经参与制作、演出与相关经营。新华社2025年11月报道记录的，是县域鱼灯相关行业的年龄结构。
          </p>
        </article>
        <article>
          <Measure id="ink-online-revenue" caption="老胡开文墨厂直播与电商带来的年营收" />
          <p>墨厂把直播间搬进生产车间，展示捶墨、制模和描金。线上经营，为继续生产提供了收入。</p>
          <small>人民日报2026年8月所述当时年营收，未列具体会计年度。</small>
        </article>
      </div>
      <div className="training-context">
        <span className="eyebrow">放到全国 / 传承人也在继续学习</span>
        <h3>让教学和研修，成为持续的安排。</h3>
        <p>
          2015年以来，中国非遗传承人研修培训计划把院校与传承人连接起来。制作、设计与教学经验，在研培中继续交流。
        </p>
        <div className="training-facts">
          {trainingMeasureIds.map((id) => (
            <Measure id={id} key={id} />
          ))}
        </div>
        <p className="readable-caption">
          文化和旅游部2025年6月公布的累计数据；培训对象为非遗传承人。
        </p>
      </div>
      <div className="readable-ending">
        <span className="eyebrow">被看见之后</span>
        <p>课堂里有人学，工坊里有人做，村落里有人把灯举起来。</p>
        <p>手艺的接续，正在这些日常中发生。</p>
        <a href="#research">翻开证据中心，查阅人物与原文 ↗</a>
      </div>
    </section>
  );
}
