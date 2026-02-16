'use client';

import React, { useMemo, useRef } from 'react';
import type { MikuFusionGameCallbacks, MikuFusionGameConfig } from '../types';
import { useMikuFusionGame } from '../hooks/useMikuFusionGame';
import { useResponsiveCanvas } from '../hooks/useResponsiveCanvas';
import { GameCanvas } from './GameCanvas';
import { GameControls } from './GameControls';
import { GameHUD } from './GameHUD';
import { GameResultModal } from './GameResultModal';

export interface MikuFusionGameProps extends Partial<MikuFusionGameConfig>, MikuFusionGameCallbacks {
  className?: string;
  storageKey?: string;
}

export function MikuFusionGame({ className, storageKey, ...options }: MikuFusionGameProps) {
  const containerRef = useRef<HTMLDivElement>(null);
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
  } = useMikuFusionGame({ ...options, storageKey });

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
    </div>
  );
}

