import { useRef, useState, type PointerEvent } from 'react';
import { craftLessons } from '../content/story';

type Kind = 'fish' | 'ink';
type Session = { step: number; marks: number[]; color: string };
type Point = { x: number; y: number; label: string; wrong?: boolean };
const colors = [
  { name: '朱红', value: '#b5442b' },
  { name: '赭黄', value: '#d49345' },
  { name: '青绿', value: '#527c72' },
];
const targets: Record<Kind, Point[][]> = {
  fish: [
    [
      { x: 27, y: 50, label: '鱼头连接处' },
      { x: 42, y: 26, label: '鱼背连接处' },
      { x: 53, y: 72, label: '鱼腹连接处' },
      { x: 73, y: 50, label: '鱼尾连接处' },
    ],
    [
      { x: 29, y: 50, label: '第一片纸面' },
      { x: 42, y: 50, label: '第二片纸面' },
      { x: 56, y: 50, label: '第三片纸面' },
      { x: 69, y: 50, label: '第四片纸面' },
    ],
    [40, 50, 60].flatMap((x, i) => [
      { x, y: 42, label: `第${i + 1}片上鳞` },
      { x, y: 58, label: `第${i + 1}片下鳞` },
    ]),
    [{ x: 49, y: 51, label: '点亮鱼灯' }],
  ],
  ink: [
    [
      { x: 25, y: 30, label: '第一处烟料' },
      { x: 50, y: 30, label: '第二处烟料' },
      { x: 75, y: 30, label: '第三处烟料' },
    ],
    [
      { x: 50, y: 33, label: '沿碗上方搅拌' },
      { x: 67, y: 51, label: '沿碗右侧搅拌' },
      { x: 50, y: 68, label: '沿碗下方搅拌' },
      { x: 33, y: 51, label: '沿碗左侧搅拌' },
    ],
    [
      { x: 41, y: 51, label: '落下第一槌' },
      { x: 51, y: 51, label: '落下第二槌' },
      { x: 61, y: 51, label: '落下第三槌' },
    ],
    [
      { x: 76, y: 29, label: '压杆起点' },
      { x: 76, y: 69, label: '压杆落点' },
    ],
    [
      { x: 30, y: 50, label: '烈日暴晒', wrong: true },
      { x: 70, y: 50, label: '阴凉晾架' },
    ],
    [
      { x: 42, y: 44, label: '描上第一处金纹' },
      { x: 51, y: 52, label: '描上第二处金纹' },
      { x: 60, y: 60, label: '描上第三处金纹' },
    ],
  ],
};
const instructions: Record<Kind, string[]> = {
  fish: [
    '沿鱼身点亮四处连接点；也可以按住沿骨架划过。',
    '把四片纸面依次覆到骨架上；点按或划过白色标记。',
    '选一种颜色，给六处鳞纹上色；按住画笔划过鱼身。',
    '轻触灯芯，让你做的鱼灯亮起来。',
  ],
  ink: [
    '把三处烟料收入碗中；点按或划过烟料。',
    '沿碗边四处提示搅拌一圈；点按也可以。',
    '依次落下三槌，看墨料怎样变得紧实。',
    '沿右侧轨道把压杆拖到底；键盘可点“按下压杆”。',
    '给墨锭选一个晾放位置；留意强光和阴凉的区别。',
    '顺着三处纹样描金，完成墨锭表面装饰。',
  ],
};
const total = (kind: Kind, step: number) =>
  kind === 'ink' && (step === 3 || step === 4) ? 1 : targets[kind][step].length;

