import { lazy, Suspense, useEffect, useRef, useState } from 'react';
import {
  coverageSummary,
  evidenceKinds,
  publicEvidence,
  publicMeasure,
  type EvidenceKind,
} from '../content/evidence';
import { EvidenceSource } from './EvidenceSource';
import { EvidenceWall } from './EvidenceWall';

const CorpusAudit = lazy(() => import('./CorpusAudit').then((m) => ({ default: m.CorpusAudit })));

function CorpusSection() {
  const host = useRef<HTMLDivElement>(null);
  const [near, setNear] = useState(false);
  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setNear(true);
          observer.disconnect();
        }
      },
      { rootMargin: '500px 0px' },
    );
    if (host.current) observer.observe(host.current);
    return () => observer.disconnect();
  }, []);
  return (
    <div ref={host} className="corpus-section" id="corpus-audit">
      {near && (
        <Suspense fallback={<p role="status">正在展开采集记录的统计……</p>}>
          <CorpusAudit />
        </Suspense>
      )}
    </div>
  );
}

const windows = [
  {
    id: 'views',
    label: '播放次数',
    measure: 'keyword-views',
    heading: '屏幕上的目光',
    supported: '可以确认：这组关键词相关内容获得了大量播放。',
    unsupported: '不能确认：有多少不同的人看过、谁因此到访、谁后来学艺。',
  },
  {
    id: 'visits',
    label: '接待人次',
    measure: 'ink-visits',
    heading: '来到现场的一次次',
    supported: `可以确认：这家墨厂全年记录了${publicMeasure('ink-visits').valueText}${publicMeasure('ink-visits').unit}研学接待，同一人可以多次出现。`,
    unsupported: '不能确认：独立学员人数、体验者转化为学徒的比例。',
  },
  {
    id: 'makers',
    label: '实名实践',
    measure: 'fish-orders-value',
    heading: '师傅日常里的订单',
    supported: '可以确认：汪华武工坊在跨年度区间里仍有制作和订单记录。',
    unsupported: '不能确认：订单利润、体验者转成新匠人的数量，或播放量造成了订单。',
  },
  {
    id: 'learning',
    label: '持续学习',
    measure: null,
    heading: '把同一个人接到后来',
    supported: '需要确认：首次体验的人，在半年或一年后是否仍学习、制作或拜师。',
    unsupported: '现有片段不能计算留存率。未知不等于没有人留下。',
  },
] as const;

