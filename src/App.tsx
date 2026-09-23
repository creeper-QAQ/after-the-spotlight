import { useEffect, useRef, useState } from 'react';
import { chapters, introduction, type SourceTopic } from './content/story';
import { Icon } from './components/Icon';
import { ModelView } from './components/ModelView';
import { SourceDialog } from './components/SourceDialog';
import { Overview, Craft, People, After } from './components/Sections';

function readPreference(key: string, fallback: string) {
  try {
    return localStorage.getItem(key) ?? fallback;
  } catch {
    return fallback;
  }
}

export default function App() {
  const [topic, setTopic] = useState<SourceTopic | null>(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const [active, setActive] = useState('intro');
  const [progress, setProgress] = useState(0);
  const [theme, setTheme] = useState(() => readPreference('spotlight-theme', 'paper'));
  const [motionChoice, setMotionChoice] = useState(() =>
    readPreference('spotlight-motion', 'system'),
  );
  const [systemReduced, setSystemReduced] = useState(
    () => matchMedia('(prefers-reduced-motion: reduce)').matches,
  );
  const [heroRotation, setHeroRotation] = useState(0);
  const settings = useRef<HTMLDialogElement>(null);
  const settingsTrigger = useRef<HTMLButtonElement>(null);
  const motion = motionChoice === 'system' ? !systemReduced : motionChoice === 'on';

  useEffect(() => {
    const preference = matchMedia('(prefers-reduced-motion: reduce)');
    const change = () => setSystemReduced(preference.matches);
    preference.addEventListener('change', change);
    return () => preference.removeEventListener('change', change);
  }, []);
  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    document.documentElement.dataset.motion = motion ? 'on' : 'off';
    try {
      localStorage.setItem('spotlight-theme', theme);
      localStorage.setItem('spotlight-motion', motionChoice);
    } catch {
      /* Session-only preferences when storage is unavailable. */
    }
  }, [theme, motion, motionChoice]);
  useEffect(() => {
    let scheduled = false;
    const update = () => {
      scheduled = false;
      const height = document.documentElement.scrollHeight - window.innerHeight;
      setProgress(height > 0 ? window.scrollY / height : 0);
      const current = ['intro', ...chapters.map((c) => c.id)]
        .filter(
          (id) =>
            (document.getElementById(id)?.getBoundingClientRect().top ?? Infinity) <=
            window.innerHeight * 0.42,
        )
        .at(-1);
      setActive(current ?? 'intro');
    };
    const onScroll = () => {
      if (!scheduled) {
        scheduled = true;
        requestAnimationFrame(update);
      }
    };
    update();
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll);
    return () => {
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onScroll);
    };
  }, []);
  useEffect(() => {
    if (!menuOpen) return;
    const close = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setMenuOpen(false);
        document.getElementById('menu-button')?.focus();
      }
    };
    window.addEventListener('keydown', close);
    return () => window.removeEventListener('keydown', close);
  }, [menuOpen]);
  const closeSettings = () => {
    settings.current?.close();
    settingsTrigger.current?.focus();
  };

  return (
    <>
      <a href="#overview" className="skip-link">
        跳到正文
      </a>
      <header className="site-header">
        <a className="brand" href="#intro" onClick={() => setMenuOpen(false)}>
          <span className="brand-seal">见</span>
          <span>
            被看见之后<span className="brand-en">AFTER THE SPOTLIGHT</span>
          </span>
        </a>
        <nav
          className={menuOpen ? 'main-nav is-open' : 'main-nav'}
          aria-label="章节导航"
          id="main-navigation"
        >
          {chapters.map((chapter) => (
            <a
              key={chapter.id}
              href={`#${chapter.id}`}
              aria-current={active === chapter.id ? 'location' : undefined}
              onClick={() => setMenuOpen(false)}
            >
              <span>{chapter.number}</span>
              {chapter.title}
            </a>
          ))}
        </nav>
        <div className="header-actions">
          <button className="source-link" onClick={() => setTopic('method')}>
            关于 / 来源 <Icon name="source" size={15} />
          </button>
          <button
            className="menu-button icon-button"
            aria-label={menuOpen ? '关闭目录' : '打开目录'}
            aria-expanded={menuOpen}
            aria-controls="main-navigation"
            id="menu-button"
            onClick={() => setMenuOpen(!menuOpen)}
          >
            <Icon name={menuOpen ? 'close' : 'menu'} />
          </button>
        </div>
        <div className="reading-progress" style={{ transform: `scaleX(${progress})` }} />
      </header>
      <main>
        <section id="intro" className="hero">
          <div className="hero-topline">
            <span>
              <i className="status-dot" />
              {introduction.eyebrow}
            </span>
            <span className="edition mono">VISUAL EDITION / 2026</span>
          </div>
          <div className="hero-layout">
            <div className="hero-copy">
              <span className="hero-english">
                AFTER THE
                <br />
                SPOTLIGHT.
              </span>
              <h1>
                被看见
                <span className="title-bottom">
                  之<span className="accent">后</span>
                  <span className="title-seal">
                    非遗
                    <br />
                    观察
                  </span>
                </span>
              </h1>
              <div className="hero-deck">
                <p>
                  {introduction.subtitle}
                  <br />
                  {introduction.question}
                </p>
              </div>
              <a className="begin-link" href="#overview">
                <span className="round-arrow">
                  <Icon name="down" size={19} />
                </span>
                循着光，往里走<span className="mono">SCROLL TO EXPLORE</span>
              </a>
            </div>
            <div className="hero-art">
              <div className="hero-orbit" aria-hidden="true" />
              <span className="art-axis axis-top">HUANGSHAN · ANHUI</span>
              <span className="art-axis axis-right">一 盏 灯 的 来 处</span>
              <ModelView motion={motion} rotation={heroRotation} className="hero-model" />
              <div className="hero-art-caption">
                <span>
                  <span className="tiny-cross">+</span> 鱼灯 · 形与光的相遇
                </span>
                <button
                  className="text-button"
                  aria-label="旋转首页鱼灯"
                  onClick={() => setHeroRotation((r) => r + Math.PI / 4)}
                >
                  <Icon name="rotate" size={15} /> 拖动探索
                </button>
              </div>
              <span className="model-disclaimer">原创三维示意 · 非实物复原</span>
            </div>
          </div>
          <div className="hero-bottom">
            <span className="hero-bottom-index mono">安徽 / 鱼灯 × 徽墨</span>
            <p>
              当一门手艺走进屏幕，
              <br className="mobile-break" />
              它的故事才刚刚开始。
            </p>
            <span className="small-tag">视觉初版 · 数据待核验</span>
          </div>
        </section>
        <div className="opening-note">
          <span className="vertical-label">从看见到传承</span>
          <p>{introduction.description}</p>
          <span className="opening-symbol" aria-hidden="true">
            续
          </span>
        </div>
        <Overview onSource={setTopic} />
        <Craft onSource={setTopic} motion={motion} />
        <People onSource={setTopic} />
        <After onSource={setTopic} />
        <section className="ending">
          <span className="eyebrow">THE STORY CONTINUES</span>
          <h2>
            让看见，
            <br />
            成为<span>继续。</span>
          </h2>
          <p>
            灯火之外，纸墨之间。
            <br />
            关于传承的答案，仍在具体的人与日常里。
          </p>
          <button className="ending-source" onClick={() => setTopic('method')}>
            阅读研究方法与来源 <Icon name="arrow" />
          </button>
          <span className="ending-character" aria-hidden="true">
            续
          </span>
        </section>
      </main>
      <footer className="site-footer">
        <a className="footer-brand" href="#intro">
          被看见之后<span>一部关于非遗的数据新闻</span>
        </a>
        <p>
          视觉初版 V0.1
          <br />
          模型为原创示意，正式数据与案例资料待核验。
        </p>
        <div className="footer-actions">
          <button
            ref={settingsTrigger}
            className="text-button"
            onClick={() => settings.current?.showModal()}
          >
            <Icon name="sun" size={17} />
            阅读设置
          </button>
          <a href="#intro">回到开篇 ↑</a>
        </div>
      </footer>
      <SourceDialog topic={topic} onClose={() => setTopic(null)} />
      <dialog
        className="settings-dialog"
        ref={settings}
        aria-labelledby="settings-title"
        onCancel={closeSettings}
        onClick={(e) => {
          if (e.target === e.currentTarget) closeSettings();
        }}
      >
        <div className="dialog-inner">
          <div className="dialog-top">
            <span className="eyebrow">READING PREFERENCES</span>
            <button className="icon-button" onClick={closeSettings} aria-label="关闭阅读设置">
              <Icon name="close" />
            </button>
          </div>
          <h2 id="settings-title">让阅读更舒适</h2>
          <fieldset>
            <legend>纸面颜色</legend>
            <div className="setting-options">
              {[
                { id: 'paper', label: '暖纸' },
                { id: 'light', label: '素白' },
                { id: 'night', label: '夜读' },
              ].map((option) => (
                <button
                  key={option.id}
                  aria-pressed={theme === option.id}
                  onClick={() => setTheme(option.id)}
                >
                  <span className={`theme-swatch swatch-${option.id}`} />
                  {option.label}
                </button>
              ))}
            </div>
          </fieldset>
          <fieldset>
            <legend>动态效果</legend>
            <div className="segmented">
              {[
                { id: 'system', label: '跟随系统' },
                { id: 'on', label: '开启' },
                { id: 'off', label: '减少动态' },
              ].map((option) => (
                <button
                  key={option.id}
                  aria-pressed={motionChoice === option.id}
                  onClick={() => setMotionChoice(option.id)}
                >
                  {option.label}
                </button>
              ))}
            </div>
          </fieldset>
          <p className="settings-note">减少动态后，仍可使用按钮切换视角和探索结构。</p>
        </div>
      </dialog>
    </>
  );
}