function FishScene({
  step,
  marks,
  color,
  complete,
}: {
  step: number;
  marks: number[];
  color: string;
  complete: boolean;
}) {
  const skin = step > 1 || complete;
  const lit = step > 3 || complete || (step === 3 && marks.length > 0);
  return (
    <svg className="studio-art" viewBox="0 0 600 400" aria-hidden="true">
      <defs>
        <clipPath id="studio-fish-body">
          <path d="M103 200C140 93 321 82 427 175L553 108L528 200L553 292L427 225C321 318 141 310 103 200Z" />
        </clipPath>
        <radialGradient id="studio-fish-glow">
          <stop stopColor="#fff3b8" stopOpacity=".95" />
          <stop offset="1" stopColor="#edb36a" stopOpacity="0" />
        </radialGradient>
      </defs>
      <ellipse cx="300" cy="341" rx="234" ry="22" fill="#65573b" opacity=".15" />
      {lit && <ellipse cx="290" cy="195" rx="260" ry="171" fill="url(#studio-fish-glow)" />}
      <path
        d="M103 200C140 93 321 82 427 175L553 108L528 200L553 292L427 225C321 318 141 310 103 200Z"
        fill={lit ? '#ffcd7b' : skin ? '#f2dfb8' : '#f1e4c25b'}
        stroke="#98714e"
        strokeWidth="5"
        strokeDasharray={step === 0 ? '13 7' : undefined}
      />
      <g clipPath="url(#studio-fish-body)">
        {[0, 1, 2, 3].map((n) => (
          <g key={n} opacity={step > 0 || marks.includes(n) ? 1 : 0.16}>
            <path
              d={`M${167 + n * 89} 75Q${206 + n * 74} 200 ${167 + n * 89} 325`}
              fill="none"
              stroke="#75533b"
              strokeWidth="6"
            />
            <path
              d={`M${167 + n * 89} 75Q${206 + n * 74} 200 ${167 + n * 89} 325`}
              fill="none"
              stroke="#e7bd7a"
              strokeWidth="2"
            />
          </g>
        ))}
        {step === 1 &&
          [0, 1, 2, 3].map((n) => (
            <rect
              key={n}
              x={145 + n * 89}
              y="85"
              width="90"
              height="230"
              fill={marks.includes(n) ? '#f7e7c7' : '#fff5df4a'}
              stroke="#fff8e2"
              strokeDasharray="6 5"
              strokeWidth="2"
            />
          ))}
        {step >= 2 &&
          [0, 1, 2, 3, 4, 5].map((n) => (
            <g
              key={n}
              transform={`translate(${238 + (n % 3) * 72} ${169 + Math.floor(n / 3) * 76})`}
              opacity={step > 2 || marks.includes(n) ? 1 : 0.18}
            >
              <path
                d="M-26 -22Q0 14 26 -22L23 10Q0 42 -23 10Z"
                fill={color}
                stroke="#f3c780"
                strokeWidth="2"
              />
              <path d="M-23 -13Q0 22 23 -13" fill="none" stroke="#f6dba6" strokeWidth="2" />
            </g>
          ))}
      </g>
      <circle cx="165" cy="183" r="20" fill="#f7dea7" stroke={color} strokeWidth="6" />
      <circle cx="162" cy="182" r="10" fill="#25231f" />
      <path
        d="M224 108L246 82L266 105L288 80L311 112"
        fill={color}
        stroke="#9c6b48"
        strokeWidth="2"
      />
      {lit && <circle cx="287" cy="200" r="50" fill="url(#studio-fish-glow)" />}
      <path d="M89 357H557" stroke="#846b4d4d" />
    </svg>
  );
}

