import { useEffect, useRef, useState, type CSSProperties } from 'react';
import { craftLessons } from '../content/story';
import type { CraftState, WorkshopViewer } from '../scene/workshop';
type Kind = 'fish' | 'ink';
const colors = [
  { name: '朱红', value: '#b5442b' },
  { name: '赭黄', value: '#d49345' },
  { name: '青绿', value: '#527c72' },
];
export const routes = {
  fish: [
    {
      title: '扎骨',
      action: '扎起这一圈竹篾',
      goal: 4,
      hint: '依次轻点竹架上的光点，看竹篾一圈圈合成鱼身。',
      done: '竹骨扎稳了。接下来给它披上纸面。',
      fact: 0,
    },
    {
      title: '糊纸',
      action: '贴上这一片棉纸',
      goal: 4,
      hint: '轻点下一处光点，让棉纸贴合竹骨。四片纸面合成完整的鱼身。',
      done: '纸面合拢，鱼的模样出来了。现在添一点颜色。',
      fact: 1,
    },
    {
      title: '绘饰',
      action: '绘上这一段鳞纹',
      goal: 3,
      hint: '先挑一种颜色，再依次给三段鱼身绘上鳞纹。',
      done: '鳞纹绘好了。最后，把灯点亮。',
      fact: 2,
    },
    {
      title: '点亮',
      action: '点亮鱼灯',
      goal: 1,
      hint: '轻点鱼身里的灯芯，看暖光透过纸面。',
      done: '你做的鱼灯亮了。',
      fact: 3,
    },
  ],
  ink: [
    {
      title: '和料',
      action: '拌匀烟料与胶液',
      goal: 3,
      hint: '碗里是炼好的烟料与胶液。轻点木棒，搅拌三回，让它们慢慢和在一起。',
      done: '烟料与胶液和好了，接着把墨料捶打紧实。',
      fact: 1,
    },
    {
      title: '捶打',
      action: '落下一槌',
      goal: 3,
      hint: '轻点木槌，落下三槌。留意墨料怎样从松散变得紧实。',
      done: '墨料聚成团，可以送进墨模了。',
      fact: 2,
    },
    {
      title: '压模晾置',
      action: '合模，压出一方墨',
      goal: 1,
      hint: '轻点压板，看模具合拢、墨锭定型，再移到晾架。晾置时间在这里快进。',
      done: '墨锭定型，晾置后脱模。最后给纹样描金。',
      fact: 3,
    },
    {
      title: '描金',
      action: '描上这一处金纹',
      goal: 3,
      hint: '依次轻点边饰与字纹，让金色在墨面上显出来。',
      done: '最后一笔落下，一方徽墨完成了。',
      fact: 5,
    },
  ],
};
function Workshop({
  kind,
  state,
  onAction,
  motion,
}: {
  kind: Kind;
  state: CraftState;
  onAction: () => void;
  motion: boolean;
}) {
  const host = useRef<HTMLDivElement>(null),
    marker = useRef<HTMLButtonElement>(null),
    viewer = useRef<WorkshopViewer | null>(null);
  const latest = useRef({ state, onAction, motion });
  latest.current = { state, onAction, motion };
  const [status, setStatus] = useState('loading'),
    [retry, setRetry] = useState(0);
  useEffect(() => {
    let cancelled = false;
    setStatus('loading');
    import('../scene/workshop')
      .then(({ createWorkshop }) => {
        if (cancelled || !host.current) return;
        try {
          viewer.current = createWorkshop(
            host.current,
            kind,
            () => latest.current.onAction(),
            (x, y, visible) => {
              if (marker.current) {
                marker.current.style.left = `${x}px`;
                marker.current.style.top = `${y}px`;
                marker.current.style.visibility = visible ? 'visible' : 'hidden';
              }
            },
            () => setStatus('unavailable'),
          );
          viewer.current.update(latest.current.state, latest.current.motion);
          setStatus('ready');
        } catch {
          setStatus('unavailable');
        }
      })
      .catch(() => {
        if (!cancelled) setStatus('unavailable');
      });
    return () => {
      cancelled = true;
      viewer.current?.dispose();
      viewer.current = null;
    };
  }, [kind, retry]);
  useEffect(() => {
    viewer.current?.update(state, motion);
  }, [state, motion]);
  const active = state.step < 4 && state.count < routes[kind][state.step].goal;
  return (
    <div className="workshop-view" data-status={status}>
      <div
        className="workshop-canvas"
        ref={host}
        aria-label={`${kind === 'fish' ? '鱼灯' : '徽墨'}三维制作台，拖动可转动视角`}
      />
      {status === 'ready' && active && (
        <button
          ref={marker}
          className="workshop-marker"
          disabled={state.busy}
          onClick={onAction}
          aria-label={routes[kind][state.step].action}
        >
          <span>{state.busy ? '·' : '+'}</span>
          <small>{routes[kind][state.step].action}</small>
        </button>
      )}
      {status !== 'ready' && (
        <div className="workshop-unavailable" role="status">
          <strong>{status === 'loading' ? '正在摆好制作台…' : '三维制作台未能打开'}</strong>
          {status !== 'loading' && (
            <>
              <p>请开启浏览器的图形加速后重试。</p>
              <button onClick={() => setRetry((x) => x + 1)}>重新打开制作台</button>
            </>
          )}
        </div>
      )}
      {status === 'ready' && (
        <button className="workshop-recenter" onClick={() => viewer.current?.recenter()}>
          回到正面 ↺
        </button>
      )}
    </div>
  );
}
export function CraftStudio({
  onSource,
  motion = true,
  activeKind,
  onKindChange,
}: {
  onSource: () => void;
  motion?: boolean;
  activeKind?: Kind;
  onKindChange?: (kind: Kind) => void;
}) {
  const [localKind, setLocalKind] = useState<Kind>('fish');
  const kind = activeKind ?? localKind;
  const setKind = (value: Kind) => {
    setLocalKind(value);
    onKindChange?.(value);
  };
  const [sessions, setSessions] = useState<Record<Kind, CraftState>>({
    fish: { step: 0, count: 0, color: colors[0].value, busy: false },
    ink: { step: 0, count: 0, color: colors[0].value, busy: false },
  });
  const lock = useRef(false),
    timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(
    () => () => {
      if (timer.current) clearTimeout(timer.current);
    },
    [],
  );
  const session = sessions[kind],
    finished = session.step >= 4,
    current = routes[kind][Math.min(session.step, 3)];
  const ready = session.count >= current.goal && !session.busy;
  const update = (change: Partial<CraftState>) =>
    setSessions((all) => ({ ...all, [kind]: { ...all[kind], ...change } }));
  const act = () => {
    if (lock.current || finished || session.count >= current.goal) return;
    lock.current = true;
    update({ count: session.count + 1, busy: true });
    const actionKind = kind;
    timer.current = setTimeout(
      () => {
        lock.current = false;
        setSessions((all) => ({ ...all, [actionKind]: { ...all[actionKind], busy: false } }));
      },
      motion ? 950 : 100,
    );
  };
  return (
    <div
      className="craft-studio"
      data-kind={kind}
      data-step={session.step}
      data-complete={finished}
      data-busy={session.busy}
    >
      <header className="studio-header">
        <div>
          <span className="eyebrow">HANDS ON / 三维手作工坊</span>
          <h3>让一件手艺，在手中成形</h3>
          <p>跟着四道工序，直接在立体物件上动手。轻点光点制作，拖动空白处转动查看。</p>
        </div>
        <div className="studio-tabs" role="group" aria-label="选择制作体验">
          {(['fish', 'ink'] as const).map((item) => (
            <button
              key={item}
              disabled={session.busy}
              aria-pressed={kind === item}
              onClick={() => {
                if (!lock.current) setKind(item);
              }}
            >
              {item === 'fish' ? '鱼灯' : '徽墨'} · 4 道工序
            </button>
          ))}
        </div>
      </header>
      <div
        className="studio-route"
        aria-label={finished ? '四道工序已完成' : `第 ${session.step + 1} 道工序，共四道`}
      >
        {routes[kind].map((item, i) => (
          <span
            key={item.title}
            className={i < session.step ? 'done' : i === session.step ? 'current' : ''}
          >
            <i>{i < session.step ? '✓' : i + 1}</i>
            {item.title}
          </span>
        ))}
      </div>
      <div className={`studio-workspace ${finished ? 'is-finished' : ''}`}>
        <div className="studio-side">
          {finished ? (
            <div className="studio-completion-copy">
              <span className="eyebrow">四道工序，一件作品</span>
              <h4>{kind === 'fish' ? '这尾鱼，亮起来了。' : '一方墨，就此成形。'}</h4>
              <p>{craftLessons[kind].takeaway}</p>
              <p className="studio-feedback">拖动右侧的作品，看看自己刚才做出的细节。</p>
              <button className="studio-next" onClick={() => update({ step: 0, count: 0 })}>
                重新体验{craftLessons[kind].name} ↺
              </button>
            </div>
          ) : (
            <>
              <span className="studio-step-count">STEP 0{session.step + 1} / 04</span>
              <h4>{current.title}</h4>
              <p className="studio-instruction">{current.hint}</p>
              <div className="studio-count">
                <strong>{session.count}</strong>
                <span>
                  / {current.goal} {kind === 'ink' && session.step === 1 ? '槌' : '次操作'}
                </span>
              </div>
              <div className="workshop-progress" aria-hidden="true">
                {Array.from({ length: current.goal }, (_, i) => (
                  <i key={i} className={i < session.count ? 'done' : ''} />
                ))}
              </div>
              {kind === 'fish' && session.step === 2 && (
                <div className="studio-colors" role="group" aria-label="选择绘饰颜色">
                  {colors.map((color) => (
                    <button
                      key={color.name}
                      disabled={session.busy}
                      aria-pressed={session.color === color.value}
                      onClick={() => update({ color: color.value })}
                      style={{ '--studio-color': color.value } as CSSProperties}
                    >
                      {color.name}
                    </button>
                  ))}
                </div>
              )}
              <p className="studio-feedback" role="status">
                {session.busy
                  ? '看，它正在成形…'
                  : ready
                    ? current.done
                    : '轻点模型上的光点，完成眼前这一个动作。'}
              </p>
              {ready ? (
                <button
                  className="studio-next"
                  onClick={() => update({ step: session.step + 1, count: 0 })}
                >
                  {session.step === 3
                    ? '查看我的作品'
                    : `下一步 · ${routes[kind][session.step + 1].title}`}{' '}
                  ↗
                </button>
              ) : (
                <button className="workshop-action" disabled={session.busy} onClick={act}>
                  {current.action} <span>↗</span>
                </button>
              )}
              <details className="studio-method">
                <summary>这一道工序的讲究</summary>
                <p>{craftLessons[kind].steps[current.fact].fact}</p>
                {kind === 'ink' && session.step === 2 && <p>{craftLessons.ink.steps[4].fact}</p>}
              </details>
            </>
          )}
        </div>
        <div className="studio-board">
          <div className="studio-board-caption">
            <span>{kind === 'fish' ? '竹骨 · 棉纸 · 灯火' : '烟料 · 木模 · 金纹'}</span>
            <span>3D 制作台</span>
          </div>
          <Workshop kind={kind} state={session} motion={motion} onAction={act} />
          <div className="studio-board-bottom">
            {finished
              ? '作品已完成 · 拖动查看四周'
              : ready
                ? '这一步做好了 · 继续下一道工序'
                : '轻点光点动手 · 拖动空白处查看'}
          </div>
        </div>
      </div>
      <footer className="studio-footer">
        <span>原创三维工艺体验 · 动作与时间经简化</span>
        <button onClick={onSource}>查看工序来源 ↗</button>
      </footer>
    </div>
  );
}
