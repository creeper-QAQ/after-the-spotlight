import { useEffect, useRef } from 'react';
import { Bodies, Body, Composite, Constraint, Engine, Sleeping } from 'matter-js';

/** DOM buttons remain the accessible controls; Matter only owns their positions. */
export function useSealPhysics(enabled: boolean, reset: number) {
  const stage = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const host = stage.current;
    if (!host || !enabled) return;
    const reducedMotion = () => {
      const choice = document.documentElement.dataset.motion;
      return choice ? choice === 'off' : matchMedia('(prefers-reduced-motion: reduce)').matches;
    };
    const buttons = [...host.querySelectorAll<HTMLButtonElement>('.heritage-seal')];
    const engine = Engine.create({ enableSleeping: true, positionIterations: 8 });
    let bodies: Body[] = [];
    let visible = false;
    let frame = 0;
    let previous = 0;
    let accumulator = 0;
    let grab: {
      pointer: number;
      x: number;
      y: number;
      moved: boolean;
      button: HTMLButtonElement;
      joint?: Constraint;
    } | null = null;
    let suppressClick = false;
    const draw = () =>
      bodies.forEach((body, i) => {
        buttons[i].style.setProperty('--physics-left', `${body.position.x}px`);
        buttons[i].style.setProperty('--physics-top', `${body.position.y}px`);
        buttons[i].style.setProperty('--physics-rotation', `${body.angle}rad`);
      });
    const release = () => {
      if (!grab) return;
      if (grab.joint) Composite.remove(engine.world, grab.joint);
      grab.button.classList.remove('is-dragging');
      if (grab.button.hasPointerCapture(grab.pointer))
        grab.button.releasePointerCapture(grab.pointer);
      suppressClick = grab.moved;
      grab = null;
    };
    const rebuild = () => {
      release();
      Composite.clear(engine.world, false);
      const w = host.clientWidth,
        h = host.clientHeight - 30;
      const bw = buttons[0].offsetWidth,
        bh = buttons[0].offsetHeight;
      const columns = Math.max(1, Math.floor((w - 16) / (bw + 8)));
      bodies = buttons.map((_, i) => {
        const rank = (i * 37) % buttons.length;
        const body = Bodies.rectangle(
          8 + bw / 2 + (rank % columns) * ((w - 16 - bw) / Math.max(1, columns - 1)),
          -bh - Math.floor(rank / columns) * (bh + 28) - (i % 4) * 12,
          bw,
          bh,
          {
            restitution: 0.28,
            friction: 0.65,
            frictionAir: 0.015,
            angle: ((((i * 13) % 71) - 35) * Math.PI) / 180,
          },
        );
        Body.setVelocity(body, { x: (((i * 7) % 9) - 4) * 0.45, y: 0 });
        Body.setAngularVelocity(body, ((i % 7) - 3) * 0.012);
        return body;
      });
      Composite.add(engine.world, [
        ...bodies,
        Bodies.rectangle(w / 2, h + 30, w + 120, 60, { isStatic: true }),
        Bodies.rectangle(-30, -500, 60, h * 2 + 2000, { isStatic: true }),
        Bodies.rectangle(w + 30, -500, 60, h * 2 + 2000, { isStatic: true }),
      ]);
      if (reducedMotion()) {
        for (let i = 0; i < 360; i++) Engine.update(engine, 1000 / 60);
      }
      draw();
    };
    const position = (event: PointerEvent) => {
      const rect = host.getBoundingClientRect();
      return {
        x: Math.max(20, Math.min(rect.width - 20, event.clientX - rect.left)),
        y: Math.max(20, Math.min(rect.height - 50, event.clientY - rect.top)),
      };
    };
    const down = (event: PointerEvent) => {
      const button = (event.target as HTMLElement).closest<HTMLButtonElement>('.heritage-seal');
      if (!button || event.button !== 0 || grab) return;
      suppressClick = false;
      grab = { pointer: event.pointerId, x: event.clientX, y: event.clientY, moved: false, button };
      button.setPointerCapture(event.pointerId);
    };
    const move = (event: PointerEvent) => {
      if (!grab || grab.pointer !== event.pointerId) return;
      if (!grab.moved && Math.hypot(event.clientX - grab.x, event.clientY - grab.y) > 7) {
        grab.moved = true;
        const body = bodies[buttons.indexOf(grab.button)];
        Sleeping.set(body, false);
        grab.joint = Constraint.create({
          pointA: position(event),
          bodyB: body,
          length: 0,
          stiffness: 0.18,
          damping: 0.15,
        });
        Composite.add(engine.world, grab.joint);
        grab.button.classList.add('is-dragging');
      }
      if (grab.joint) grab.joint.pointA = position(event);
    };
    const up = (event: PointerEvent) => {
      if (grab?.pointer === event.pointerId) release();
    };
    const click = (event: MouseEvent) => {
      if (suppressClick && event.detail !== 0) {
        event.preventDefault();
        event.stopPropagation();
        suppressClick = false;
      }
    };
    const tick = (now: number) => {
      const reduced = reducedMotion();
      if (visible && !document.hidden && (!reduced || grab?.moved)) {
        accumulator += Math.min(previous ? now - previous : 16.67, 50);
        while (accumulator >= 1000 / 60) {
          Engine.update(engine, 1000 / 60);
          accumulator -= 1000 / 60;
        }
        draw();
      }
      previous = now;
      frame = requestAnimationFrame(tick);
    };
    const resize = new ResizeObserver(rebuild);
    resize.observe(host);
    const observer = new IntersectionObserver(
      ([entry]) => {
        visible = entry.isIntersecting;
      },
      { threshold: 0.05 },
    );
    observer.observe(host);
    host.addEventListener('pointerdown', down);
    host.addEventListener('pointermove', move);
    host.addEventListener('pointerup', up);
    host.addEventListener('pointercancel', up);
    host.addEventListener('lostpointercapture', up);
    host.addEventListener('click', click, true);
    frame = requestAnimationFrame(tick);
    return () => {
      release();
      cancelAnimationFrame(frame);
      resize.disconnect();
      observer.disconnect();
      host.removeEventListener('pointerdown', down);
      host.removeEventListener('pointermove', move);
      host.removeEventListener('pointerup', up);
      host.removeEventListener('pointercancel', up);
      host.removeEventListener('lostpointercapture', up);
      host.removeEventListener('click', click, true);
      Composite.clear(engine.world, false);
      Engine.clear(engine);
      buttons.forEach((button) => {
        button.style.removeProperty('--physics-left');
        button.style.removeProperty('--physics-top');
        button.style.removeProperty('--physics-rotation');
      });
    };
  }, [enabled, reset]);
  return stage;
}
