import { useEffect, useRef, useState } from 'react';
import { dataset } from '../content/data';

const clamp = (n: number) => Math.max(0, Math.min(1, n));
const smooth = (n: number) => {
  const t = clamp(n);
  return t * t * (3 - 2 * t);
};
function seeded(index: number, salt: number) {
  const value = Math.sin(index * 127.1 + salt * 311.7) * 43758.5453;
  return value - Math.floor(value);
}
const scenes: {
  eyebrow: string;
  title: string;
  body: string;
  fact: string;
  factLabel: string;
  id: string;
  metricId?: string;
}[] = [
  {
    eyebrow: '01 / THE SPARK',
    title: '一盏灯，\n先被看见。',
    body: '报道记录汪满田鱼灯受到关注。屏幕上的声势由此成为这次调查的起点。',
    fact: '2024',
    factLabel: '新华社报道观察',
    id: 'xinhua-fish-2024',
  },
  {
    eyebrow: '02 / THE SCREEN',
    title: '灯影越过山，\n来到屏幕前。',
    body: '一个创作者账号积累了关注；这反映单个账号的受众，并非鱼灯全网观看人数。',
    fact: '待核验',
    factLabel: '账号数据暂不可用',
    metricId: 'panmin-followers-2025',
    id: 'xinhua-fish-2025',
  },
  {
    eyebrow: '03 / THE STREETS',
    title: '一盏，\n变成满城流光。',
    body: '歙县全县鱼灯相关演艺与巡游的场次，记录的是活动规模，不是去重参与人数。',
    fact: '待核验',
    factLabel: '活动场次暂不可用',
    metricId: 'she-fish-events-2025',
    id: 'xinhua-fish-2025',
  },
  {
    eyebrow: '04 / THE QUESTION',
    title: '灯火之后，\n还有谁留下？',
    body: '热闹有了可见的侧面，学习与制作却需要另一种记录。接下来去现场，沿同一案例继续查。',
    fact: '？',
    factLabel: '同一批人的后续记录仍缺失',
    id: 'xinhua-fish-2025',
  },
];

function lanternSprite() {
  const node = document.createElement('canvas');
  node.width = node.height = 44;
  const ctx = node.getContext('2d')!;
  const glow = ctx.createRadialGradient(22, 22, 1, 22, 22, 21);
  glow.addColorStop(0, '#fff6c9');
  glow.addColorStop(0.12, '#ffce80');
  glow.addColorStop(0.32, '#f2784e88');
  glow.addColorStop(1, '#e8462400');
  ctx.fillStyle = glow;
  ctx.fillRect(0, 0, 44, 44);
  return node;
}

