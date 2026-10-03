import { useEffect, useRef, useState, type CSSProperties } from 'react';
import { reactions } from '../content/reactions';
import { EvidenceSource } from '../components/EvidenceSource';
import { publicMeasure } from '../content/evidence';

const BILIBILI_VIDEO_URL = 'https://www.bilibili.com/video/BV1Qd4y1V7he/';
const TOTAL_AVATARS = 507;
function AvatarFlight() {
  const [selected, setSelected] = useState(0);
  const [hovered, setHovered] = useState<number | null>(null);
  const [compact, setCompact] = useState(() => matchMedia('(max-width: 620px)').matches);
  useEffect(() => {
    const media = matchMedia('(max-width:620px)');
    const update = () => setCompact(media.matches);
    media.addEventListener('change', update);
    return () => media.removeEventListener('change', update);
  }, []);
  const count = compact ? 66 : 132;
  const totalBatches = Math.ceil(TOTAL_AVATARS / count);
  const batch = Math.floor(selected / count);
  const offset = batch * count;
  const batchCount = Math.min(count, TOTAL_AVATARS - offset);
  const focused =
    hovered !== null && hovered >= offset && hovered < offset + batchCount ? hovered : selected;
  const commentIndex = focused % reactions.length;
  const shownAvatar = focused - offset;
  const [handle, comment] = reactions[commentIndex];

  const step = (delta: number) => {
    setSelected((value) => (value + delta + TOTAL_AVATARS) % TOTAL_AVATARS);
    setHovered(null);
  };
  const nextBatch = () => {
    setSelected(((batch + 1) % totalBatches) * count);
    setHovered(null);
  };
  return (
    <div className="crowd-narrative">
      <div className="crowd-heading">
        <span className="eyebrow">01 / 当灯火进入屏幕</span>
        <h3>
          惊叹、想去、想做。
          <br />
          人声汇成了热闹。
        </h3>
        <p>停在一张头像上，读一句声音。轻点选中，再翻向下一句。“后来”需要另一种记录。</p>
      </div>
      <div className="crowd-field observer-deep-space" role="group" aria-label="头像与评论空间">
        {Array.from({ length: batchCount }, (_, index) => {
          const angle = index * 2.399963229728653,
            radius = Math.sqrt((index + 0.5) / batchCount);
          const x = 50 + Math.cos(angle) * 43 * radius,
            y = 50 + Math.sin(angle) * 44 * radius;
          const style = {
            '--crowd-x': `${x}%`,
            '--crowd-y': `${y}%`,
            '--crowd-delay': `${-(index % 17) * 0.9}s`,
            '--crowd-depth': String(0.68 + (index % 5) * 0.08),
          } as CSSProperties;
          return (
            <button
              className={`swarm-avatar${shownAvatar === index ? ' is-active' : ''}`}
              key={offset + index}
              style={style}
              aria-label={`头像${offset + index + 1}，查看评论`}
              aria-pressed={shownAvatar === index}
              tabIndex={shownAvatar === index ? 0 : -1}
              onPointerEnter={(event) => {
                if (event.pointerType !== 'touch') setHovered(offset + index);
              }}
              onPointerLeave={() => setHovered(null)}
              onFocus={() => setSelected(offset + index)}
              onClick={() => {
                setSelected(offset + index);
                setHovered(null);
              }}
              onKeyDown={(event) => {
                const directions: Record<string, number> = {
                  ArrowLeft: -1,
                  ArrowRight: 1,
                  ArrowUp: -8,
                  ArrowDown: 8,
                };
                const delta = directions[event.key];
                if (delta === undefined && event.key !== 'Home' && event.key !== 'End') return;
                event.preventDefault();
                const next =
                  event.key === 'Home'
                    ? 0
                    : event.key === 'End'
                      ? batchCount - 1
                      : (index + delta! + batchCount) % batchCount;
                setSelected(offset + next);
                setHovered(null);
                const buttons = event.currentTarget.parentElement?.querySelectorAll('button');
                (buttons?.[next] as HTMLButtonElement | undefined)?.focus();
              }}
            >
              <img
                src={`./avatars/observers-web/observer-${String(offset + index + 1).padStart(3, '0')}.jpg`}
                alt=""
                loading="lazy"
              />
            </button>
          );
        })}
      </div>
      <div className="crowd-reading" aria-live="polite" onPointerEnter={() => setHovered(null)}>
        <span className="eyebrow crowd-fiction-label">
          原创声音示意 / {String(commentIndex + 1).padStart(3, '0')}
        </span>
        <p className="crowd-handle">{handle}</p>
        <blockquote>{comment}</blockquote>
        <div className="crowd-pagination">
          <button onClick={() => step(-1)} aria-label="上一条评论">
            ←
          </button>
          <span>
            {commentIndex + 1} / {reactions.length} 句 · 头像第 {batch + 1}/{totalBatches} 批
          </span>
          <button onClick={() => step(1)} aria-label="下一条评论">
            →
          </button>
          <button onClick={nextBatch} className="crowd-batch-button" aria-label="换一批评论">
            换一批 ↻
          </button>
        </div>
        <p className="observer-disclaimer">头像、身份与声音均为叙事示意，非采集样本。</p>
        <div className="crowd-fact">
          <small>真实报告窗口</small>
          <strong>
            {publicMeasure('keyword-views').valueText}{' '}
            <span>{publicMeasure('keyword-views').unit}</span>
          </strong>
          <p>
            黄山、鱼灯、歙县等关键词相关视频合集播放
            <br />
            2025年1月7日—2月12日 · 非独立人数
          </p>
          <EvidenceSource id={publicMeasure('keyword-views').sourceId} compact />
        </div>
      </div>
    </div>
  );
}

