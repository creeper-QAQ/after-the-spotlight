import { useEffect, useRef, useState } from 'react';
import { Player, type PlayerRef } from '@remotion/player';
import { LanternOverture } from '../film/LanternOverture';

export function Overture({ motion }: { motion: boolean }) {
  const [player, setPlayer] = useState<PlayerRef | null>(null);
  const host = useRef<HTMLElement>(null);
  const [playing, setPlaying] = useState(motion);
  const [frame, setFrame] = useState(0);
  const [inView, setInView] = useState(true);
  useEffect(() => {
    const observer = new IntersectionObserver(([entry]) => setInView(entry.isIntersecting), {
      threshold: 0.1,
    });
    if (host.current) observer.observe(host.current);
    return () => observer.disconnect();
  }, []);
  useEffect(() => {
    setPlaying(motion);
  }, [motion]);
  useEffect(() => {
    if (playing && motion && inView) {
      const frame = requestAnimationFrame(() => player?.play());
      const retry = window.setTimeout(() => player?.play(), 120);
      return () => {
        cancelAnimationFrame(frame);
        clearTimeout(retry);
      };
    }
    player?.pause();
  }, [playing, motion, inView, player]);
  useEffect(() => {
    const current = player;
    if (!current) return;
    const update = ({ detail }: { detail: { frame: number } }) => {
      if (detail.frame % 3 === 0) setFrame(detail.frame);
    };
    current.addEventListener('frameupdate', update);
    return () => current.removeEventListener('frameupdate', update);
  }, [player]);
  const seek = (value: number) => {
    player?.pause();
    setPlaying(false);
    player?.seekTo(value);
    setFrame(value);
  };
  return (
    <section ref={host} id="intro" className="overture" data-ink-exclude>
      <div className="overture-ruling" aria-hidden="true" />
      <div className="overture-top">
        <span>一卷关于非遗的互动叙事</span>
        <span>ANHUI · CHINA / 2026</span>
      </div>
      <div className="overture-layout">
        <div className="overture-copy">
          <span className="overture-kicker">AFTER THE SPOTLIGHT</span>
          <h1>
            被看见
            <span>
              <i>之</i>后
              <span className="overture-seal">
                未完
                <br />
                之卷
              </span>
            </span>
          </h1>
          <p>
            灯火会散场。
            <br />
            手艺的故事，往后翻。
          </p>
          <a href="#findings" className="overture-enter">
            <span>展开这卷故事</span>
            <b>↘</b>
          </a>
        </div>
        <div className="overture-art">
          <span className="overture-art-index">FIG. 01 / 一盏灯的来处</span>
          <Player
            ref={setPlayer}
            component={LanternOverture}
            durationInFrames={360}
            compositionWidth={1000}
            compositionHeight={880}
            fps={30}
            initialFrame={0}
            loop
            autoPlay={motion}
            initiallyMuted
            acknowledgeRemotionLicense
            controls={false}
            clickToPlay={false}
            className="overture-player"
            style={{ width: '100%' }}
            numberOfSharedAudioTags={0}
          />
          <div className="overture-film-controls">
            <button
              onClick={() => setPlaying(!playing)}
              aria-label={playing ? '暂停纸灯序幕' : '播放纸灯序幕'}
              disabled={!motion}
            >
              {playing ? 'Ⅱ' : '▷'}
            </button>
            <input
              type="range"
              min="0"
              max="359"
              value={frame}
              onChange={(e) => seek(Number(e.target.value))}
              aria-label="拖动纸灯序幕"
            />
            <span>{(frame / 30).toFixed(1)} / 12s</span>
          </div>
          <div className="overture-acts">
            {[
              ['01', '纸骨', 35],
              ['02', '灯火', 180],
              ['03', '流转', 290],
            ].map(([index, label, at]) => (
              <button
                key={index}
                onClick={() => seek(Number(at))}
                aria-pressed={Math.abs(frame - Number(at)) < 55}
              >
                <small>{index}</small>
                {label}
              </button>
            ))}
          </div>
        </div>
      </div>
      <div className="overture-bottom">
        <span>鱼灯 × 徽墨</span>
        <p>
          从一次看见，到一次动手，
          <br />
          再到下一次回来。
        </p>
        <small>原创动态意象 · 非实物复原</small>
      </div>
    </section>
  );
}