export function ViralBurst({ motion }: { motion: boolean }) {
  const root = useRef<HTMLElement>(null);
  const canvas = useRef<HTMLCanvasElement>(null);
  const progress = useRef(0);
  const visible = useRef(false);
  const waves = useRef<{ x: number; y: number; born: number }[]>([]);
  const [phase, setPhase] = useState(0);
  const [pulse, setPulse] = useState(0);

  useEffect(() => {
    const section = root.current;
    const surface = canvas.current;
    if (!section || !surface) return;
    const ctx = surface.getContext('2d');
    if (!ctx) return;
    const sprite = lanternSprite();
    let frame = 0;
    let width = 0;
    let height = 0;
    let dpr = 1;
    const updateSize = () => {
      const bounds = surface.getBoundingClientRect();
      dpr = Math.min(devicePixelRatio || 1, 1.5);
      width = bounds.width;
      height = bounds.height;
      surface.width = Math.max(1, Math.round(width * dpr));
      surface.height = Math.max(1, Math.round(height * dpr));
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      paint(performance.now());
    };
    const paint = (now: number) => {
      if (!width || !height) return;
      const p = progress.current;
      const cx = width * (width < 700 ? 0.5 : 0.58);
      const cy = height * 0.51;
      const background = ctx.createRadialGradient(cx, cy, 5, cx, cy, Math.max(width, height) * 0.8);
      background.addColorStop(0, p > 0.78 ? '#382722' : '#482b22');
      background.addColorStop(0.48, '#181817');
      background.addColorStop(1, '#101312');
      ctx.fillStyle = background;
      ctx.fillRect(0, 0, width, height);
      const spread = 0.08 + smooth((p - 0.1) / 0.62) * 1.18;
      const fade = 1 - smooth((p - 0.77) / 0.23) * 0.67;
      const count = width < 700 ? 420 : 950;
      ctx.globalCompositeOperation = 'lighter';
      for (let i = 0; i < count; i++) {
        const angle = seeded(i, 1) * Math.PI * 2;
        const radius =
          Math.sqrt(seeded(i, 2)) * Math.min(width, height) * (width < 700 ? 0.82 : 0.68);
        const sway = motion ? Math.sin(now * 0.00035 + i * 3.1) * 8 : 0;
        const x = cx + Math.cos(angle) * radius * spread + sway;
        const y = cy + Math.sin(angle) * radius * spread * 0.69 + sway * 0.35;
        const size = (2.4 + seeded(i, 3) * 6.5) * (i % 13 === 0 ? 1.6 : 1);
        const twinkle = motion ? 0.72 + Math.sin(now * 0.002 + i) * 0.26 : 0.9;
        if (i % 17 === 0 && spread > 0.35) {
          ctx.beginPath();
          ctx.moveTo(cx, cy);
          ctx.lineTo(x, y);
          ctx.strokeStyle = `rgba(236,122,74,${0.025 * fade})`;
          ctx.lineWidth = 1;
          ctx.stroke();
        }
        ctx.globalAlpha = (0.2 + seeded(i, 4) * 0.72) * twinkle * fade;
        ctx.drawImage(sprite, x - size * 2.3, y - size * 2.3, size * 4.6, size * 4.6);
      }
      ctx.globalAlpha = 1;
      waves.current = waves.current.filter((wave) => now - wave.born < 1300);
      for (const wave of waves.current) {
        const age = (now - wave.born) / 1300;
        ctx.beginPath();
        ctx.arc(
          wave.x * width,
          wave.y * height,
          12 + age * Math.max(width, height) * 0.6,
          0,
          Math.PI * 2,
        );
        ctx.strokeStyle = `rgba(255,183,110,${(1 - age) * 0.7})`;
        ctx.lineWidth = 1.5 + (1 - age) * 1.5;
        ctx.stroke();
      }
      ctx.globalCompositeOperation = 'source-over';
    };
    const tick = (now: number) => {
      if (visible.current && motion) paint(now);
      frame = requestAnimationFrame(tick);
    };
    const measure = () => {
      const rect = section.getBoundingClientRect();
      const distance = Math.max(1, rect.height - innerHeight);
      const p = clamp(-rect.top / distance);
      progress.current = p;
      setPhase(Math.min(3, Math.floor(p * 4)));
      if (!motion) paint(performance.now());
    };
    const observer = new IntersectionObserver(
      ([entry]) => {
        visible.current = entry.isIntersecting;
      },
      { rootMargin: '120px' },
    );
    observer.observe(section);
    const resize = new ResizeObserver(updateSize);
    resize.observe(surface);
    updateSize();
    measure();
    if (motion) frame = requestAnimationFrame(tick);
    addEventListener('scroll', measure, { passive: true });
    addEventListener('resize', measure);
    return () => {
      cancelAnimationFrame(frame);
      observer.disconnect();
      resize.disconnect();
      removeEventListener('scroll', measure);
      removeEventListener('resize', measure);
    };
  }, [motion]);

  const emitWave = (x: number, y: number) => {
    waves.current.push({ x, y, born: performance.now() });
    setPulse((value) => value + 1);
  };
  const addWave = (event: React.PointerEvent<HTMLDivElement>) => {
    const bounds = canvas.current?.getBoundingClientRect();
    if (!bounds) return;
    emitWave(
      (event.clientX - bounds.left) / bounds.width,
      (event.clientY - bounds.top) / bounds.height,
    );
  };
  const scene = scenes[phase];
  const source = dataset.sources.find((row) => row.id === scene.id);
  const metric = dataset.indicators.find(
    (row) => row.id === scene.metricId && row.sourceId === scene.id,
  );
  const nightShow =
    phase === 2
      ? dataset.indicators.find(
          (row) => row.id === 'she-night-show-2025' && row.sourceId === scene.id,
        )
      : null;
  return (
    <section
      id="viral-burst"
      className="viral-burst"
      ref={root}
      aria-label="鱼灯受到关注的可视化章节"
    >
      <div className="viral-stage" data-phase={phase}>
        <canvas ref={canvas} className="viral-canvas" aria-hidden="true" />
        <div className="viral-click-area" onPointerDown={addWave} aria-hidden="true" />
        <div className="viral-roof" aria-hidden="true" />
        <svg className="viral-fish" viewBox="0 0 600 400" aria-hidden="true">
          <defs>
            <radialGradient id="viral-fish-fill">
              <stop stopColor="#ffdea4" />
              <stop offset=".65" stopColor="#dc623e" />
              <stop offset="1" stopColor="#8d3429" />
            </radialGradient>
          </defs>
          <path
            d="M105 200C140 97 321 72 426 176L551 105L524 200L551 295L426 224C321 328 141 307 105 200Z"
            fill="url(#viral-fish-fill)"
            stroke="#ffd59a"
            strokeWidth="5"
          />
          <path
            d="M150 200Q302 92 442 188M150 200Q297 306 442 210M232 112Q284 198 230 288M310 103Q366 200 310 296M403 150Q440 200 405 246"
            fill="none"
            stroke="#ffe7b9"
            opacity=".65"
            strokeWidth="4"
          />
          <circle cx="171" cy="182" r="12" fill="#271c18" stroke="#ffe2af" strokeWidth="4" />
          <path
            d="M437 174L553 105L525 200L553 295L437 226"
            fill="none"
            stroke="#ffe2af"
            strokeWidth="4"
          />
        </svg>
        <div className="viral-frame-label">
          <span>FIELD NOTE / 02</span>
          <span>徽州 · 灯火扩散</span>
        </div>
        <div className="viral-copy" aria-live="polite">
          <span>{scene.eyebrow}</span>
          <h2>
            {scene.title.split('\n').map((part) => (
              <span key={part}>
                {part}
                <br />
              </span>
            ))}
          </h2>
          <p>{scene.body}</p>
        </div>
        <div className="viral-fact">
          <small>报道中的一个观察窗口</small>
          <strong>
            {metric?.valueText ?? scene.fact}
            {metric && <em>{metric.unit}</em>}
          </strong>
          <span>{metric ? `${metric.label} · ${metric.period}` : scene.factLabel}</span>
          {nightShow && (
            <p className="viral-secondary">
              另一观察窗口：{nightShow.label}
              {nightShow.valueText}
              {nightShow.unit}。这不是全县活动的观众合计。
            </p>
          )}
          {source && (
            <a href={source.url} target="_blank" rel="noreferrer">
              核对来源 · {source.title} ↗
            </a>
          )}
        </div>
        <div className="viral-bottom">
          <span>灯点与光波是传播氛围的视觉意象，不编码人数、地区或传播速度。</span>
          <span>{String(phase + 1).padStart(2, '0')} / 04 · 向下继续</span>
        </div>
        <button
          className="viral-pulse-indicator"
          onClick={() => emitWave(0.58, 0.51)}
          aria-live="polite"
        >
          {pulse ? `已点亮 ${pulse} 次光波` : '轻点画面，试着点亮一束光'}
        </button>
      </div>
    </section>
  );
}
