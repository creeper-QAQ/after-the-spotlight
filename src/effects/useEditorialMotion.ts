import { useEffect } from 'react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);
export function useEditorialMotion(enabled: boolean) {
  useEffect(() => {
    if (!enabled) return;
    const context = gsap.context(() => {
      gsap.from('.overture-copy > *', {
        y: 26,
        opacity: 0,
        duration: 1.1,
        stagger: 0.13,
        ease: 'power3.out',
      });
      gsap.utils.toArray<HTMLElement>('.chapter-rule').forEach((rule) =>
        gsap.from(rule, {
          scaleX: 0,
          transformOrigin: 'left',
          duration: 1.3,
          scrollTrigger: { trigger: rule, start: 'top 88%', once: true },
        }),
      );
      gsap.utils
        .toArray<HTMLElement>('.section-heading h2,.craft-narrative,.records-title')
        .forEach((el) =>
          gsap.from(el, {
            y: 35,
            opacity: 0.25,
            duration: 1,
            scrollTrigger: { trigger: el, start: 'top 90%', once: true },
          }),
        );
    }, document.getElementById('root')!);
    return () => context.revert();
  }, [enabled]);
}
