import { useEffect, useRef, useState } from 'react';
import { chapters, type SourceTopic } from './content/story';
import { Icon } from './components/Icon';
import { Overture } from './components/Overture';
import { EditorialFindings } from './components/EditorialFindings';
import { EvidenceReader } from './components/EvidenceReader';
import { PeopleStories } from './components/PeopleStories';
import { SealAtlas } from './components/SealAtlas';
import { SplatGallery } from './effects/SplatGallery';
import { FollowupGuide, ReadingArchive } from './components/ReadingArchive';
import { SourceDialog } from './components/SourceDialog';
import { Attention, CraftContext, Verdict } from './components/Narrative';
import { InkFluid } from './effects/InkFluid';
import { HeritageDecor } from './effects/HeritageDecor';
import { ViralBurst } from './effects/ViralBurst';
import { useEditorialMotion } from './effects/useEditorialMotion';

function readPreference(key: string, fallback: string) {
  try {
    return localStorage.getItem(key) ?? fallback;
  } catch {
    return fallback;
  }
}

export default function App() {
  const [topic, setTopic] = useState<SourceTopic | null>(null);
  const [caseKind, setCaseKind] = useState<'fish' | 'ink'>('fish');
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
  const settings = useRef<HTMLDialogElement>(null);
  const settingsTrigger = useRef<HTMLButtonElement>(null);
  const motion = motionChoice === 'system' ? !systemReduced : motionChoice === 'on';
  useEditorialMotion(motion);
  useEffect(() => {
    document.documentElement.dataset.chapter = active;
  }, [active]);

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
      <HeritageDecor />
      <InkFluid motion={motion} theme={theme} />
      <a href="#findings" className="skip-link">
        跳到正文
      </a>
      <header className={`site-header ${active === 'intro' ? 'header-overture' : ''}`}>
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
        <Overture motion={motion} />
        <EditorialFindings />
        <Attention onSource={setTopic} />
        <ViralBurst motion={motion} />
        <div className="story-join join-crowd-atlas">
          <span>从屏幕里的声音，走向有名字的手艺</span>
          <p>热闹让我们看见一盏灯。往下翻，安徽的百工各有名录、地方与来处。</p>
        </div>
        <SealAtlas onSource={() => setTopic('catalogue')} />
        <div className="story-join join-atlas-case">
          <span>从百工中，取出两条调查线</span>
          <p>鱼灯与徽墨，是这次追问的两个入口。先让视线从全国轮廓，聚到一盏具体的灯。</p>
          <a href="#participation">带着问题，进入调查板 ↓</a>
        </div>
        <SplatGallery motion={motion} />
        <EvidenceReader kind={caseKind} onKindChange={setCaseKind} />
        <PeopleStories kind={caseKind} />
        <CraftContext
          onSource={setTopic}
          motion={motion}
          kind={caseKind}
          onKindChange={setCaseKind}
        />
        <Verdict onSource={setTopic} />
        <FollowupGuide />
        <ReadingArchive onSource={setTopic} />
      </main>
      <footer className="site-footer">
        <a className="footer-brand" href="#intro">
          被看见之后<span>一卷关于非遗的互动叙事</span>
        </a>
        <p>
          未完的长卷 V1.2 · 资料核对日期见来源说明
          <br />
          鱼灯与徽墨为原创工艺示意。安徽名录图据采集表整理，逐条原文核对情况见来源说明。
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
