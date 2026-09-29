import { useState } from 'react';
import heritage from '../content/heritage.json';
import { Icon } from './Icon';

const modes = [
  { id: 'category', name: '按类别' },
  { id: 'region', name: '按申报地区' },
  { id: 'batch', name: '按批次' },
] as const;
type Mode = (typeof modes)[number]['id'];

export function CatalogueViz({ onSource }: { onSource: () => void }) {
  const [mode, setMode] = useState<Mode>('category');
  const [query, setQuery] = useState('');
  const [selected, setSelected] = useState<string | null>(null);
  const rows = heritage.catalogue;
  const counts = Object.entries(
    rows.reduce<Record<string, number>>((all, row) => {
      all[row[mode]] = (all[row[mode]] || 0) + 1;
      return all;
    }, {}),
  ).sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0], 'zh-CN'));
  const shown = mode === 'region' ? counts.slice(0, 10) : counts;
  const max = Math.max(...shown.map(([, count]) => count), 1);
  const matches = rows.filter(
    (row) =>
      (!selected || row[mode] === selected) &&
      [row.name, row.project_code, row.region, row.protecting_unit]
        .join(' ')
        .toLocaleLowerCase()
        .includes(query.trim().toLocaleLowerCase()),
  );
  return (
    <div className="catalogue-viz">
      <div className="viz-toolbar">
        <div>
          <span className="eyebrow">ANHUI CATALOGUE / 交付表</span>
          <h3>安徽国家级项目的名录分布</h3>
        </div>
        <div className="segmented" aria-label="名录统计维度">
          {modes.map((item) => (
            <button
              key={item.id}
              onClick={() => {
                setMode(item.id);
                setSelected(null);
              }}
              aria-pressed={mode === item.id}
            >
              {item.name}
            </button>
          ))}
        </div>
      </div>
      <div className="delivery-statline" aria-label="名录规模">
        <span>
          <b>{rows.length}</b> 条安徽申报地区或单位子项
        </span>
        <span>
          <b>{new Set(rows.map((row) => row.project_code)).size}</b> 个不同官方项目编号
        </span>
      </div>
      <div className="viz-stage" aria-live="polite">
        <div className="real-bars delivery-bars">
          {shown.map(([label, count]) => (
            <button
              className="real-bar"
              key={label}
              onClick={() => setSelected(selected === label ? null : label)}
              aria-pressed={selected === label}
              aria-label={`${label}，${count}条子项；点击筛选记录`}
            >
              <span>{label}</span>
              <div>
                <i style={{ width: `${(count / max) * 100}%` }} />
              </div>
              <b>{count}</b>
            </button>
          ))}
        </div>
        {mode === 'region' && (
          <p className="delivery-chart-note">
            图中显示子项数最多的 10 个原文申报地区或单位；全部 62 个名称可在下方查阅。
          </p>
        )}
      </div>
      <p className="delivery-chart-note">
        每条横条按子项计数，横轴从零开始。认定批次只表示列入名录的时间，不表示热度变化。
      </p>
      <details className="delivery-records">
        <summary>
          查阅 {selected ? `${selected}的` : '全部'}原始名录记录 <span>↘</span>
        </summary>
        <div className="delivery-search-row">
          <input
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="搜索名称、编号、地区或保护单位"
            aria-label="搜索安徽名录记录"
          />
          {selected && <button onClick={() => setSelected(null)}>清除图表筛选</button>}
        </div>
        <p className="delivery-chart-note">
          当前显示 {matches.length} / {rows.length} 条。逐条官网原文核对仍待补。
        </p>
        <div className="delivery-record-list">
          {matches.map((row) => (
            <article key={row.id}>
              <span>
                {row.project_code} · {row.category} · {row.batch}
              </span>
              <strong>{row.name}</strong>
              <small>
                {row.region} · 保护单位：{row.protecting_unit}
              </small>
            </article>
          ))}
        </div>
      </details>
      <div className="viz-footer">
        <span>交付表经结构清洗 · 逐条官网原文复核待补</span>
        <button className="text-button" onClick={onSource}>
          数据口径与来源 <Icon name="source" size={15} />
        </button>
      </div>
    </div>
  );
}
