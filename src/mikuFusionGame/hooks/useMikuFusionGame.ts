'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import type { RefObject } from 'react';
import { useLocalStorage } from '../../storage/hooks/useLocalStorage';
import { DEFAULT_MIKU_FUSION_CONFIG, LEVEL_LABEL_PREFIX } from '../constants';
import { resolveCircleCollisions } from '../engine/collision';
import { mergeSameLevelOrbs } from '../engine/merge';
import { getRadiusByLevel, stepPhysics } from '../engine/physics';
import { canTransition } from '../engine/stateMachine';
import type {
  FusionOrb,
  MikuFusionGameCallbacks,
  MikuFusionGameConfig,
  MikuFusionGameStatus,
  OrbImageMapping,
} from '../types';

export interface UseMikuFusionGameOptions extends Partial<MikuFusionGameConfig>, MikuFusionGameCallbacks {
  storageKey?: string;
  orbImageMapping?: OrbImageMapping;
}

export interface UseMikuFusionGameResult {
  canvasRef: RefObject<HTMLCanvasElement>;
  status: MikuFusionGameStatus;
  score: number;
  bestScore: number;
  nextLevel: number;
  config: MikuFusionGameConfig;
  setAimFromClientX: (clientX: number, rect: DOMRect) => void;
  handleDrop: (clientX: number, rect: DOMRect) => void;
  togglePause: () => void;
  restart: () => void;
}

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

function nextOrbLevel(weights: number[]): number {
  const random = Math.random();
  let cumulative = 0;

  for (let i = 0; i < weights.length; i += 1) {
    cumulative += weights[i] ?? 0;
    if (random <= cumulative) {
      return i + 1;
    }
  }

  return Math.max(1, weights.length);
}

function getOrbColor(level: number, config: MikuFusionGameConfig): string {
  const index = Math.max(0, Math.min(config.theme.orbColors.length - 1, level - 1));
  return config.theme.orbColors[index] || '#22d3ee';
}

function drawScene(
  context: CanvasRenderingContext2D,
  width: number,
  height: number,
  config: MikuFusionGameConfig,
  orbs: FusionOrb[],
  aimX: number,
  nextLevel: number,
  status: MikuFusionGameStatus,
  imageCache: Record<number, HTMLImageElement>
): void {
  const gradient = context.createLinearGradient(0, 0, 0, height);
  gradient.addColorStop(0, config.theme.backgroundTop);
  gradient.addColorStop(1, config.theme.backgroundBottom);
  context.fillStyle = gradient;
  context.fillRect(0, 0, width, height);

  context.lineWidth = 2;
  context.strokeStyle = config.theme.lossLine;
  context.setLineDash([6, 6]);
  context.beginPath();
  context.moveTo(0, config.lossLineY);
  context.lineTo(width, config.lossLineY);
  context.stroke();
  context.setLineDash([]);

  context.strokeStyle = config.theme.aimLine;
  context.lineWidth = 1.5;
  context.beginPath();
  context.moveTo(aimX, 0);
  context.lineTo(aimX, config.spawnY);
  context.stroke();

  const previewRadius = getRadiusByLevel(nextLevel);
  const previewY = config.spawnY - previewRadius - 4;
  const previewImage = imageCache[nextLevel];
  context.beginPath();
  context.arc(aimX, previewY, previewRadius, 0, Math.PI * 2);
  context.closePath();
  if (previewImage && previewImage.complete && previewImage.naturalWidth > 0) {
    context.save();
    context.clip();
    context.drawImage(
      previewImage,
      aimX - previewRadius,
      previewY - previewRadius,
      previewRadius * 2,
      previewRadius * 2
    );
    context.restore();
  } else {
    context.fillStyle = getOrbColor(nextLevel, config);
    context.fill();
  }

  orbs.forEach((orb) => {
    context.beginPath();
    context.arc(orb.x, orb.y, orb.radius, 0, Math.PI * 2);
    context.closePath();

    const orbImage = imageCache[orb.level];
    if (orbImage && orbImage.complete && orbImage.naturalWidth > 0) {
      context.save();
      context.clip();
      context.drawImage(
        orbImage,
        orb.x - orb.radius,
        orb.y - orb.radius,
        orb.radius * 2,
        orb.radius * 2
      );
      context.restore();
      context.beginPath();
      context.strokeStyle = 'rgba(15, 23, 42, 0.15)';
      context.lineWidth = 1;
      context.arc(orb.x, orb.y, orb.radius, 0, Math.PI * 2);
      context.stroke();
    } else {
      context.fillStyle = getOrbColor(orb.level, config);
      context.fill();
    }

    context.fillStyle = '#0f172a';
    context.font = 'bold 12px system-ui';
    context.textAlign = 'center';
    context.textBaseline = 'middle';
    context.fillText(`${LEVEL_LABEL_PREFIX}${orb.level}`, orb.x, orb.y);
  });

  if (status === 'paused') {
    context.fillStyle = 'rgba(15, 23, 42, 0.5)';
    context.fillRect(0, 0, width, height);
    context.fillStyle = '#ffffff';
    context.font = 'bold 30px system-ui';
    context.textAlign = 'center';
    context.fillText('Paused', width / 2, height / 2);
  }
}

