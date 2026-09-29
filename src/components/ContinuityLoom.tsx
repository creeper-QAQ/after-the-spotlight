import { useState } from 'react';

const steps = [
  {
    word: '看见',
    title: '先让一门手艺进入视线。',
    text: '一盏灯，一段影像，一个被记住的名字。注意力让故事开始。',
  },
  {
    word: '动手',
    title: '再把一点时间交给它。',
    text: '当手指碰到材料，屏幕里轻巧的一步，才有了真实的分量。',
  },
  {
    word: '回来',
    title: '然后，在热闹过去之后。',
    text: '再来一次，继续练习，继续追问。传承的问题，才真正展开。',
  },
];
const questions = [
  {
    label: '后来，谁还在学？',
    detail: '需要同一批学习者隔一段时间后的记录：谁继续、谁离开、学到了什么。',
  },
  {
    label: '师傅有时间教吗？',
    detail: '需要看教学时间、作坊安排和支持条件，不能只看活动当天的热闹。',
  },
  {
    label: '手艺怎样进入日常？',
    detail: '需要持续制作、使用和社区参与的记录，理解一次体验之后的生活。',
  },
];

export function ContinuityLoom() {
  const [step, setStep] = useState(0);
  const [pull, setPull] = useState(0);
  const [question, setQuestion] = useState<number | null>(null);
  const completed = step === 3;
  const advance = () => {
    setStep((s) => Math.min(s + 1, 3));
    setPull(0);
  };
  const x = 120 + step * 250 + pull * 2.5;
  return (
    <section id="continuity-loom" className="continuity-loom" data-ink-exclude>
      <div className="loom-heading">
        <span className="eyebrow">最后一卷 / 把故事续下去</span>
        <h2>
          {completed ? '线接上了。' : '从看见，'}
          <br />
          <em>{completed ? '故事还没结束。' : '到下一次回来。'}</em>
        </h2>
        <p>
          {completed
            ? '屏幕上的三针，只用了片刻。\n现实里，每一针都需要有人付出时间。'
            : '这条线还没有接上。\n试着牵住它，向前走三步。'}
        </p>
      </div>
      <div className="loom-scene" data-step={step}>
        <svg viewBox="0 0 1000 280" aria-hidden="true">
          <defs>
            <linearGradient id="loom-thread">
              <stop stopColor="#a94632" />
              <stop offset="1" stopColor="#efc994" />
            </linearGradient>
          </defs>
          {Array.from({ length: 30 }, (_, i) => (
            <path
              key={i}
              d={`M${40 + i * 32} 15Q${70 + i * 32} 140 ${40 + i * 32} 265`}
              fill="none"
              stroke="#c9b78c"
              strokeWidth=".6"
              opacity=".1"
            />
          ))}
          <path
            d="M120 140 Q245 90 370 140 T620 140 T870 140"
            fill="none"
            stroke="#8c8e78"
            strokeDasharray="3 10"
            opacity=".5"
          />
          <path
            d={`M120 140 Q${120 + (x - 120) / 2} ${140 - Math.sin((step + pull / 100) * Math.PI) * 65} ${Math.min(x, 870)} 140`}
            fill="none"
            stroke="url(#loom-thread)"
            strokeWidth="3"
          />
          {[120, 370, 620, 870].map((cx, i) => (
            <g key={cx}>
              <circle
                cx={cx}
                cy="140"
                r={i <= step ? 10 : 6}
                fill={i <= step ? '#eac49c' : '#182721'}
                stroke="#b09b77"
              />
              <circle
                cx={cx}
                cy="140"
                r={i === step && !completed ? 26 : 16}
                fill="none"
                stroke="#eac49c"
                opacity={i === step ? 0.5 : 0.15}
              />
            </g>
          ))}
          {completed && (
            <g fill="none" stroke="#dc9d74" strokeWidth="1.4">
              <path d="M790 140c0-70 80-70 80 0s80 70 80 0-80-70-80 0-80 70-80 0Z" />
              <path d="M825 140c0-36 45-36 45 0s45 36 45 0-45-36-45 0-45 36-45 0Z" />
            </g>
          )}
        </svg>
        <div className="loom-stitches">
          {steps.map((item, i) => (
            <span key={item.word} className={step > i ? 'is-stitched' : ''}>
              <small>0{i + 1}</small>
              {item.word}
            </span>
          ))}
        </div>
      </div>
      {!completed ? (
        <div className="loom-action">
          <div>
            <span className="eyebrow">
              第 {step + 1} 针 / {steps[step].word}
            </span>
            <h3>{steps[step].title}</h3>
            <p>{steps[step].text}</p>
          </div>
          <div className="loom-pull">
            <label htmlFor="thread-pull">牵住线头，拖向下一针</label>
            <input
              id="thread-pull"
              type="range"
              min="0"
              max="100"
              value={pull}
              aria-label="牵线进度"
              onChange={(e) => {
                const value = Number(e.target.value);
                if (value === 100) advance();
                else setPull(value);
              }}
            />
            <button onClick={advance}>
              接下一针 <span>↗</span>
            </button>
          </div>
        </div>
      ) : (
        <div className="loom-reflection">
          <p>如果继续追踪，你最想问哪一个问题？</p>
          <div>
            {questions.map((q, i) => (
              <button key={q.label} aria-pressed={question === i} onClick={() => setQuestion(i)}>
                {q.label}
                <span>↗</span>
              </button>
            ))}
          </div>
          {question !== null && (
            <p className="loom-answer" role="status">
              {questions[question].detail}
            </p>
          )}
          <button
            className="loom-reset"
            onClick={() => {
              setStep(0);
              setPull(0);
              setQuestion(null);
            }}
          >
            重新牵线 ↶
          </button>
        </div>
      )}
      <small className="loom-boundary">
        这是一次叙事体验。你的操作不会被计入研究样本，也不能证明现实中的传承已经发生。
      </small>
    </section>
  );
}
