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

export function EvidenceWall() {
  const [kind, setKind] = useState<Kind>('fish');
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
                    {labels[index]} · {event?.date ?? '尚无记录'}
                  </small>
                  <strong>{event?.actor ?? '证据空白'}</strong>
                  <p>{event ? event.event : '尚未找到这项技艺进入公众视野的可核验传播记录。'}</p>
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
            这根线暂时接不上：没有同一批体验者的后续记录
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
                  '这一步尚无可核验记录；不能因为另一项技艺走红，就替它补上热度。'}
              </p>
              {index === 1 && <a href="#craft">试一次简化制作，理解“参与”的深浅 ↓</a>}
              {index === 2 && (
                <strong className="evidence-step-finding">
                  {kind === 'fish'
                    ? '查到工坊持续制作；未查到那户体验者是否继续学习。'
                    : '查到申易鑫持续授课；未查到住客体验之后的去向。'}
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
