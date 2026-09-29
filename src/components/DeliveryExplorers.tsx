import { useState } from 'react';
import heritage from '../content/heritage.json';

type PeopleMode = 'batch' | 'birth' | 'project';
const projectByCode = new Map(heritage.catalogue.map((row) => [row.project_code, row.name]));
const confirmedLinks = heritage.links.filter((row) => row.confirmed);
const confirmedByPerson = new Map(confirmedLinks.map((row) => [row.person_id, row.project_code]));
const batchOrder = ['第一批', '第二批', '第三批', '第四批', '第五批', '第六批'];

export function PeopleExplorer() {
  const [mode, setMode] = useState<PeopleMode>('batch');
  const [selected, setSelected] = useState<string | null>(null);
  const [query, setQuery] = useState('');
  const [expanded, setExpanded] = useState(false);
  const people = heritage.people;
  const knownBirth = people.filter((row) => row.birth_year !== null).length;
  const groups: [string, number][] =
    mode === 'batch'
      ? batchOrder.map((batch) => [
          batch,
          people.filter((row) => row.recognition_batch === batch).length,
        ])
      : mode === 'birth'
        ? Object.entries(
            people.reduce<Record<string, number>>((counts, row) => {
              if (row.birth_year !== null) {
                const decade = `${Math.floor(row.birth_year / 10) * 10}年代`;
                counts[decade] = (counts[decade] || 0) + 1;
              }
              return counts;
            }, {}),
          ).sort((a, b) => a[0].localeCompare(b[0]))
        : Object.entries(
            confirmedLinks.reduce<Record<string, number>>((counts, row) => {
              counts[row.project_code] = (counts[row.project_code] || 0) + 1;
              return counts;
            }, {}),
          )
            .sort((a, b) => b[1] - a[1])
            .slice(0, 10);
  const max = Math.max(...groups.map(([, count]) => count), 1);
  const matches = people.filter((person) => {
    if (selected) {
      if (mode === 'batch' && person.recognition_batch !== selected) return false;
      if (
        mode === 'birth' &&
        (person.birth_year === null ||
          `${Math.floor(person.birth_year / 10) * 10}年代` !== selected)
      )
        return false;
      if (mode === 'project' && confirmedByPerson.get(person.id) !== selected) return false;
    }
    return [person.name, person.project_name_original, person.region]
      .join(' ')
      .toLocaleLowerCase()
      .includes(query.trim().toLocaleLowerCase());
  });
  const visible = expanded ? matches : matches.slice(0, 12);
  return (
    <div className="delivery-people-explorer">
      <div className="delivery-explorer-head">
        <div>
          <span className="eyebrow">PEOPLE IN THE CATALOGUE / 名录中的人</span>
          <h3>143 个名字，能说明到哪一步？</h3>
        </div>
        <div className="segmented" aria-label="人物统计维度">
          {(
            [
              ['batch', '认定批次'],
              ['birth', '出生年代'],
              ['project', '项目关联'],
            ] as const
          ).map(([key, label]) => (
            <button
              key={key}
              aria-pressed={mode === key}
              onClick={() => {
                setMode(key);
                setSelected(null);
                setExpanded(false);
              }}
            >
              {label}
            </button>
          ))}
        </div>
      </div>
      <div className="delivery-statline">
        <span>
          <b>{people.length}</b> 位交付表名录人物
        </span>
        <span>
          <b>{knownBirth}</b> 位有出生年份 · {people.length - knownBirth} 位未公布
        </span>
        <span>
          <b>{confirmedLinks.length}</b> 条子项关联 · 1 条待复核
        </span>
      </div>
      <div
        className="real-bars delivery-bars delivery-people-bars"
        aria-label={
          mode === 'birth' ? '出生年代分布' : mode === 'project' ? '项目关联人数' : '各认定批次人数'
        }
      >
        {groups.map(([key, count]) => (
          <button
            key={key}
            className="real-bar"
            aria-pressed={selected === key}
            onClick={() => {
              setSelected(selected === key ? null : key);
              setExpanded(false);
            }}
          >
            <span>{mode === 'project' ? `${projectByCode.get(key) || key} · ${key}` : key}</span>
            <div>
              <i style={{ width: `${(count / max) * 100}%` }} />
            </div>
            <b>{count}</b>
          </button>
        ))}
      </div>
      <p className="delivery-chart-note">
        {mode === 'batch' && '认定批次是公布年份的分组，不代表新增从业者的年度变化。'}
        {mode === 'birth' &&
          `只统计有出生年份的 ${knownBirth} 人；${people.length - knownBirth} 人未公布，未计入柱形。不是当前年龄或在世人口图。`}
        {mode === 'project' &&
          '仅显示关联人数最多的 10 个官方项目编号；同一项目的不同子项按项目编号合并。CR022 的具体子项归属待复核，未计入。'}
      </p>
      <details className="delivery-records">
        <summary>
          查阅人物名录与官方详情页 <span>↘</span>
        </summary>
        <div className="delivery-search-row">
          <input
            type="search"
            value={query}
            onChange={(event) => {
              setQuery(event.target.value);
              setExpanded(false);
            }}
            placeholder="搜索姓名、项目或地区"
            aria-label="搜索代表性传承人"
          />
          {selected && <button onClick={() => setSelected(null)}>清除图表筛选</button>}
        </div>
        <p className="delivery-chart-note">
          匹配 {matches.length} / {people.length} 人。所有人在世状态均未核实。
        </p>
        <div className="delivery-record-list delivery-person-list">
          {visible.map((person) => (
            <article key={person.id}>
              <span>
                {person.recognition_batch} · {person.recognition_year}年 · {person.region}
              </span>
              <strong>
                {person.name}{' '}
                <small>
                  {person.birth_year === null ? '出生年未公布' : `${person.birth_year}年生`}
                </small>
              </strong>
              <small>{person.project_name_original}</small>
              <a href={person.source_url} target="_blank" rel="noreferrer">
                官方详情页 ↗
              </a>
            </article>
          ))}
        </div>
        {matches.length > visible.length && (
          <button className="delivery-more" onClick={() => setExpanded(true)}>
            显示余下 {matches.length - visible.length} 人 ↘
          </button>
        )}
      </details>
      <p className="delivery-chart-note">
        资料来自组员提交的安徽国家级代表性传承人名录表。名录身份不能证明当前是否在世、活跃，或与其他人物构成师徒关系。
      </p>
    </div>
  );
}

