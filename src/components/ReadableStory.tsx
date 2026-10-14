import { SourceNote } from './StorySourceNote';
import { CourseChart, ContinuityTrails, YouthChart, MentoringChart } from './StoryCharts';
import { publicMeasure } from '../content/evidence';
import { craftHistories, trainingMeasureIds } from '../content/readable-story';

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
        title="一门老手艺，靠什么走到今天？"
        text="嬉鱼灯曾是村里的年俗，徽墨曾是书桌上的日用。今天，越来越多人在屏幕上看见它们。可看见的人多了，愿意接手的人也会多吗？先从这盏灯和这方墨的来处说起。"
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
        title="灯火出圈，热闹传到了多远？"
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
            画面传开了，制作这盏灯的手艺也进入公众视野。但播放记录只告诉我们内容被看过多少次。屏幕外，究竟有没有人愿意坐下来学？
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
        title="屏幕外，真的有人来学吗？"
        text="把目光从播放数字移到现场。报道里，既有来村里学扎灯的学生，也有提前为体验课留出时间的家庭。他们第一次动手，留下了哪些记录？"
      />
      <div className="learning-pair">
        <article className="fish-learning">
          <span className="eyebrow">鱼灯 / 村落与课堂</span>
          <h3>把亲手做的鱼灯，带进巡游。</h3>
          <p>
            2024年元宵前，清华大学美术学院学生陈贤杰和同学来到汪满田，向村民学习制作鱼灯。他们舞着亲手做的灯，和村民一起参加“嬉鱼灯”。新华社在2024年元宵报道中记录了这个现场。
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
      <div className="learning-person-intro">
        <span className="eyebrow">来学的人里，也有人专门去找师傅</span>
        <p>
          潘敏因喜欢嬉鱼表演，向瞻淇老人学习鱼灯制作。申易鑫在民宿工作时接触徽墨，跟随程国胜学艺。他们后来是否还在做？先把这两个名字留在这条路上。
        </p>
        <SourceNote id="pub-pan-2024" />
        <SourceNote id="pub-shen-2025b" />
      </div>
      <CourseChart />
      <div className="story-answer">
        <span className="eyebrow">第一个答案 / 有人来了</span>
        <h3>有人进课堂，也有人把课程排进假期。</h3>
        <p>鱼灯进入学校，墨厂迎来研学家庭，课程也有了分期预约。第一次动手，已经有了具体的现场。</p>
      </div>
      <div className="story-turn">
        <span className="eyebrow">追问 / 再往后一步</span>
        <h3>来过一次，就会留下来吗？</h3>
        <p>
          体验结束可以带走一件作品，独立制作却要多下功夫。21岁的张佳乐先做小样、再放大，一盏龙头鱼灯就花了
          {publicMeasure('fish-design-time').valueText}
          。这是这一件作品的用时。真正接下一门手艺，还要反复练习。
        </p>
        <SourceNote id="pub-pan-2024" />
        <a className="question-craft-link" href="#craft">
          先动一次手，再去找他们的后来 ↓
        </a>
      </div>
    </section>
  );
}

export function DailyLifeStory() {
  return (
    <section id="after" className="section readable-section readable-daily">
      <SectionHeading
        number="04"
        label="日常接续"
        title="再找同一个人，后来还在做吗？"
        text="不再只数来过多少人，把名字留住，再沿着不同年份的报道往后找：曾经向师傅学艺的人，后来去了哪里？潘敏和申易鑫留下了这样的记录。"
      />
      <ContinuityTrails />
      <div className="story-answer">
        <span className="eyebrow">第二个答案 / 有人接着做，也开始教</span>
        <h3>下一次见到他们，手艺还在手上。</h3>
        <p>
          潘敏把学来的鱼灯制作变成专职教学，申易鑫从接触徽墨走到授课。不同年份的报道再次记录他们的教学现场。这里接起的是这两位实践者的路径；来体验的那批家庭，其后续仍需另行回访。
        </p>
      </div>
      <YouthChart />
      <div className="readable-heading sustaining-heading">
        <span className="eyebrow">最后再问 / 怎样接着做</span>
        <h3>热爱之外，学艺的人靠什么留下？</h3>
        <p>有教室、有师傅，还要有可以维持生活的工作。继续看看传艺、补助和收入的具体安排。</p>
      </div>
      <MentoringChart />
      <div className="daily-fish">
        <div>
          <span className="eyebrow">鱼灯 / 村落的组织与生产</span>
          <h3>做灯之外，表演也能成为工作。</h3>
          <p>
            瞻淇村把嬉鱼灯组织成{publicMeasure('fish-performance-team').valueText}
            人的专业队伍，走到苏州、杭州、温州等地演出，报道中的每场团队收入
            {publicMeasure('fish-performance-income').valueText}
            万元。返乡大学生参与村里制灯，也有每天{publicMeasure('fish-student-day-pay').valueText}
            元劳务补助。{' '}
          </p>
          <SourceNote id="pub-pan-2024" />
        </div>
        <Measure id="fish-performance-income" caption="瞻淇32人专业队伍每场商演的团队收入" />
      </div>
      <div className="daily-pair">
        <article>
          <Measure id="fish-talents" caption="歙县纳入非遗人才库的鱼灯手艺人" />
          <p>
            当地给予入库手艺人带徒补贴；{publicMeasure('fish-workshops').valueText}
            家鱼灯工坊提供制作场所。教人、做灯，也有了日常的安排。
          </p>
        </article>
        <article>
          <Measure id="ink-online-revenue" caption="老胡开文墨厂直播与电商带来的年营收" />
          <p>墨厂把直播间搬进生产车间，展示捶墨、制模和描金。线上经营，为继续生产提供了收入。</p>
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
        <p>鱼灯不只被围观：有人来学，有人把学来的手艺继续做下去，也教给下一个人。</p>
        <p>热闹把人带到手艺面前。让手艺接续的，是学过之后仍愿意坐回工作台的那些人。</p>
        <a href="#research">翻开证据中心，查阅人物与原文 ↗</a>
      </div>
    </section>
  );
}
