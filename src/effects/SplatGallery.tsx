import { useEffect, useRef, useState } from 'react';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import type { createSplatViewer } from './splatViewer';

const steps = [
  {
    title: '从全国，看见被记录的技艺。',
    text: '名录提供空间背景，却不能证明“爆火”带来了参与。红点目前只是动效占位，不能据此判断哪里更多。',
  },
  {
    title: '让地图退后，把问题推近。',
    text: '从分布转向现场：谁来到了活动，谁只是看过视频？这里需要参与记录，而不是另一张漂亮的地图。',
  },
  {
    title: '再走近一盏鱼灯。',
    text: '点云聚合成鱼灯，是从全国视野走入个案的转场。接下来追踪同一个案例的传播、参与和后续实践。',
  },
];
export function SplatGallery({ motion }: { motion: boolean }) {
  const root = useRef<HTMLElement>(null);
  const host = useRef<HTMLDivElement>(null);
  const viewer = useRef<Awaited<ReturnType<typeof createSplatViewer>> | null>(null);
  const progress = useRef(0);
  const [step, setStep] = useState(0);
  const [status, setStatus] = useState('waiting');
  useEffect(() => {
    let disposed = false,
      started = false;
    setStatus('waiting');
    if (!motion) {
      progress.current = 0;
      setStep(0);
    }
    const trigger = ScrollTrigger.create({
      trigger: root.current,
      start: 'top top',
      end: 'bottom bottom',
      onUpdate: (self) => {
        if (!motion) return;
        progress.current = self.progress;
        root.current?.setAttribute('data-progress', self.progress.toFixed(3));
        viewer.current?.gather(self.progress);
        if (motion) setStep(self.progress < 0.25 ? 0 : self.progress < 0.65 ? 1 : 2);
      },
    });
    const observer = new IntersectionObserver(
      (entries) => {
        if (!entries[0].isIntersecting || started) return;
        started = true;
        setStatus('loading');
        import('./splatViewer')
          .then(async ({ createSplatViewer }) => {
            if (disposed || !host.current) return;
            const instance = await createSplatViewer(host.current, null, motion, () => {
              if (!disposed) setStatus('unavailable');
            });
            if (disposed) {
              instance.dispose();
              return;
            }
            viewer.current = instance;
            instance.gather(progress.current);
            setStatus('ready');
          })
          .catch(() => {
            if (!disposed) setStatus('unavailable');
          });
      },
      { rootMargin: '200px' },
    );
    observer.observe(host.current!);
    return () => {
      disposed = true;
      observer.disconnect();
      trigger.kill();
      viewer.current?.dispose();
      viewer.current = null;
    };
  }, [motion]);
  return (
    <section
      id="participation"
      ref={root}
      className={`splat-journey ${motion ? '' : 'is-static'}`}
      data-progress="0"
    >
      <div className="journey-sticky">
        <div className="splat-experience" data-status={status}>
          <div
            ref={host}
            className="splat-canvas"
            aria-label="中国地图红点随滚动爆散并聚合成鱼灯；红点为动效占位，非真实非遗分布"
          />
          {status !== 'ready' && (
            <div className="splat-loading">
              <p>
                {status === 'unavailable'
                  ? '空间效果暂不可用，调查继续向下展开。'
                  : '光点正在汇入视野…'}
              </p>
            </div>
          )}
        </div>
        <div className="journey-copy">
          <span className="eyebrow">02 / THE PARTICIPATION · 从屏幕到现场</span>
          <span className="journey-counter">
            0{step + 1}
            <small> / 03</small>
          </span>
          <h2>{steps[step].title}</h2>
          <p>{steps[step].text}</p>
          <div className="journey-steps" aria-label="调查问题">
            {steps.map((item, i) => (
              <button
                key={item.title}
                aria-label={item.title}
                aria-pressed={step === i}
                onClick={() => {
                  setStep(i);
                  if (!motion) {
                    progress.current = i === 2 ? 1 : i === 1 ? 0.5 : 0;
                    viewer.current?.gather(progress.current);
                  }
                  if (motion && root.current)
                    window.scrollTo({
                      top:
                        window.scrollY +
                        root.current.getBoundingClientRect().top +
                        (root.current.offsetHeight - innerHeight) *
                          (i === 2 ? 0.96 : i === 1 ? 0.5 : 0),
                      behavior: 'instant',
                    });
                }}
              >
                0{i + 1}
                <span />
              </button>
            ))}
          </div>
        </div>
        <div className="map-status" data-stage={step}>
          <span className="map-status-dot" />
          {step === 0
            ? '非遗名录分布预留'
            : step === 1
              ? '从全国视野，走近一个案例'
              : '鱼灯 · 原创模型聚合'}
          <small>
            {step === 0 ? '红点为动效占位 · 非实际分布' : '视觉转场，不表示数量或统计转化'}
          </small>
        </div>
        <div className="journey-bottom">
          <span>底图：DataV.GeoAtlas · 红点待接入核验数据</span>
          <span>
            {motion ? '继续下滑 · 地图 → 爆散 → 鱼灯 ↓' : '减少动态 · 点击序号切换地图、散点与鱼灯'}
          </span>
        </div>
      </div>
    </section>
  );
}
