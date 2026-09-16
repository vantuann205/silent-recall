'use client';

import { useEffect, useRef, type ReactNode } from 'react';
import { LoaderCircle, ScanLine } from 'lucide-react';

export function HomeMotion({ children }: { children: ReactNode }) {
  const root = useRef<HTMLDivElement>(null);
  const canvas = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const element = root.current!;
    const surface = canvas.current!;
    const context = surface.getContext('2d');
    if (!context) {
      element.dataset.backgroundReady = 'true';
      return;
    }
    const preference = matchMedia('(prefers-reduced-motion: reduce)');
    const finePointer = matchMedia('(hover: hover) and (pointer: fine)');
    let targetX = 0;
    let targetY = 0;
    let pointerX = 0;
    let pointerY = 0;
    let frame = 0;
    const targets = element.querySelectorAll(
      '.entry-section .section-head, .entry-link, .privacy-content > *, .protocol-strip > div',
    );
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries)
          if (entry.isIntersecting) {
            entry.target.classList.add('is-revealed');
            observer.unobserve(entry.target);
          }
      },
      { threshold: 0.12 },
    );
    targets.forEach((target) => {
      target.classList.add('scroll-reveal');
      observer.observe(target);
    });
    const draw = () => {
      frame = 0;
      const rect = element.getBoundingClientRect();
      const progress = Math.max(
        0,
        Math.min(1, -rect.top / Math.max(1, rect.height - innerHeight)),
      );
      const reduced = preference.matches;
      if (reduced || !finePointer.matches)
        targetX = targetY = pointerX = pointerY = 0;
      const approach = (value: number, target: number) =>
        Math.abs(target - value) < 0.002
          ? target
          : value + (target - value) * 0.12;
      pointerX = approach(pointerX, targetX);
      pointerY = approach(pointerY, targetY);
      element.dataset.motion = String(!reduced);
      element.style.setProperty(
        '--hero-shift',
        `${reduced ? 0 : Math.min(70, Math.max(0, -rect.top) * 0.12)}px`,
      );
      const width = element.clientWidth;
      const height = innerHeight;
      const dpr = Math.min(devicePixelRatio, 1.5);
      if (
        surface.width !== Math.round(width * dpr) ||
        surface.height !== Math.round(height * dpr)
      ) {
        surface.width = Math.round(width * dpr);
        surface.height = Math.round(height * dpr);
      }
      context.setTransform(dpr, 0, 0, dpr, 0, 0);
      context.clearRect(0, 0, width, height);
      const phase = reduced ? 0 : progress * 2.6;
      context.lineWidth = 1;
      for (let line = 0; line < 30; line++) {
        context.beginPath();
        context.strokeStyle =
          line < 15 ? 'rgba(208,238,143,0.16)' : 'rgba(140,224,228,0.14)';
        for (let step = 0; step <= 70; step++) {
          const t = step / 70;
          const y = height * (1.2 - t * 1.45);
          const influence = Math.exp(
            -Math.pow((y / height - (pointerY + 1) / 2) / 0.3, 2),
          );
          const x =
            width *
              (0.55 + t * 0.24 + Math.sin(t * Math.PI * 1.7 + phase) * 0.22) +
            (line - 15) * Math.max(8, width / 95) +
            pointerX * (35 + influence * 95) +
            pointerY * Math.sin(t * Math.PI) * 35;
          if (step === 0) context.moveTo(x, y);
          else context.lineTo(x, y);
        }
        context.stroke();
      }
      if (pointerX !== targetX || pointerY !== targetY)
        frame = requestAnimationFrame(draw);
    };
    const schedule = () => {
      if (!frame) frame = requestAnimationFrame(draw);
    };
    const pointer = (event: PointerEvent) => {
      if (
        event.pointerType !== 'mouse' ||
        !finePointer.matches ||
        preference.matches
      )
        return;
      targetX = Math.max(
        -1,
        Math.min(1, (event.clientX / element.clientWidth) * 2 - 1),
      );
      targetY = Math.max(
        -1,
        Math.min(1, (event.clientY / innerHeight) * 2 - 1),
      );
      schedule();
    };
    const resetPointer = () => {
      targetX = targetY = 0;
      schedule();
    };
    element.addEventListener('pointermove', pointer, { passive: true });
    element.addEventListener('pointerleave', resetPointer);
    window.addEventListener('blur', resetPointer);
    finePointer.addEventListener('change', resetPointer);
    window.addEventListener('scroll', schedule, { passive: true });
    window.addEventListener('resize', schedule);
    preference.addEventListener('change', schedule);
    const resize = new ResizeObserver(schedule);
    resize.observe(element);
    draw();
    let disposed = false;
    const show = () => {
      if (!disposed) element.dataset.backgroundReady = 'true';
    };
    const fontTimeout = window.setTimeout(show, 8000);
    void document.fonts.ready.then(() => {
      clearTimeout(fontTimeout);
      show();
    });
    return () => {
      disposed = true;
      clearTimeout(fontTimeout);
      cancelAnimationFrame(frame);
      observer.disconnect();
      resize.disconnect();
      element.removeEventListener('pointermove', pointer);
      element.removeEventListener('pointerleave', resetPointer);
      window.removeEventListener('blur', resetPointer);
      finePointer.removeEventListener('change', resetPointer);
      window.removeEventListener('scroll', schedule);
      window.removeEventListener('resize', schedule);
      preference.removeEventListener('change', schedule);
    };
  }, []);
  return (
    <div className="home-motion" ref={root} data-background-ready="false">
      <div
        className="home-loader"
        role="status"
        aria-label="Loading SilentRecall"
      >
        <ScanLine size={28} />
        <span>SilentRecall</span>
        <LoaderCircle className="spin" size={18} />
      </div>
      <div className="flow-background" aria-hidden="true">
        <canvas ref={canvas} />
      </div>
      {children}
      <noscript>
        <style>{`.home-motion > :not(.home-loader) { visibility: visible !important; } .home-loader { display: none !important; } .product-fallback { display: block !important; }`}</style>
      </noscript>
    </div>
  );
}
