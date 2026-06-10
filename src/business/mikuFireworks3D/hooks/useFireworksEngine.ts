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
  const pendingLaunchesRef = useRef<FireworkLaunchPayload[]>([]);
  const [fps, setFps] = useState(60);
  const [engineReady, setEngineReady] = useState(false);
  const [pendingLaunchCount, setPendingLaunchCount] = useState(0);
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
    setEngineReady(true);
    if (pendingLaunchesRef.current.length > 0) {
      const pending = [...pendingLaunchesRef.current];
      pendingLaunchesRef.current = [];
      setPendingLaunchCount(0);
      pending.forEach((payload) => {
        void engine.launch(payload);
      });
    }

    return () => {
      engineRef.current?.dispose();
      engineRef.current = null;
      pendingLaunchesRef.current = [];
      setPendingLaunchCount(0);
      setEngineReady(false);
    };
  }, [maxParticles, maxActiveFireworks, onError, onFpsReport]);

  const launch = useCallback(
    (payload: FireworkLaunchPayload) => {
      if (!engineRef.current) {
        pendingLaunchesRef.current.push(payload);
        if (pendingLaunchesRef.current.length > 120) {
          pendingLaunchesRef.current.splice(0, pendingLaunchesRef.current.length - 120);
        }
        setPendingLaunchCount(pendingLaunchesRef.current.length);
      } else {
        void engineRef.current.launch(payload);
      }
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
      engineReady,
      pendingLaunchCount,
    }),
    [engineReady, fps, launch, pendingLaunchCount]
  );

  return api;
}
