import { useEffect, useRef, useState } from 'react';
import { dataset, type CaseEventRecord } from '../content/data';

type Kind = CaseEventRecord['caseId'];
const order = ['attention', 'participation', 'continuity'] as const;
const labels = ['01 / 被看见', '02 / 走近现场', '03 / 后来怎样'];
const questions = [
  '报道中的“热”，究竟记录了什么？',
  '有没有第一次动手的现场记录？',
  '体验之后，能追到同一批人吗？',
];

export function EvidenceWall({
  kind: chosenKind,
  onKindChange,
}: { kind?: Kind; onKindChange?: (kind: Kind) => void } = {}) {
  const [localKind, setLocalKind] = useState<Kind>('fish');
  const kind = chosenKind ?? localKind;
  const setKind = (value: Kind) => {
    setLocalKind(value);
    onKindChange?.(value);
  };
  const [active, setActive] = useState(0);
  const steps = useRef<(HTMLElement | null)[]>([]);
  const events = order.map((stage) =>
    dataset.caseEvents.find((event) => event.caseId === kind && event.stage === stage),
  );

  useEffect(() => {
    const update = () => {
      let current = 0;
      steps.current.forEach((element, index) => {
        if (element && element.getBoundingClientRect().top < innerHeight * 0.65) current = index;
      });
      setActive(current);
    };
    update();
    addEventListener('scroll', update, { passive: true });
    addEventListener('resize', update);
    return () => {
      removeEventListener('scroll', update);
      removeEventListener('resize', update);
    };
  }, [kind]);

  return (
    <div className="evidence-investigation">
      <div className="evidence-switch" role="group" aria-label="选择调查对象">
        <button aria-pressed={kind === 'fish'} onClick={() => setKind('fish')}>
          汪满田鱼灯
        </button>
        <button aria-pressed={kind === 'ink'} onClick={() => setKind('ink')}>
          徽墨制作
        </button>
      </div>
      <div className="evidence-layout">
        <div className="evidence-board" aria-label={`${kind === 'fish' ? '鱼灯' : '徽墨'}证据墙`}>
          <div className="evidence-board-heading">
            <span>CASE FILE / {kind === 'fish' ? '01' : '02'}</span>
            <strong>{kind === 'fish' ? '汪满田鱼灯' : '徽墨制作'}</strong>
          </div>
          <svg
            className="evidence-thread"
            viewBox="0 0 600 540"
            preserveAspectRatio="none"
            aria-hidden="true"
          >
            <path
              d="M145 143 L440 247 M408 267 L176 418"
              fill="none"
              stroke="#9a776a"
              strokeWidth="2"
              strokeDasharray="5 8"
            />
            <path
              d="M145 143 L440 247"
              fill="none"
              stroke="#b93527"
              strokeWidth="3"
              strokeDasharray="350"
              strokeDashoffset={active === 0 ? 350 : 0}
              style={{ transition: 'stroke-dashoffset .65s ease' }}
            />
            <path
              d="M408 267 L176 418"
              fill="none"
              stroke="#b93527"
              strokeWidth="3"
              strokeDasharray="10 12"
              opacity={active === 2 ? 1 : 0}
              style={{ transition: 'opacity .65s ease' }}
            />
          </svg>
          {events.map((event, index) => {
            const source = event && dataset.sources.find((row) => row.id === event.sourceId);
            return (
              <article
                className={`evidence-pin pin-${index} ${active >= index ? 'is-revealed' : ''}`}
                key={order[index]}
              >
                <span className="evidence-tack" aria-hidden="true" />
                <div className="evidence-visual" aria-hidden="true">
                  <span>{index === 0 ? '◉' : index === 1 ? '✳' : '↗'}</span>
                </div>
                <div className="evidence-pin-content">
                  <small>
                    {labels[index]} · {event?.date ?? '此处缺少记录'}
                  </small>
                  <strong>{event?.actor ?? '寻找传播的起点'}</strong>
                  <p>
                    {event
                      ? event.event
                      : '这项技艺如何走进公众视野，现有资料还没有留下清楚的记录。'}
                  </p>
                  {source && (
                    <a href={source.url} target="_blank" rel="noreferrer">
                      核对报道 ↗
                    </a>
                  )}
                </div>
              </article>
            );
          })}
          <div className="evidence-break">
            <i />
            来体验的人，后来去了哪里？记录在这里留下一处空白。
          </div>
        </div>
        <div className="evidence-narration">
          {order.map((stage, index) => (
            <article
              key={stage}
              ref={(node) => {
                steps.current[index] = node;
              }}
              className={`evidence-step ${active === index ? 'is-active' : ''}`}
              data-step={index}
            >
              <span>{labels[index]}</span>
              <h3>{questions[index]}</h3>
              <p>
                {events[index]?.event ??
                  '每一门手艺都有自己的来路。关于这一段的传播，现有资料还没有给出答案。'}
              </p>
              {index === 1 && <a href="#craft">亲手试一回，走近制作的过程 ↓</a>}
              {index === 2 && (
                <a
                  href="#people-evidence"
                  onClick={() => {
                    const panel = document.getElementById('people-evidence');
                    if (panel instanceof HTMLDetailsElement) panel.open = true;
                  }}
                >
                  沿着实名人物，把后来继续接上 ↓
                </a>
              )}
              {index === 2 && (
                <strong className="evidence-step-finding">
                  {kind === 'fish'
                    ? '工坊仍在做灯。那户来体验的人家，后来还做过吗？'
                    : '申易鑫每周授课。住客离开民宿之后，还会拿起制墨工具吗？'}
                </strong>
              )}
            </article>
          ))}
        </div>
      </div>
      <p className="evidence-ethics">
        证据卡为原创图形与报道摘要，不是新闻现场照片。红线表示调查顺序，不表示这些人之间有可证明的转化或因果关系。
      </p>
    </div>
  );
}
