import { useEffect, useRef, useState } from 'react';
import type WebGLFluidEnhanced from 'webgl-fluid-enhanced';

export function InkFluid({ motion, theme }: { motion: boolean; theme: string }) {
  const host = useRef<HTMLDivElement>(null);
  const engine = useRef<WebGLFluidEnhanced | null>(null);
  const [status, setStatus] = useState('loading');
  const drop = useRef<(x: number, y: number, dx?: number, dy?: number) => void>(() => {});
  useEffect(() => {
    if (!motion) {
      setStatus('paused');
      return;
    }
    let disposed = false;
    let cleanup = () => {};
    setStatus('loading');
    import('webgl-fluid-enhanced')
      .then(({ default: Fluid }) => {
        if (disposed || !host.current) return;
        const target = host.current;
        try {
          const fluid = new Fluid(target);
          engine.current = fluid;
          fluid.setConfig({
            simResolution: innerWidth < 600 ? 64 : 128,
            dyeResolution: innerWidth < 600 ? 256 : 512,
            densityDissipation: 1.7,
            velocityDissipation: 0.65,
            pressureIterations: 12,
            curl: 22,
            splatRadius: 0.15,
            hover: false,
            colorful: false,
            shading: false,
            bloom: false,
            sunrays: false,
            transparent: false,
            inverted: theme !== 'night',
            backgroundColor: '#000000',
            brightness: 1.5,
            colorPalette: ['#ffffff'],
          });
          fluid.start();
          setStatus('ready');
          let drops = 0;
          let previous = { x: 0, y: 0 };
          let drawing = false;
          drop.current = (x, y, dx, dy) => {
            const canvas = target.querySelector('canvas');
            if (!canvas || document.hidden) return;
            if (dx === undefined || dy === undefined) {
              const angle = Math.random() * Math.PI * 2;
              const speed = 240;
              dx = Math.cos(angle) * speed;
              dy = Math.sin(angle) * speed;
            }
            // v0.8 normalizes x by backing width but y by CSS height.
            fluid.splatAtLocation((x * canvas.width) / canvas.clientWidth, y, dx, dy, '#030303');
            target.dataset.drops = String(++drops);
          };
          const down = (event: PointerEvent) => {
            if (event.pointerType === 'touch') return;
            if (
              (event.target as HTMLElement).closest(
                'button,a,input,textarea,summary,dialog,canvas,label,select,p,h1,h2,h3,h4,blockquote,li,[role="table"],.coverage-overview,[data-ink-exclude]',
              )
            )
              return;
            drawing = true;
            previous = { x: event.clientX, y: event.clientY };
            drop.current(event.clientX, event.clientY);
          };
          const move = (event: PointerEvent) => {
            if (!drawing || event.buttons === 0) return;
            const dx = (event.clientX - previous.x) * 18;
            const dy = (previous.y - event.clientY) * 18;
            drop.current(event.clientX, event.clientY, dx, dy);
            previous = { x: event.clientX, y: event.clientY };
          };
          const up = () => {
            drawing = false;
          };
          let paused = false;
          const visibility = () => {
            if (document.hidden !== paused) {
              fluid.togglePause();
              paused = document.hidden;
            }
          };
          document.addEventListener('pointerdown', down, { passive: true });
          document.addEventListener('pointermove', move, { passive: true });
          document.addEventListener('pointerup', up);
          document.addEventListener('visibilitychange', visibility);
          cleanup = () => {
            document.removeEventListener('pointerdown', down);
            document.removeEventListener('pointermove', move);
            document.removeEventListener('pointerup', up);
            document.removeEventListener('visibilitychange', visibility);
            fluid.stop();
            const canvas = target.querySelector('canvas');
            const gl = canvas?.getContext('webgl2') || canvas?.getContext('webgl');
            gl?.getExtension('WEBGL_lose_context')?.loseContext();
            target.replaceChildren();
            engine.current = null;
            drop.current = () => {};
          };
        } catch {
          target.replaceChildren();
          setStatus('unavailable');
        }
      })
      .catch(() => {
        if (!disposed) setStatus('unavailable');
      });
    return () => {
      disposed = true;
      cleanup();
    };
  }, [motion, theme]);
  return (
    <>
      <div className="ink-fluid" aria-hidden="true" data-status={status}>
        <div className="ink-fluid-host" ref={host} />
      </div>
      <button
        className="ink-drop-button"
        aria-label="落一滴墨"
        title={status === 'ready' ? '点击空白处也能点墨' : '动态效果已关闭或暂不可用'}
        disabled={status !== 'ready'}
        onClick={() => drop.current(innerWidth * 0.73, Math.min(innerHeight * 0.53, 450))}
      >
        <span>墨</span>
        <small>点一下</small>
      </button>
    </>
  );
}
