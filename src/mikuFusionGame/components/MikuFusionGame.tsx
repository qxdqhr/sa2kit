'use client';

import React, { useEffect, useMemo, useRef, useState } from 'react';
import { LocalImageMappingPanel } from '../../components/LocalImageMappingPanel';
import type { MikuFusionGameCallbacks, MikuFusionGameConfig, OrbImageMapping } from '../types';
import { useMikuFusionGame } from '../hooks/useMikuFusionGame';
import { useResponsiveCanvas } from '../hooks/useResponsiveCanvas';
import { GameCanvas } from './GameCanvas';
import { GameControls } from './GameControls';
import { GameHUD } from './GameHUD';
import { GameResultModal } from './GameResultModal';

export interface MikuFusionGameProps extends Partial<MikuFusionGameConfig>, MikuFusionGameCallbacks {
  className?: string;
  storageKey?: string;
  orbImageStorageKey?: string;
  enableImageConfigPanel?: boolean;
  presetOrbImageMapping?: OrbImageMapping;
}

export function MikuFusionGame({
  className,
  storageKey,
  orbImageStorageKey = 'sa2kit:mikuFusionGame:orbImages',
  enableImageConfigPanel = true,
  presetOrbImageMapping = {},
  ...options
}: MikuFusionGameProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [orbImageMapping, setOrbImageMapping] = useState<OrbImageMapping>({});
  const [isUserDefineMode] = useState(() => {
    if (typeof window === 'undefined') {
      return false;
    }
    const value = new URLSearchParams(window.location.search).get('userDefine');
    return value === 'true';
  });

  const activeOrbImageMapping = isUserDefineMode ? orbImageMapping : presetOrbImageMapping;
  const {
    canvasRef,
    status,
    score,
    bestScore,
    nextLevel,
    config,
    setAimFromClientX,
    handleDrop,
    togglePause,
    restart,
  } = useMikuFusionGame({ ...options, storageKey, orbImageMapping: activeOrbImageMapping });

  const panelItems = useMemo(
    () =>
      Array.from({ length: config.maxLevel }, (_, index) => ({
        id: String(index + 1),
        label: `M${index + 1}`,
      })),
    [config.maxLevel]
  );

  const panelValue = useMemo<Record<string, string>>(
    () =>
      Object.entries(orbImageMapping).reduce<Record<string, string>>((acc, [key, value]) => {
        if (value) {
          acc[String(key)] = value;
        }
        return acc;
      }, {}),
    [orbImageMapping]
  );

  useEffect(() => {
    if (typeof window === 'undefined') {
      return;
    }
    try {
      const raw = window.localStorage.getItem(orbImageStorageKey);
      if (!raw) {
        setOrbImageMapping({});
        return;
      }
      const parsed = JSON.parse(raw) as Record<string, string>;
      const normalized: OrbImageMapping = {};
      Object.entries(parsed).forEach(([key, value]) => {
        const level = Number(key);
        if (!Number.isNaN(level) && typeof value === 'string' && value) {
          normalized[level] = value;
        }
      });
      setOrbImageMapping(normalized);
    } catch {
      setOrbImageMapping({});
    }
  }, [orbImageStorageKey]);

  const { displayWidth, displayHeight } = useResponsiveCanvas(
    config.width,
    config.height,
    containerRef
  );

  const statusText = useMemo(() => {
    if (status === 'ready') {
      return '待开始';
    }
    if (status === 'playing') {
      return '进行中';
    }
    if (status === 'paused') {
      return '已暂停';
    }
    return '已结束';
  }, [status]);

  const handlePointerMove = (event: React.PointerEvent<HTMLCanvasElement>) => {
    const rect = event.currentTarget.getBoundingClientRect();
    setAimFromClientX(event.clientX, rect);
  };

  const handlePointerDown = (event: React.PointerEvent<HTMLCanvasElement>) => {
    event.currentTarget.setPointerCapture(event.pointerId);
    const rect = event.currentTarget.getBoundingClientRect();
    setAimFromClientX(event.clientX, rect);
  };

  const handlePointerUp = (event: React.PointerEvent<HTMLCanvasElement>) => {
    const rect = event.currentTarget.getBoundingClientRect();
    handleDrop(event.clientX, rect);
    event.currentTarget.releasePointerCapture(event.pointerId);
  };

  const handleKeyDown = (event: React.KeyboardEvent<HTMLDivElement>) => {
    if (event.key.toLowerCase() === 'r') {
      restart();
    }
    if (event.key.toLowerCase() === 'p') {
      togglePause();
    }
  };

  const handlePanelValueChange = (next: Record<string, string>) => {
    const normalized: OrbImageMapping = {};
    Object.entries(next).forEach(([key, value]) => {
      const level = Number(key);
      if (!Number.isNaN(level) && value) {
        normalized[level] = value;
      }
    });
    setOrbImageMapping(normalized);
  };

  return (
    <div
      ref={containerRef}
      tabIndex={0}
      onKeyDown={handleKeyDown}
      className={`relative mx-auto flex w-full max-w-xl flex-col gap-3 p-3 md:p-4 ${className || ''}`}
      style={{
        paddingBottom: 'max(0.75rem, env(safe-area-inset-bottom))',
      }}
    >
      <GameHUD score={score} bestScore={bestScore} nextLevel={nextLevel} statusText={statusText} />

      <div className="relative mx-auto">
        <GameCanvas
          canvasRef={canvasRef}
          width={config.width}
          height={config.height}
          displayWidth={displayWidth}
          displayHeight={displayHeight}
          onPointerMove={handlePointerMove}
          onPointerDown={handlePointerDown}
          onPointerUp={handlePointerUp}
        />
        <GameResultModal open={status === 'gameOver'} score={score} bestScore={bestScore} onRestart={restart} />
      </div>

      <GameControls
        isPaused={status === 'paused'}
        isPlaying={status === 'playing' || status === 'paused'}
        onTogglePause={togglePause}
        onRestart={restart}
      />

      {enableImageConfigPanel && isUserDefineMode ? (
        <LocalImageMappingPanel
          storageKey={orbImageStorageKey}
          title="球体图片配置（保存到本地）"
          items={panelItems}
          defaultValue={panelValue}
          onValueChange={handlePanelValueChange}
        />
      ) : null}
    </div>
  );
}