export function EvidenceReader({
  kind = 'fish',
  onKindChange,
}: { kind?: 'fish' | 'ink'; onKindChange?: (kind: 'fish' | 'ink') => void } = {}) {
  const [selected, setSelected] = useState<string>('views');
  const [coverageFilter, setCoverageFilter] = useState<EvidenceKind | 'all'>('all');
  const coverageRows = publicEvidence.coverage.filter(
    (record) => coverageFilter === 'all' || record[coverageFilter],
  );
  const current = windows.find((row) => row.id === selected)!;
  const measure = current.measure ? publicMeasure(current.measure) : null;
  return (
    <section
      id="participation"
      className="section evidence-reader"
      aria-labelledby="evidence-reader-heading"
    >
      <div className="editorial-section-heading">
        <span className="eyebrow">02 / 把数字放回它的尺子</span>
        <h2 id="evidence-reader-heading">
          从看见，到亲手做。
          <br />
          <em>每一步，证据都不同。</em>
        </h2>
        <p>播放、接待、工坊和学习，记录不同的对象。选一把尺，看它能说明到哪一步。</p>
      </div>
      <div className="evidence-window-tabs" role="group" aria-label="选择证据口径">
        {windows.map((row) => (
          <button
            key={row.id}
            aria-pressed={selected === row.id}
            onClick={() => setSelected(row.id)}
          >
            {row.label}
          </button>
        ))}
      </div>
      <div className="evidence-window" aria-live="polite" aria-atomic="true">
        <div className="evidence-window-number">
          <span className="eyebrow">{current.heading}</span>
          {measure ? (
            <>
              <div>
                <strong>{measure.valueText}</strong>
                <span>{measure.unit}</span>
              </div>
              <p>{measure.label}</p>
              <small>
                {measure.period}
                <br />
                {measure.scope}
              </small>
              <EvidenceSource id={measure.sourceId} compact />
            </>
          ) : (
            <>
              <strong className="evidence-missing-rate">未知</strong>
              <p>体验者持续学习的比例</p>
              <small>{publicEvidence.retention.reason}</small>
              <span className="unknown-label">没有可比的追踪分母</span>
            </>
          )}
        </div>
        <div className="evidence-window-reasoning">
          <div>
            <span className="reasoning-mark">可支持</span>
            <p>{current.supported}</p>
          </div>
          <div>
            <span className="reasoning-mark uncertain">需止步</span>
            <p>{current.unsupported}</p>
          </div>
          <small>
            {measure?.limitation ??
              '下一条证据，要保留同一对象的身份、首次体验日期、回访时间与具体学习行为。'}
          </small>
        </div>
      </div>
      <div className="evidence-bridge-note">
        <b>这几组数字不构成转化漏斗。</b>
        <span>
          对象、单位与时间窗不同，不能用{publicMeasure('ink-visits').valueText}
          {publicMeasure('ink-visits').unit}除以{publicMeasure('keyword-views').valueText}
          {publicMeasure('keyword-views').unit}来计算“传承率”。
        </span>
      </div>
      <div className="investigation-intro">
        <span className="eyebrow">把尺度带到现场 / 两门手艺的调查板</span>
        <h3>
          数字落回卡片，<em>沿着红线往后找。</em>
        </h3>
        <p>
          切换鱼灯或徽墨，沿着关注、体验与后续实践查看报道。红线连接调查步骤；同一批体验者的去向，仍需保留空白。
        </p>
      </div>
      <EvidenceWall kind={kind} onKindChange={onKindChange} />
      <div className="coverage-overview" aria-label="所选片段的证据计数">
        <span className="eyebrow">数的是来源片段组，不是传承成效</span>
        <h3>同一组记录，能接到哪一步？</h3>
        <p>
          分母为本文目的性选取的{publicEvidence.coverage.length}
          组证据片段，每组对应一份来源。各项可同时出现，不能相加为人数，也不代表全部报道。
        </p>
        <div className="coverage-counts">
          {coverageSummary.map((item) => (
            <div key={item.id}>
              <span>{item.label}</span>
              <strong>
                {item.supported}
                <small> / {item.total} 组</small>
              </strong>
              <p>
                {item.supported === 0
                  ? '所选片段均未提供；不等于现实中无人留下。'
                  : '所选片段明确提供相关证据。'}
              </p>
            </div>
          ))}
        </div>
      </div>
      <details className="coverage-annex">
        <summary>
          我们怎样核对这条路？<span>查看10份报道的证据片段 ↓</span>
        </summary>
        <p>{publicEvidence.method}</p>
        <div className="coding-protocol">
          <h4>先说明怎样判定</h4>
          <p>{publicEvidence.codingProtocol.unit}</p>
          <p>{publicEvidence.codingProtocol.selection}</p>
          <dl>
            {publicEvidence.codingProtocol.rules.map((rule) => (
              <div key={rule.id}>
                <dt>{evidenceKinds.find((item) => item.id === rule.id)?.label}</dt>
                <dd>
                  {rule.include}
                  <small>{rule.exclude}</small>
                </dd>
              </div>
            ))}
          </dl>
          <p>{publicEvidence.codingProtocol.review}</p>
        </div>
        <div className="evidence-window-tabs" role="group" aria-label="筛选编码片段">
          <button aria-pressed={coverageFilter === 'all'} onClick={() => setCoverageFilter('all')}>
            全部片段
          </button>
          {evidenceKinds.map((item) => (
            <button
              key={item.id}
              aria-pressed={coverageFilter === item.id}
              onClick={() => setCoverageFilter(item.id)}
            >
              {item.label}
            </button>
          ))}
        </div>
        <p role="status">
          当前显示{coverageRows.length} / {publicEvidence.coverage.length}
          组片段。筛选只显示明确支持所选项的片段。
        </p>
        <p className="coverage-swipe">手机可横向滑动表格，对照同一行的四项编码。</p>
        <div
          className="coverage-grid"
          tabIndex={0}
          role="table"
          aria-label="选定公开报道片段的证据覆盖"
        >
          <div className="coverage-row coverage-head" role="row">
            <span role="columnheader">选取的证据片段</span>
            {evidenceKinds.map((kind) => (
              <span role="columnheader" key={kind.id}>
                {kind.label}
              </span>
            ))}
          </div>
          {coverageRows.map((record) => (
            <div className="coverage-row" role="row" key={record.id}>
              <div role="cell">
                <b>{record.label}</b>
                <EvidenceSource id={record.sourceId} compact />
                <small>{record.note}</small>
              </div>
              {evidenceKinds.map((kind) => (
                <span
                  role="cell"
                  key={kind.id}
                  className={record[kind.id] ? 'coverage-yes' : 'coverage-no'}
                  aria-label={`${kind.label}：${record[kind.id] ? '片段有证据' : '片段未提供'}`}
                >
                  {record[kind.id] ? '●' : '○'}
                </span>
              ))}
            </div>
          ))}
        </div>
        {coverageRows.length === 0 && (
          <p className="coverage-empty">
            这组片段尚未连接同一批体验者的首次体验与后续学习。请切回“全部片段”核对原记录；不能据此判断全部公开报道或行业现状。
          </p>
        )}
        <p className="coverage-key">
          ● 选取片段明确支持　○
          选取片段未提供。未提供不等于事实没有发生；这组目的性选取的记录不能代表全部报道或行业总体。
        </p>
      </details>
      <CorpusSection />
    </section>
  );
}
