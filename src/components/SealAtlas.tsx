import { useEffect, useState, type CSSProperties } from 'react';
import heritage from '../content/heritage.json';
import { useSealPhysics } from '../effects/useSealPhysics';
import '../styles/seal-repair.css';

const rows = heritage.catalogue;
const categories = [...new Set(rows.map((row) => row.category))];
const years = [...new Set(rows.map((row) => row.year))].sort();
const glyphs: Record<string, string> = {
  民间文学: '文',
  传统音乐: '乐',
  传统舞蹈: '舞',
  传统戏剧: '戏',
  曲艺: '曲',
  '传统体育、游艺与杂技': '艺',
  传统美术: '绘',
  传统技艺: '工',
  传统医药: '药',
  民俗: '俗',
};
type Layout = 'physics' | 'scatter' | 'category' | 'year';

export function SealAtlas({ onSource }: { onSource: () => void }) {
  const [layout, setLayout] = useState<Layout>('physics');
  const [reset, setReset] = useState(0);
  const stage = useSealPhysics(layout === 'physics', reset);
  const [selected, setSelected] = useState(rows.findIndex((row) => row.name === '徽墨制作技艺'));
  const [compact, setCompact] = useState(() => matchMedia('(max-width: 650px)').matches);
  useEffect(() => {
    const media = matchMedia('(max-width: 650px)');
    const update = () => setCompact(media.matches);
    media.addEventListener('change', update);
    return () => media.removeEventListener('change', update);
  }, []);
  const record = rows[selected];
  const point = (index: number) => {
    if (compact && layout !== 'physics') {
      const ordering = rows
        .map((row, i) => ({ ...row, i }))
        .sort((a, b) =>
          layout === 'category'
            ? categories.indexOf(a.category) - categories.indexOf(b.category)
            : layout === 'year'
              ? a.year - b.year
              : a.i - b.i,
        );
      const position = ordering.findIndex((row) => row.i === index);
      return { x: 8 + (position % 6) * 16.8, y: 4 + Math.floor(position / 6) * 5.65, rotate: 0 };
    }
    if (layout === 'scatter') {
      const radius = Math.sqrt((index + 0.5) / rows.length) * 45;
      const angle = index * 2.399963;
      return {
        x: 50 + Math.cos(angle) * radius,
        y: 50 + Math.sin(angle) * radius,
        rotate: ((index * 17) % 35) - 17,
      };
    }
    if (layout === 'category' || compact) {
      const ordering = rows
        .map((row, i) => ({ ...row, i }))
        .sort((a, b) =>
          layout === 'category'
            ? categories.indexOf(a.category) - categories.indexOf(b.category)
            : a.year - b.year,
        );
      const position = ordering.findIndex((row) => row.i === index);
      return { x: 6 + (position % 11) * 8.8, y: 8 + Math.floor(position / 11) * 10.4, rotate: 0 };
    }
    const year = rows[index].year;
    const siblings = rows.map((row, i) => ({ ...row, i })).filter((row) => row.year === year);
    const rank = siblings.findIndex((row) => row.i === index);
    const radius = 45 - years.indexOf(year) * 8.3;
    const angle = (rank / siblings.length) * Math.PI * 2 - Math.PI / 2;
    return {
      x: 50 + Math.cos(angle) * radius,
      y: 50 + Math.sin(angle) * radius,
      rotate: (angle * 180) / Math.PI + 90,
    };
  };
  const move = (direction: number) =>
    setSelected((value) => (value + direction + rows.length) % rows.length);
  return (
    <section id="seal-atlas" className="seal-atlas" data-ink-exclude>
      <div className="atlas-heading">
        <span className="eyebrow">第二卷 / 百工印谱</span>
        <h2>
          散落的手艺，
          <br />
          <em>在这里有了名字。</em>
        </h2>
        <p>
          一枚印记，一条名录。
          <br />
          翻开安徽的 99 条国家级子项，
          <br />
          让抽象的数字，回到具体的地方。
        </p>
      </div>
      <div className="atlas-toolbar">
        <span>
          <b>99</b> 枚印记 <i>/</i> <b>10</b> 类手艺
        </span>
        <div aria-label="印谱排列方式">
          {(
            [
              ['physics', '落印成堆'],
              ['scatter', '散落成卷'],
              ['category', '十类成谱'],
              ['year', '认定年轮'],
            ] as const
          ).map(([key, label]) => (
            <button key={key} aria-pressed={layout === key} onClick={() => setLayout(key)}>
              {label}
            </button>
          ))}
          {layout === 'physics' && (
            <button onClick={() => setReset((value) => value + 1)}>重新落下 ↻</button>
          )}
        </div>
      </div>
      <div className="atlas-workspace">
        <div
          ref={stage}
          className={`seal-stage layout-${layout}`}
          role="group"
          aria-label="99条安徽名录印记"
          onKeyDown={(event) => {
            if (event.key === 'ArrowRight' || event.key === 'ArrowDown') {
              event.preventDefault();
              move(1);
            }
            if (event.key === 'ArrowLeft' || event.key === 'ArrowUp') {
              event.preventDefault();
              move(-1);
            }
          }}
        >
          <span className="atlas-watermark" aria-hidden="true">
            百<br />工
          </span>
          <div className="atlas-guide" aria-hidden="true" />
          {rows.map((row, index) => {
            const p = point(index);
            return (
              <button
                key={row.id}
                className={`heritage-seal ${index === selected ? 'is-selected' : ''} ${categories.indexOf(row.category) % 3 === 0 ? 'seal-dark' : ''}`}
                style={
                  {
                    left: `${p.x}%`,
                    top: `${p.y}%`,
                    '--seal-rotation': `${p.rotate}deg`,
                    '--seal-delay': `${(index % 13) * 16}ms`,
                  } as CSSProperties
                }
                data-seal-id={row.id}
                aria-label={`${row.name}，${row.region}`}
                aria-pressed={index === selected}
                onClick={() => {
                  setSelected(index);
                  if (compact)
                    document.querySelector('.seal-record')?.scrollIntoView({
                      behavior:
                        matchMedia('(prefers-reduced-motion: reduce)').matches ||
                        document.documentElement.dataset.motion === 'off'
                          ? 'instant'
                          : 'smooth',
                      block: 'center',
                    });
                }}
              >
                <span>{glyphs[row.category] || '艺'}</span>
                <small>{String(index + 1).padStart(2, '0')}</small>
              </button>
            );
          })}
          <span className="atlas-stage-caption">
            {layout === 'physics'
              ? '拖一枚印，松手落下 · 轻点查看详情'
              : layout === 'scatter'
                ? '点一枚印，走近一门手艺'
                : layout === 'category'
                  ? '按十大门类依次排布'
                  : compact
                    ? '按认定年份依次排布'
                    : '由外向内：2006 → 2021'}
          </span>
        </div>
        <aside className="seal-record" aria-live="polite">
          <div className="seal-record-top">
            <span>名录第 {String(selected + 1).padStart(2, '0')} 签</span>
            <span>{record.project_code}</span>
          </div>
          <div className="record-glyph" aria-hidden="true">
            {glyphs[record.category] || '艺'}
          </div>
          <span className="record-category">{record.category}</span>
          <h3>{record.name}</h3>
          <dl>
            <div>
              <dt>申报地区</dt>
              <dd>{record.region}</dd>
            </div>
            <div>
              <dt>认定批次</dt>
              <dd>
                {record.year} · {record.batch}
              </dd>
            </div>
            <div>
              <dt>保护单位</dt>
              <dd>{record.protecting_unit}</dd>
            </div>
          </dl>
          <div className="seal-record-nav">
            <button onClick={() => move(-1)} aria-label="上一枚印记">
              ←
            </button>
            <span>{selected + 1} / 99</span>
            <button onClick={() => move(1)} aria-label="下一枚印记">
              →
            </button>
          </div>
          <button className="atlas-source" onClick={onSource}>
            名录来源与统计口径 ↗
          </button>
        </aside>
      </div>
      <div className="atlas-legend">
        {categories.map((category) => (
          <span key={category}>
            <b>{glyphs[category]}</b>
            {category}
            <small>{rows.filter((row) => row.category === category).length}</small>
          </span>
        ))}
      </div>
      <p className="atlas-note">
        每枚印记代表交付表的一条地区或单位子项，涉及 72
        个官方项目编号。印章以艺术方式排布，位置不对应地理坐标；原文核对范围见来源。
      </p>
    </section>
  );
}
