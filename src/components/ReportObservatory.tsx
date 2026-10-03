import { useState } from 'react';
import reports from '../content/reports.json';
import { reportFeatured, reportIndicators, reportSources } from '../content/report-view';
import { AnimatedMetric } from './AnimatedMetric';

export function ReportObservatory() {
  const [topic, setTopic] = useState('徽墨');
  const [query, setQuery] = useState('');
  const [status, setStatus] = useState('全部');
  const [limit, setLimit] = useState(12);
  const cards = reportFeatured.filter((r) => r.topic === topic);
  const matches = reportIndicators.filter(
    (r) =>
      (status === '全部' || r.status === status) &&
      `${r.label} ${r.region} ${r.platform} ${r.id} ${r.topic}`
        .toLowerCase()
        .includes(query.toLowerCase()),
  );
  const source = (id: string) => reportSources.find((s) => s.id === id)!;
  return (
    <div id="report-observatory" className="report-observatory">
      <header>
        <span className="eyebrow">新到的记录 / 传播 · 体验 · 消费</span>
        <h2>
          热闹有了数字，
          <br />
          <em>每个数字，都有边界。</em>
        </h2>
        <p>从屏幕上的播放，到墨厂里的研学，再到文创出货。翻开不同窗口，先看清它记录了什么。</p>
      </header>
      <div className="report-tabs" role="group" aria-label="报告观察主题">
        {['鱼灯', '徽墨', '文旅与产业'].map((t) => (
          <button key={t} aria-pressed={topic === t} onClick={() => setTopic(t)}>
            {t}
          </button>
        ))}
      </div>
      <div className="report-cards">
        {cards.map((r) => (
          <article key={r.id} className="report-card">
            <span className="report-card-label">{r.label}</span>
            <strong>
              <AnimatedMetric value={r.valueText} />
              <small>{r.unit}</small>
            </strong>
            <p>{r.period}</p>
            <div className="report-scope">{r.scope}</div>
            <a href={source(r.sourceId).url} target="_blank" rel="noreferrer">
              {source(r.sourceId).publisher} · 核对来源 ↗
            </a>
            <small className="report-evidence">
              {source(r.sourceId).verification} · {r.parentId}
            </small>
          </article>
        ))}
      </div>
      <p className="report-boundary">
        研学的队伍、售出的产品、工坊的收入，各自记录了手艺与生活的相遇。它们来自不同时间与对象；体验者是否继续学习，还要循着个人的记录去找。
      </p>
      <details className="research-annex report-index">
        <summary>
          <span>报告资料索引</span>
          <small>点击展开 · 31份报告 / 95条原记录 / 去重后94条指标</small>
          <b>＋</b>
        </summary>
        <p>
          已接收组员4资料并完成结构清洗；以下是采集索引，复核状态逐条标注。每行仅显示主指标，原行中的其他数字未自动合并。计划目标、定性与方法资料单独标记。
        </p>
        <div className="report-filters">
          <label>
            查找指标
            <input
              type="search"
              value={query}
              placeholder="输入鱼灯、墨厂、黄山或指标编号"
              onChange={(e) => {
                setQuery(e.target.value);
                setLimit(12);
              }}
            />
          </label>
          <label>
            复核状态
            <select
              value={status}
              onChange={(e) => {
                setStatus(e.target.value);
                setLimit(12);
              }}
            >
              {['全部', ...Object.keys(reports.summary.statusCounts)].map((s) => (
                <option key={s}>{s}</option>
              ))}
            </select>
          </label>
        </div>
        <p role="status">找到 {matches.length} 条指标</p>
        <div className="report-index-list">
          {matches.slice(0, limit).map((r) => (
            <details key={r.id} className="report-index-row">
              <summary>
                <span>
                  <small>
                    {r.id} · {r.status}
                  </small>
                  {r.label}
                </span>
                <b>
                  {r.valueText} {r.unit}
                </b>
              </summary>
              <dl>
                {r.linkedFactId && (
                  <div>
                    <dt>正文事实关联</dt>
                    <dd>{r.linkedFactId} · 与正文共用核对值，原始交付记录保留在采集台账。</dd>
                  </div>
                )}
                <div>
                  <dt>统计窗口</dt>
                  <dd>{r.period}</dd>
                </div>
                <div>
                  <dt>平台与范围</dt>
                  <dd>
                    {r.platform} · {r.region} · {r.object}
                  </dd>
                </div>
                <div>
                  <dt>比较方式</dt>
                  <dd>{r.comparison}</dd>
                </div>
                <div>
                  <dt>口径提醒</dt>
                  <dd>{r.notes}</dd>
                </div>
              </dl>
              {r.sourceIds.map((id) => (
                <a key={id} href={source(id).url} target="_blank" rel="noreferrer">
                  {source(id).title} ↗<small>{source(id).verification}</small>
                </a>
              ))}
            </details>
          ))}
        </div>
        {matches.length > limit && (
          <button className="report-more" onClick={() => setLimit((n) => n + 12)}>
            再展开12条 ↓
          </button>
        )}
        <p>同源重复 ZB051 已并入 ZB046。空缺不填零；未逐条复核的资料不作为正文结论。</p>
      </details>
    </div>
  );
}
