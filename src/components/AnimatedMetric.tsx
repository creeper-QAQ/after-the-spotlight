import { useEffect, useRef, useState } from 'react';

export function AnimatedMetric({ value }: { value: string | number }) {
  const host = useRef<HTMLBRElement>(null);
  const text = String(value);
  const match = text.match(/\d[\d,]*(?:\.\d+)?/);
  const target = match ? Number(match[0].replaceAll(',', '')) : null;
  const [shown, setShown] = useState(target === null ? text : '0');
  useEffect(() => {
    if (target === null || !host.current) return;
    const node = host.current;
    let frame = 0;
    let observer: IntersectionObserver | undefined;
    const start = () => {
      if (match?.[0].includes('.') && match[0].split('.')[1].length > 0)
        setShown(text.replace(match[0], '0'));
      const began = performance.now();
      const step = (now: number) => {
        const progress = Math.min(1, (now - began) / 850);
        const eased = 1 - Math.pow(1 - progress, 4);
        const amount = target * eased;
        const formatted = match?.[0].includes('.')
          ? amount.toFixed(match[0].split('.')[1].length)
          : Math.round(amount).toLocaleString('en-US');
        setShown(text.replace(match?.[0] || '', formatted));
        if (progress < 1) frame = requestAnimationFrame(step);
      };
      frame = requestAnimationFrame(step);
    };
    if (matchMedia('(prefers-reduced-motion: reduce)').matches) {
      setShown(text);
      return;
    }
    observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          observer?.disconnect();
          start();
        }
      },
      { threshold: 0.35 },
    );
    observer.observe(node);
    return () => {
      observer?.disconnect();
      cancelAnimationFrame(frame);
    };
  }, [target, text]);
  return (
    <b ref={host} aria-label={text}>
      {shown}
    </b>
  );
}