function InkScene({ step, marks, complete }: { step: number; marks: number[]; complete: boolean }) {
  const final = step >= 3 || complete;
  return (
    <svg className="studio-art" viewBox="0 0 600 400" aria-hidden="true">
      <defs>
        <linearGradient id="studio-ink-fill" x2="1" y2="1">
          <stop stopColor="#505048" />
          <stop offset="1" stopColor="#171b1a" />
        </linearGradient>
      </defs>
      <ellipse cx="300" cy="350" rx="220" ry="18" fill="#65573b" opacity=".17" />
      {step === 0 && (
        <>
          {[0, 1, 2].map((n) => (
            <g
              key={n}
              transform={`translate(${150 + n * 150} 0)`}
              opacity={marks.includes(n) ? 0.25 : 1}
            >
              <path d="M-57 129Q0 75 57 129Z" fill="#ccb997" stroke="#8d7654" strokeWidth="4" />
              <path d="M-44 132Q0 172 44 132" fill="none" stroke="#262b29" strokeWidth="11" />
            </g>
          ))}
          <path d="M197 282Q300 363 403 282Z" fill="#987959" stroke="#694c36" strokeWidth="4" />
          <ellipse cx="300" cy="282" rx="100" ry="29" fill="#d4bea0" />
          <ellipse
            cx="300"
            cy="278"
            rx={20 + marks.length * 22}
            ry={6 + marks.length * 5}
            fill="#282a29"
          />
        </>
      )}
      {step === 1 && (
        <>
          <path
            d="M150 178Q154 315 300 328Q446 315 450 178"
            fill="#ad8f62"
            stroke="#846642"
            strokeWidth="5"
          />
          <ellipse
            cx="300"
            cy="178"
            rx="150"
            ry="63"
            fill="#dbc29a"
            stroke="#846642"
            strokeWidth="5"
          />
          <ellipse cx="300" cy="178" rx="122" ry="42" fill="#343936" />
          <path
            d="M230 183Q300 105 375 182Q324 230 227 192"
            fill="none"
            stroke="#c1ab76"
            strokeWidth="7"
            opacity={0.25 + marks.length * 0.18}
          />
          <path d="M305 176L389 92" stroke="#805f3e" strokeWidth="17" strokeLinecap="round" />
        </>
      )}
      {step === 2 && (
        <>
          <ellipse cx="300" cy="299" rx="165" ry="46" fill="#98754f" />
          <ellipse
            cx="300"
            cy="270"
            rx={112 - marks.length * 9}
            ry={37 + marks.length * 5}
            fill="url(#studio-ink-fill)"
          />
          <g className={marks.length ? 'studio-hammer-hit' : ''} key={marks.length}>
            <path d="M315 107L397 232" stroke="#86623b" strokeWidth="17" strokeLinecap="round" />
            <rect
              x="246"
              y="87"
              width="146"
              height="61"
              rx="9"
              fill="#654d35"
              stroke="#ae8959"
              strokeWidth="4"
            />
          </g>
        </>
      )}
      {final && (
        <>
          {step === 3 && (
            <rect
              x="160"
              y="73"
              width="290"
              height="270"
              rx="16"
              fill="#96734b"
              stroke="#6b5138"
              strokeWidth="8"
            />
          )}
          {step === 4 &&
            [0, 1, 2, 3].map((n) => (
              <path key={n} d={`M150 ${115 + n * 70}H450`} stroke="#9a7850" strokeWidth="12" />
            ))}
          <rect
            x="215"
            y="100"
            width="170"
            height="230"
            rx="12"
            fill="url(#studio-ink-fill)"
            stroke="#9d805b"
            strokeWidth="4"
          />
          <path
            d="M245 120H355M246 309H354"
            stroke="#be9b5a"
            strokeWidth="4"
            opacity={step === 5 || complete ? 0.9 : 0.28}
          />
          {(step === 5 || complete) && (
            <>
              <path
                d="M257 156Q300 128 343 156Q300 183 257 156ZM258 280Q300 251 342 280"
                fill="none"
                stroke="#d9b569"
                strokeWidth="4"
                opacity={complete || marks.length > 0 ? 1 : 0.2}
              />
              <text
                x="300"
                y="233"
                textAnchor="middle"
                fill="#d9b569"
                fontSize="60"
                fontFamily="serif"
                opacity={complete || marks.length > 1 ? 1 : 0.2}
              >
                墨
              </text>
            </>
          )}
        </>
      )}
      {step === 3 && (
        <>
          <path d="M461 95V304" stroke="#ba9569" strokeWidth="9" strokeLinecap="round" />
          <rect x="441" y={marks.length ? 261 : 89} width="40" height="30" rx="8" fill="#d8ab70" />
        </>
      )}
      {step === 4 && (
        <>
          <circle cx="171" cy="188" r="45" fill="#edbc65" opacity=".6" />
          <path d="M407 182L433 135L461 182" fill="#496659" opacity=".6" />
        </>
      )}
    </svg>
  );
}

