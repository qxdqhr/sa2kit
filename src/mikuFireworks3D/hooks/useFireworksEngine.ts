'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { FireworksEngine } from '../engine/FireworksEngine';
import type { FireworkEngineOptions, FireworkLaunchPayload } from '../types';

export interface UseFireworksEngineOptions extends FireworkEngineOptions {
  onLaunch?: (payload: FireworkLaunchPayload) => void;
}

export function useFireworksEngine(options?: UseFireworksEngineOptions) {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const engineRef = useRef<FireworksEngine | null>(null);
  const [fps, setFps] = useState(60);
  const { maxParticles, maxActiveFireworks, onError, onFpsReport, onLaunch } = options || {};

  useEffect(() => {
    if (!containerRef.current || !canvasRef.current) {
      return;
    }

    const engine = new FireworksEngine({
      container: containerRef.current,
      canvas: canvasRef.current,
      options: {
        maxParticles,
        maxActiveFireworks,
        onError,
        onFpsReport: (nextFps) => {
          setFps(nextFps);
          onFpsReport?.(nextFps);
        },
      },
    });

    engine.start();
    engineRef.current = engine;

    return () => {
      engineRef.current?.dispose();
      engineRef.current = null;
    };
  }, [maxParticles, maxActiveFireworks, onError, onFpsReport]);

  const launch = useCallback(
    (payload: FireworkLaunchPayload) => {
      void engineRef.current?.launch(payload);
      onLaunch?.(payload);
    },
    [onLaunch]
  );

  const api = useMemo(
    () => ({
      containerRef,
      canvasRef,
      launch,
      fps,
    }),
    [fps, launch]
  );

  return api;
}
