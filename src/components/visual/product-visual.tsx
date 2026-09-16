'use client';

import { useEffect, useRef, useState } from 'react';
import Image from 'next/image';
import {
  Pause,
  Play,
  RotateCcw,
  RotateCw,
  ZoomIn,
  ZoomOut,
  ScanLine,
} from 'lucide-react';
import type { ProductScene } from './product-scene';

export function ProductVisual() {
  const host = useRef<HTMLDivElement>(null);
  const interaction = useRef<HTMLDivElement>(null);
  const scene = useRef<ProductScene | null>(null);
  const [state, setState] = useState<'loading' | 'ready' | 'fallback'>(
    'loading',
  );
  const ready = state === 'ready';
  const [paused, setPaused] = useState(false);

  useEffect(() => {
    let disposed = false;
    let settled = false;
    const fallback = () => {
      if (!disposed) {
        settled = true;
        setState('fallback');
      }
    };
    const timeout = window.setTimeout(fallback, 8000);
    void import('./product-scene')
      .then(({ createProductScene }) => {
        if (disposed || settled || !host.current || !interaction.current)
          return;
        try {
          scene.current = createProductScene(
            host.current,
            interaction.current,
            fallback,
          );
          scene.current.pause(false);
          settled = true;
          clearTimeout(timeout);
          setState('ready');
        } catch {
          clearTimeout(timeout);
          fallback();
        }
      })
      .catch(() => {
        clearTimeout(timeout);
        fallback();
      });
    return () => {
      disposed = true;
      clearTimeout(timeout);
      scene.current?.dispose();
      scene.current = null;
    };
  }, []);

  return (
    <div
      className="product-visual"
      data-state={state}
      data-ready={ready}
      data-paused={paused}
    >
      <Image
        className="product-fallback"
        src="/product-safety.png"
        alt="Product safety equipment"
        width={900}
        height={900}
        sizes="(max-width: 800px) 70vw, 48vw"
        priority
      />
      <div ref={host} className="scene-host" aria-hidden="true" />
      <div ref={interaction} className="scene-interaction" aria-hidden="true" />
      {ready && (
        <div className="scene-controls">
          {[
            {
              label: 'Rotate left',
              icon: RotateCcw,
              method: 'rotate' as const,
              direction: -1,
            },
            {
              label: 'Rotate right',
              icon: RotateCw,
              method: 'rotate' as const,
              direction: 1,
            },
            {
              label: 'Zoom in',
              icon: ZoomIn,
              method: 'zoom' as const,
              direction: 1,
            },
            {
              label: 'Zoom out',
              icon: ZoomOut,
              method: 'zoom' as const,
              direction: -1,
            },
          ].map(({ label, icon: Icon, method, direction }) => (
            <button
              key={label}
              className="icon-tool"
              title={label}
              aria-label={label}
              onClick={() => scene.current?.[method](direction)}
            >
              <Icon size={17} />
            </button>
          ))}
          <button
            className="icon-tool"
            title={paused ? 'Play animation' : 'Pause animation'}
            aria-label={paused ? 'Play animation' : 'Pause animation'}
            onClick={() => {
              scene.current?.pause(!paused);
              setPaused(!paused);
            }}
          >
            {paused ? <Play size={17} /> : <Pause size={17} />}
          </button>
          <button
            className="icon-tool"
            title="Reset product view"
            aria-label="Reset product view"
            onClick={() => scene.current?.reset()}
          >
            <ScanLine size={17} />
          </button>
        </div>
      )}
    </div>
  );
}
