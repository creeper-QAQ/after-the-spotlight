import { useState } from 'react';
import { dataset } from '../content/data';
import { Icon } from './Icon';

const modes = [
  { id: 'category', name: '按类别' },
  { id: 'region', name: '按地区' },
  { id: 'batch', name: '按批次' },
] as const;
type Mode = (typeof modes)[number]['id'];

// Purely visual layout fixtures; never imported into the research dataset.
function position(i: number, mode: Mode) {
  if (mode === 'category')
    return {
      x: 53 + Math.floor(i / 24) * 127 + (i % 6) * 15,
      y: 76 + Math.floor((i % 24) / 6) * 25,
    };
  if (mode === 'region')
    return {
      x: 77 + (i % 20) * 26,
      y: 44 + Math.floor(i / 20) * 25 + Math.sin((i % 20) * 0.4) * 24,
    };
  return {
    x: 60 + Math.floor(i / 24) * 130 + (i % 4) * 17,
    y: 200 - Math.floor((i % 24) / 4) * 21,
  };
}

export function CatalogueViz({ onSource }: { onSource: () => void }) {
  const [mode, setMode] = useState<Mode>('category');
  const counts = Object.entries(
    dataset.catalogue.reduce<Record<string, number>>((all, row) => {
      all[row[mode]] = (all[row[mode]] || 0) + 1;
      return all;
    }, {}),
  );
  const hasData = dataset.catalogue.length > 0;
  return (
    <div className="catalogue-viz">
      <div className="viz-toolbar">
        <div>
          <span className="eyebrow">DATA EXPLORER / 01</span>
          <h3>换一个角度，看见非遗</h3>
        </div>
        <div className="segmented" aria-label="点阵呈现方式">
          {modes.map((item) => (
            <button key={item.id} onClick={() => setMode(item.id)} aria-pressed={mode === item.id}>
              {item.name}
            </button>
          ))}
        </div>
      </div>
      <div className="viz-stage" aria-live="polite">
        {hasData ? (
          <div className="real-bars">
            {counts.map(([label, count]) => (
              <div className="real-bar" key={label}>
                <span>{label}</span>
                <div>
                  <i style={{ width: `${(count / dataset.catalogue.length) * 100}%` }} />
                </div>
                <b>{count}</b>
              </div>
            ))}
          </div>
        ) : (
          <>
            <svg
              className="dot-chart"
              viewBox="0 0 690 250"
              role="img"
              aria-label={`${modes.find((m) => m.id === mode)?.name}的点阵布局示意，不代表真实统计数据`}
            >
              {[60, 110, 160, 210].map((y) => (
                <line key={y} x1="24" x2="670" y1={y} y2={y} className="chart-grid" />
              ))}
              {Array.from({ length: 120 }, (_, i) => {
                const p = position(i, mode);
                return (
                  <circle
                    key={i}
                    cx={p.x}
                    cy={p.y}
                    r="4.4"
                    className={`data-dot tone-${Math.floor(i / 24)}`}
                    style={{ transitionDelay: `${(i % 12) * 12}ms` }}
                  />
                );
              })}
            </svg>
            <div className="viz-note">
              <span className="outlined-dot" /> 布局示意 · 不代表真实数量或分布
            </div>
          </>
        )}
      </div>
      <div className="viz-footer">
        <span>
          {hasData ? `已接入 ${dataset.catalogue.length} 条名录记录` : '正式数据待核验后呈现'}
        </span>
        <button className="text-button" onClick={onSource}>
          数据口径与来源 <Icon name="source" size={15} />
        </button>
      </div>
    </div>
  );
}
