import { useEffect, useRef, useState } from 'react';
import type { Viewer } from '../scene/viewer';

export function ModelView({
  kind = 'fish',
  exploded = false,
  motion = true,
  rotation = 0,
  className = '',
}: {
  kind?: 'fish' | 'ink';
  exploded?: boolean;
  motion?: boolean;
  rotation?: number;
  className?: string;
}) {
  const host = useRef<HTMLDivElement>(null);
  const viewer = useRef<Viewer | null>(null);
  const [status, setStatus] = useState<'loading' | 'ready' | 'fallback'>('loading');
  const latest = useRef({ exploded, motion, rotation });
  latest.current = { exploded, motion, rotation };
  useEffect(() => {
    let cancelled = false;
    setStatus('loading');
    import('../scene/viewer')
      .then(({ createViewer }) => {
        if (cancelled || !host.current) return;
        try {
          viewer.current = createViewer(host.current, kind, () => setStatus('fallback'));
          viewer.current.update(latest.current);
          setStatus('ready');
        } catch {
          setStatus('fallback');
        }
      })
      .catch(() => {
        if (!cancelled) setStatus('fallback');
      });
    return () => {
      cancelled = true;
      viewer.current?.dispose();
      viewer.current = null;
    };
  }, [kind]);
  useEffect(() => {
    viewer.current?.update({ exploded, motion, rotation });
  }, [exploded, motion, rotation]);
  return (
    <div className={`model-view ${className}`} data-model={kind} data-status={status}>
      <div
        className="model-canvas"
        ref={host}
        role="img"
        aria-label={
          kind === 'fish' ? '原创鱼灯三维示意模型，可拖动旋转' : '原创徽墨三维示意模型，可拖动旋转'
        }
      />
      {status !== 'ready' && (
        <div className="model-fallback">
          {kind === 'fish' ? (
            <svg viewBox="0 0 600 400" role="img" aria-label="鱼灯静态示意">
              <defs>
                <radialGradient id="fish-fill">
                  <stop stopColor="#f9c58e" />
                  <stop offset="1" stopColor="#a83726" />
                </radialGradient>
              </defs>
              <path
                d="M100 210C140 85 350 80 435 205L535 125 515 225 535 300 435 225C340 340 165 320 100 210Z"
                fill="url(#fish-fill)"
                stroke="#8d3126"
                strokeWidth="3"
              />
              <g fill="none" stroke="#efd0a0" strokeWidth="2">
                {[150, 190, 230, 270, 310, 350, 390].map((x) => (
                  <path key={x} d={`M${x} 125Q${x + 70} 215 ${x} 295`} />
                ))}
              </g>
              <circle cx="155" cy="193" r="24" fill="#e8ca94" />
              <circle cx="150" cy="193" r="13" fill="#211b19" />
            </svg>
          ) : (
            <div className="ink-fallback">
              徽<br />墨
            </div>
          )}
          <span>{status === 'loading' ? '正在点亮…' : '静态示意 · 三维预览暂不可用'}</span>
        </div>
      )}
    </div>
  );
}