export function LeadDesk() {
  const [topic, setTopic] = useState<'歙县鱼灯' | '徽墨'>('歙县鱼灯');
  const [kind, setKind] = useState('全部');
  const kinds = ['全部', ...new Set(heritage.leads.map((row) => row.kind))];
  const leads = heritage.leads.filter(
    (row) => row.topic === topic && (kind === '全部' || row.kind === kind),
  );
  return (
    <div className="delivery-lead-desk">
      <div className="delivery-explorer-head">
        <div>
          <span className="eyebrow">RESEARCH DESK / 资料线索</span>
          <h3>从 30 条采集笔记寻找下一步证据</h3>
        </div>
        <div className="segmented" aria-label="资料主题">
          {(['歙县鱼灯', '徽墨'] as const).map((key) => (
            <button key={key} aria-pressed={topic === key} onClick={() => setTopic(key)}>
              {key}
            </button>
          ))}
        </div>
      </div>
      <div className="delivery-statline">
        <span>
          <b>{heritage.leads.length}</b> 条线索笔记
        </span>
        <span>
          <b>{new Set(heritage.leads.map((row) => row.source_url)).size}</b> 个不同网页链接
        </span>
      </div>
      <div className="delivery-kind-filters" aria-label="资料类型">
        {kinds.map((key) => (
          <button key={key} aria-pressed={kind === key} onClick={() => setKind(key)}>
            {key}
          </button>
        ))}
      </div>
      <div className="delivery-lead-list">
        {leads.map((lead) => (
          <article key={lead.id}>
            <span>
              {lead.id} / {lead.kind} / {lead.publisher}
            </span>
            <small>采集表简述 · 待核对原文</small>
            <p>{lead.summary_unverified}</p>
            <a href={lead.source_url} target="_blank" rel="noreferrer">
              查看原网页，核对采集表简述 ↗
            </a>
          </article>
        ))}
      </div>
      <p className="delivery-chart-note">
        这些是待逐条核对的报道、工艺和素材线索，不是 30
        起独立事件，也没有可直接比较的指标。图片和视频使用权均未确认，页面只提供文字与原网页链接。
      </p>
    </div>
  );
}
