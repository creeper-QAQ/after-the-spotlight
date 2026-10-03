import { useState, type CSSProperties } from 'react';
import { corpusAudit } from '../content/corpus-audit';
import reports from '../content/reports.json';

const labels: Record<string, string> = {
  'person-occurrences': '人次类',
  people: '人数类',
  occurrences: '次数',
  percentage: '百分比',
  currency: '金额',
  'content-items': '条数',
  events: '场数',
  objects: '单、项与件数',
  organizations: '家与所',
  unspecified: '单位缺失',
};

export function CorpusAudit() {
  const groups = corpusAudit.indicators.unitFamilies;
  const total = corpusAudit.counts.indicators;
  const [selected, setSelected] = useState(groups[0].id);
  const [allRows, setAllRows] = useState(false);
  const group = groups.find((item) => item.id === selected)!;
  const rows = reports.indicators.filter((row) => group.rowIds.includes(row.id));
  const nonemptyUnits = corpusAudit.indicators.units.filter(
    (unit) => unit.id !== '__empty__',
  ).length;
  const emptyCount = groups.find((item) => item.id === 'unspecified')?.count ?? 0;
  return (
    <div className="corpus-audit" aria-labelledby="corpus-heading">
      <span className="eyebrow">继续把尺子展开 / 全部采集指标的字段统计</span>
      <h3 id="corpus-heading">{total}条记录，并不共用一把尺。</h3>
      <p>
        我们把采集台账里保留的全部{total}条指标记录重新按单位分组：
        {nonemptyUnits}种非空单位写法，另有{emptyCount}条未填单位。
        数的是记录条数，保留待复核、计划和定性条目；没有把这些不同的数值相加。
      </p>
      <div className="corpus-ruler" aria-hidden="true">
        {groups.flatMap((item) =>
          item.rowIds.map((id) => (
            <i key={id} className={item.id === selected ? 'is-current' : ''} />
          )),
        )}
      </div>
      <p className="corpus-ruler-caption">每个刻痕 = 1条指标记录 · 点选一类，对照它的对象与时间</p>
      <div className="corpus-explore">
        <div className="corpus-unit-bars" role="group" aria-label="按单位查看采集记录">
          {groups.map((item) => (
            <button
              key={item.id}
              aria-pressed={selected === item.id}
              onClick={() => {
                setSelected(item.id);
                setAllRows(false);
              }}
              style={{ '--unit-share': `${(item.count / total) * 100}%` } as CSSProperties}
            >
              <span>{labels[item.id] ?? item.label}</span>
              <b>
                {item.count}
                <small> / {total}条</small>
              </b>
              <i aria-hidden="true" />
            </button>
          ))}
        </div>
        <div className="corpus-records" aria-live="polite" aria-atomic="false">
          <div className="corpus-record-heading">
            <h4>{group.label}</h4>
            <span>
              {group.count} / {total}条记录
            </span>
          </div>
          <p>同类单位仍可能属于不同平台、对象、尺度或币种。先看每条的范围，再判断能否比较。</p>
          <ol>
            {(allRows ? rows : rows.slice(0, 3)).map((row) => (
              <li key={row.id}>
                <span className="mono">{row.id}</span>
                <div>
                  <h5>{row.label}</h5>
                  <p>
                    {row.unit || '未填单位'} · {row.period}
                  </p>
                  <p>
                    {row.object} · {row.region}
                  </p>
                  <small>{row.status}</small>
                  {row.sourceIds.map((id) => {
                    const source = reports.sources.find((item) => item.id === id);
                    return source ? (
                      <a key={id} href={source.url} target="_blank" rel="noreferrer">
                        {source.publisher} · 原文 ↗
                      </a>
                    ) : null;
                  })}
                </div>
              </li>
            ))}
          </ol>
          {rows.length > 3 && (
            <button
              className="corpus-more"
              onClick={() => setAllRows(!allRows)}
              aria-expanded={allRows}
            >
              {allRows ? '收回到前三条 ↑' : `查看这一类的全部${rows.length}条 ↓`}
            </button>
          )}
        </div>
      </div>
      <div className="corpus-grain-note">
        <p>
          <b>
            {corpusAudit.counts.leadNotes}条用途笔记，来自{corpusAudit.counts.leadSourceUrls}
            个网页链接。
          </b>
          同一个网页可拆出多条工艺、人物或传播线索。笔记数与独立网页数分别统计，原文事实与日期仍按每条的状态复核。
        </p>
        <a href="#research">到卷末查阅完整台账与来源 ↓</a>
      </div>
      <p className="corpus-method-note">
        范围：现存结构化采集台账的全部记录。分组按原单位字段，不代表行业构成或已核对的事实占比。
        本文10组报道片段的证据编码另列，不能由这{total}条指标推导体验者留存率。
      </p>
    </div>
  );
}