export function ViralBurst({ motion }: { motion: boolean }) {
  const root = useRef<HTMLElement>(null);
  const video = useRef<HTMLVideoElement>(null);
  const [loadVideo, setLoadVideo] = useState(false);
  const [inView, setInView] = useState(false);
  const [documentVisible, setDocumentVisible] = useState(!document.hidden);
  const [paused, setPaused] = useState(false);
  const [videoReady, setVideoReady] = useState(false);
  const [videoFailed, setVideoFailed] = useState(false);

  useEffect(() => {
    const section = root.current;
    if (!section) return;
    const preload = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && motion) setLoadVideo(true);
      },
      { rootMargin: '320px 0px' },
    );
    const visibility = new IntersectionObserver(
      ([entry]) => {
        setInView(entry.isIntersecting);
        document.documentElement.classList.toggle(
          'avatar-space-active',
          entry.intersectionRatio > 0.4,
        );
      },
      { threshold: [0, 0.4, 0.7] },
    );
    preload.observe(section);
    visibility.observe(section);
    return () => {
      preload.disconnect();
      visibility.disconnect();
      document.documentElement.classList.remove('avatar-space-active');
    };
  }, [motion]);

  useEffect(() => {
    const update = () => setDocumentVisible(!document.hidden);
    document.addEventListener('visibilitychange', update);
    return () => document.removeEventListener('visibilitychange', update);
  }, []);

  useEffect(() => {
    const player = video.current;
    if (!player) return;
    if (motion && inView && documentVisible && !paused && !videoFailed) {
      void player.play().catch(() => setPaused(true));
    } else player.pause();
  }, [motion, loadVideo, videoReady, inView, documentVisible, paused, videoFailed]);

  return (
    <section
      ref={root}
      id="viral-burst"
      className="viral-burst avatar-space-section"
      aria-label="屏幕评论漂浮空间"
    >
      <div
        className="viral-stage is-avatar-flight"
        data-phase="avatar-space"
        data-motion={motion ? 'on' : 'off'}
      >
        <div className="avatar-video-bg" aria-hidden="true">
          <img src="./media/lantern-night-poster.jpg" alt="" loading="lazy" />
          {loadVideo && motion && (
            <video
              ref={video}
              className={videoReady && !videoFailed ? 'is-ready' : ''}
              src="./media/lantern-night.webm"
              poster="./media/lantern-night-poster.jpg"
              loop
              muted
              playsInline
              preload="metadata"
              disablePictureInPicture
              disableRemotePlayback
              tabIndex={-1}
              onLoadedData={() => setVideoReady(true)}
              onError={() => setVideoFailed(true)}
            />
          )}
        </div>
        <AvatarFlight />
        <div className="crowd-film-footer">
          <div>
            <span>原创三维灯影 · 工艺意象{!motion || videoFailed ? ' · 静帧阅读' : ''}</span>
            <a
              className="avatar-video-credit"
              href={BILIBILI_VIDEO_URL}
              target="_blank"
              rel="noreferrer"
            >
              参考影像 ·《原神》2023新春短片－鱼灯 ↗
            </a>
          </div>
          {motion && !videoFailed && (
            <button
              type="button"
              className="avatar-motion-toggle"
              onClick={() => setPaused((value) => !value)}
              disabled={!videoReady}
              aria-pressed={!paused}
              aria-label={paused ? '播放背景灯影' : '暂停背景灯影'}
            >
              {paused ? '▷ 播放灯影' : 'Ⅱ 暂停灯影'}
            </button>
          )}
        </div>
      </div>
    </section>
  );
}