function normalizeConfig(config?: Partial<MikuFusionGameConfig>): MikuFusionGameConfig {
  const mergedTheme = {
    ...DEFAULT_MIKU_FUSION_CONFIG.theme,
    ...(config?.theme ?? {}),
  };

  const merged = {
    ...DEFAULT_MIKU_FUSION_CONFIG,
    ...(config ?? {}),
    theme: mergedTheme,
  };

  const totalWeight = merged.spawnWeights.reduce((sum, current) => sum + current, 0);
  if (totalWeight <= 0) {
    merged.spawnWeights = [...DEFAULT_MIKU_FUSION_CONFIG.spawnWeights];
  } else if (Math.abs(totalWeight - 1) > 0.001) {
    merged.spawnWeights = merged.spawnWeights.map((weight) => weight / totalWeight);
  }

  return merged;
}

export function useMikuFusionGame(options: UseMikuFusionGameOptions = {}): UseMikuFusionGameResult {
  const configRef = useRef<MikuFusionGameConfig>(normalizeConfig(options));
  const config = configRef.current;
  const onScoreChangeRef = useRef(options.onScoreChange);
  const onGameOverRef = useRef(options.onGameOver);
  const orbImageMappingRef = useRef<OrbImageMapping>(options.orbImageMapping ?? {});
  const imageCacheRef = useRef<Record<number, HTMLImageElement>>({});

  useEffect(() => {
    onScoreChangeRef.current = options.onScoreChange;
    onGameOverRef.current = options.onGameOver;
  }, [options.onGameOver, options.onScoreChange]);

  useEffect(() => {
    orbImageMappingRef.current = options.orbImageMapping ?? {};
    const nextCache: Record<number, HTMLImageElement> = {};
    Object.entries(orbImageMappingRef.current).forEach(([levelText, src]) => {
      const level = Number(levelText);
      if (!src || Number.isNaN(level)) {
        return;
      }
      const image = new window.Image();
      image.src = src;
      nextCache[level] = image;
    });
    imageCacheRef.current = nextCache;
  }, [options.orbImageMapping]);

  const [bestScore, setBestScore] = useLocalStorage<number>(
    options.storageKey || 'sa2kit:mikuFusionGame:bestScore',
    0
  );

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rafRef = useRef<number | null>(null);
  const lastTsRef = useRef<number>(0);
  const idRef = useRef<number>(0);
  const orbsRef = useRef<FusionOrb[]>([]);
  const aimXRef = useRef<number>(config.width / 2);
  const scoreRef = useRef<number>(0);

  const [status, setStatus] = useState<MikuFusionGameStatus>('ready');
  const [score, setScore] = useState(0);
  const [nextLevel, setNextLevel] = useState(() => nextOrbLevel(config.spawnWeights));

  const draw = useCallback(
    (nextStatus: MikuFusionGameStatus = status) => {
      const canvas = canvasRef.current;
      if (!canvas) {
        return;
      }

      const context = canvas.getContext('2d');
      if (!context) {
        return;
      }

      drawScene(
        context,
        config.width,
        config.height,
        config,
        orbsRef.current,
        aimXRef.current,
        nextLevel,
        nextStatus,
        imageCacheRef.current
      );
    },
    [config, nextLevel, status]
  );

  const transitionStatus = useCallback((nextStatus: MikuFusionGameStatus) => {
    setStatus((previous) => (canTransition(previous, nextStatus) ? nextStatus : previous));
  }, []);

  const spawnOrb = useCallback(() => {
    if (status === 'paused' || status === 'gameOver') {
      return;
    }

    if (status === 'ready') {
      transitionStatus('playing');
    }

    idRef.current += 1;
    const radius = getRadiusByLevel(nextLevel);
    const x = clamp(aimXRef.current, radius, config.width - radius);
    const created: FusionOrb = {
      id: `${idRef.current}`,
      x,
      y: config.spawnY,
      vx: 0,
      vy: 0,
      radius,
      level: nextLevel,
      age: 0,
    };

    const nextOrbs = orbsRef.current.concat(created);
    orbsRef.current = nextOrbs.slice(-config.maxOrbs);

    setNextLevel(nextOrbLevel(config.spawnWeights));
  }, [config, nextLevel, status, transitionStatus]);

  const restart = useCallback(() => {
    orbsRef.current = [];
    scoreRef.current = 0;
    setScore(0);
    setNextLevel(nextOrbLevel(config.spawnWeights));
    transitionStatus('ready');
    draw('ready');
  }, [config.spawnWeights, draw, transitionStatus]);

  const togglePause = useCallback(() => {
    setStatus((previous) => {
      if (previous === 'playing' && canTransition(previous, 'paused')) {
        return 'paused';
      }
      if (previous === 'paused' && canTransition(previous, 'playing')) {
        return 'playing';
      }
      return previous;
    });
  }, []);

  const setAimFromClientX = useCallback((clientX: number, rect: DOMRect) => {
    const ratio = config.width / rect.width;
    const x = (clientX - rect.left) * ratio;
    aimXRef.current = clamp(x, 0, config.width);
  }, [config.width]);

  const handleDrop = useCallback(
    (clientX: number, rect: DOMRect) => {
      setAimFromClientX(clientX, rect);
      spawnOrb();
    },
    [setAimFromClientX, spawnOrb]
  );

  useEffect(() => {
    draw(status);
  }, [draw, status]);

  useEffect(() => {
    if (status !== 'playing') {
      if (rafRef.current) {
        window.cancelAnimationFrame(rafRef.current);
      }
      lastTsRef.current = 0;
      draw(status);
      return;
    }

    const frame = (timestamp: number) => {
      if (lastTsRef.current === 0) {
        lastTsRef.current = timestamp;
      }

      const dt = Math.min((timestamp - lastTsRef.current) / 1000, 0.033);
      lastTsRef.current = timestamp;

      let orbs = stepPhysics(orbsRef.current, config, dt);
      orbs = resolveCircleCollisions(orbs, config);

      const merged = mergeSameLevelOrbs(orbs, config);
      orbs = merged.orbs;
      orbsRef.current = orbs.slice(-config.maxOrbs);

      if (merged.scoreGain > 0) {
        scoreRef.current += merged.scoreGain;
        setScore(scoreRef.current);
        onScoreChangeRef.current?.(scoreRef.current);
      }

      const gameOver = orbs.some(
        (orb) =>
          orb.age > config.gameOverAgeThreshold &&
          orb.y - orb.radius <= config.lossLineY &&
          Math.abs(orb.vy) < 90
      );

      if (gameOver) {
        transitionStatus('gameOver');
        const latestBest = Math.max(bestScore, scoreRef.current);
        if (latestBest !== bestScore) {
          setBestScore(latestBest);
        }
        onGameOverRef.current?.(scoreRef.current, latestBest);
        draw('gameOver');
        return;
      }

      draw('playing');
      rafRef.current = window.requestAnimationFrame(frame);
    };

    rafRef.current = window.requestAnimationFrame(frame);

    return () => {
      if (rafRef.current) {
        window.cancelAnimationFrame(rafRef.current);
      }
    };
  }, [
    bestScore,
    config,
    draw,
    setBestScore,
    status,
    transitionStatus,
  ]);

  useEffect(() => {
    if (score > bestScore) {
      setBestScore(score);
    }
  }, [bestScore, score, setBestScore]);

  return {
    canvasRef,
    status,
    score,
    bestScore: Math.max(bestScore, score),
    nextLevel,
    config,
    setAimFromClientX,
    handleDrop,
    togglePause,
    restart,
  };
}
