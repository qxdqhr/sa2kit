import React from 'react';

interface GameControlsProps {
  isPaused: boolean;
  isPlaying: boolean;
  onTogglePause: () => void;
  onRestart: () => void;
}

export function GameControls({ isPaused, isPlaying, onTogglePause, onRestart }: GameControlsProps) {
  return (
    <div className="grid grid-cols-2 gap-2">
      <button
        type="button"
        className="rounded-lg bg-cyan-600 px-4 py-3 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-50"
        onClick={onTogglePause}
        disabled={!isPlaying}
      >
        {isPaused ? '继续' : '暂停'}
      </button>
      <button
        type="button"
        className="rounded-lg bg-emerald-600 px-4 py-3 text-sm font-semibold text-white"
        onClick={onRestart}
      >
        重开
      </button>
    </div>
  );
}