export function CraftStudio({ onSource }: { onSource: () => void }) {
  const [kind, setKind] = useState<Kind>('fish');
  const [sessions, setSessions] = useState<Record<Kind, Session>>({
    fish: { step: 0, marks: [], color: colors[0].value },
    ink: { step: 0, marks: [], color: colors[0].value },
  });
  const [feedback, setFeedback] = useState('');
  const board = useRef<HTMLDivElement>(null);
  const pressing = useRef(false);
  const session = sessions[kind];
  const lesson = craftLessons[kind];
  const finished = session.step >= lesson.steps.length;
  const step = Math.min(session.step, lesson.steps.length - 1);
  const points = finished ? [] : targets[kind][step];
  const goal = finished ? 0 : total(kind, step);
  const ready = !finished && session.marks.length >= goal;
  const update = (next: Partial<Session>) =>
    setSessions((all) => ({ ...all, [kind]: { ...all[kind], ...next } }));
  const hit = (index: number) => {
    if (finished || ready) return;
    if (kind === 'ink' && step === 4 && index === 0) {
      setFeedback('烈日会让墨锭干燥过快。试试右侧的阴凉晾架。');
      return;
    }
    if (kind === 'ink' && step === 3 && index === 0) {
      setFeedback('沿轨道把压杆向下拖到底。');
      return;
    }
    const key = kind === 'ink' && step === 3 ? 0 : index;
    if (session.marks.includes(key)) return;
    const next = [...session.marks, key];
    update({ marks: next });
    setFeedback(
      next.length >= goal
        ? '做到了！观察画面的变化，再进入下一工序。'
        : `已完成 ${next.length}/${goal} 处，继续沿画面中的光点操作。`,
    );
  };
  const sweep = (event: PointerEvent<HTMLDivElement>) => {
    if (!pressing.current || finished || ready) return;
    const rect = board.current?.getBoundingClientRect();
    if (!rect) return;
    const x = ((event.clientX - rect.left) / rect.width) * 100;
    const y = ((event.clientY - rect.top) / rect.height) * 100;
    if (kind === 'ink' && step === 3) {
      if (x > 66 && y > 59) hit(1);
      return;
    }
    const index = points.findIndex(
      (point) =>
        Math.hypot(((point.x - x) * rect.width) / 100, ((point.y - y) * rect.height) / 100) < 35,
    );
    if (index >= 0) hit(index);
  };
  const next = () => {
    if (!ready) return;
    update({ step: session.step + 1, marks: [] });
    setFeedback('进入下一工序。照着画面中的提示操作。');
  };
  const reset = () => {
    update({ step: 0, marks: [] });
    setFeedback('从第一道工序重新开始。');
  };
  return (
    <div
      className="craft-studio"
      data-kind={kind}
      data-step={session.step}
      data-complete={finished}
    >
      <header className="studio-header">
        <div>
          <span className="eyebrow">HANDS ON / 虚拟工坊</span>
          <h3>从材料，到一件作品</h3>
          <p>在画面上直接操作。每步都有发光提示，手机可轻点，桌面也可以沿提示划过。</p>
        </div>
        <div className="studio-tabs" role="group" aria-label="选择制作体验">
          <button
            aria-pressed={kind === 'fish'}
            onClick={() => {
              setKind('fish');
              setFeedback('');
            }}
          >
            鱼灯 · 4 道工序
          </button>
          <button
            aria-pressed={kind === 'ink'}
            onClick={() => {
              setKind('ink');
              setFeedback('');
            }}
          >
            徽墨 · 6 道工序
          </button>
        </div>
      </header>
      <div
        className="studio-route"
        aria-label={`已到第 ${session.step + 1} 道工序，共 ${lesson.steps.length} 道`}
      >
        {lesson.steps.map((item, index) => (
          <span
            key={item.title}
            className={index < session.step ? 'done' : index === session.step ? 'current' : ''}
          >
            <i>{index < session.step ? '✓' : index + 1}</i>
            {item.title}
          </span>
        ))}
      </div>
      {finished ? (
        <div className="studio-complete">
          <div className="studio-finished-art" aria-hidden="true">
            {kind === 'fish' ? (
              <FishScene step={4} marks={[]} color={session.color} complete />
            ) : (
              <InkScene step={6} marks={[]} complete />
            )}
          </div>
          <div>
            <span className="eyebrow">体验已完成</span>
            <h4>做过一次，离学会还有距离。</h4>
            <p>{lesson.takeaway}</p>
            <p>真正的传承，还需要持续学习、制作与教学的可核验记录。</p>
            <button onClick={reset}>重新体验{lesson.name} ↺</button>
          </div>
        </div>
      ) : (
        <div className="studio-workspace">
          <div className="studio-side">
            <span className="studio-step-count">
              STEP {String(step + 1).padStart(2, '0')} /{' '}
              {String(lesson.steps.length).padStart(2, '0')}
            </span>
            <h4>{lesson.steps[step].title}</h4>
            <p className="studio-instruction">{instructions[kind][step]}</p>
            <div className="studio-count">
              <strong>{session.marks.length}</strong>
              <span>/ {goal} 处完成</span>
            </div>
            {kind === 'fish' && step === 2 && (
              <div className="studio-colors" role="group" aria-label="选择绘饰颜色">
                {colors.map((color) => (
                  <button
                    key={color.name}
                    aria-pressed={session.color === color.value}
                    onClick={() => update({ color: color.value })}
                    style={{ '--studio-color': color.value } as React.CSSProperties}
                  >
                    {color.name}
                  </button>
                ))}
              </div>
            )}
            {kind === 'ink' && step === 3 && (
              <button className="studio-fallback" onClick={() => hit(1)}>
                按下压杆 ↓
              </button>
            )}
            <p className="studio-feedback" role="status">
              {feedback || '看画面中的发光标记，从任意一处开始。'}
            </p>
            <div className="studio-method">
              <span>工艺依据 / 简化说明</span>
              <p>{lesson.steps[step].fact}</p>
            </div>
            {ready && (
              <button className="studio-next" onClick={next}>
                {step + 1 === lesson.steps.length ? '查看体验结果' : '进入下一工序'} ↗
              </button>
            )}
          </div>
          <div
            className="studio-board"
            ref={board}
            onPointerDown={(event) => {
              pressing.current = true;
              sweep(event);
            }}
            onPointerMove={sweep}
            onPointerUp={() => {
              pressing.current = false;
            }}
            onPointerCancel={() => {
              pressing.current = false;
            }}
          >
            <div className="studio-board-caption">
              <span>{kind === 'fish' ? '汪满田鱼灯 · 制作示意' : '徽墨 · 制作示意'}</span>
              <span>按提示点按 / 划过</span>
            </div>
            {kind === 'fish' ? (
              <FishScene step={step} marks={session.marks} color={session.color} complete={false} />
            ) : (
              <InkScene step={step} marks={session.marks} complete={false} />
            )}{' '}
            {points.map((point, index) => (
              <button
                key={`${step}-${index}`}
                className={`studio-hotspot ${session.marks.includes(kind === 'ink' && step === 3 ? 0 : index) ? 'is-done' : ''} ${point.wrong ? 'is-wrong' : ''}`}
                style={{ left: `${point.x}%`, top: `${point.y}%` }}
                aria-label={point.label}
                aria-pressed={session.marks.includes(kind === 'ink' && step === 3 ? 0 : index)}
                onClick={() => hit(index)}
              >
                <span>
                  {session.marks.includes(kind === 'ink' && step === 3 ? 0 : index)
                    ? '✓'
                    : index + 1}
                </span>
                {kind === 'ink' && (step === 3 || step === 4) && (
                  <small className="studio-hotspot-label">{point.label}</small>
                )}
              </button>
            ))}
            <div className="studio-board-bottom">
              {ready ? '工序完成 · 点击左侧按钮继续' : `当前工序 ${session.marks.length} / ${goal}`}
            </div>
          </div>
        </div>
      )}
      <footer className="studio-footer">
        <span>原创二维工艺示意；步骤、次数与时间均经教学简化</span>
        <button onClick={onSource}>查看工序来源 ↗</button>
      </footer>
    </div>
  );
}
