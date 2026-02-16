import React from 'react';

interface GameResultModalProps {
  open: boolean;
  score: number;
  bestScore: number;
  onRestart: () => void;
}

export function GameResultModal({ open, score, bestScore, onRestart }: GameResultModalProps) {
  if (!open) {
    return null;
  }

  return (
    <div className="pointer-events-none absolute inset-0 flex items-center justify-center bg-slate-900/50 p-4">
      <div className="pointer-events-auto w-full max-w-xs rounded-xl bg-white p-5 shadow-2xl">
        <h3 className="text-lg font-semibold text-slate-900">游戏结束</h3>
        <p className="mt-2 text-sm text-slate-600">当前分数：{score}</p>
        <p className="text-sm text-slate-600">最高分：{bestScore}</p>
        <button
          type="button"
          className="mt-4 w-full rounded-lg bg-cyan-600 px-4 py-2 text-sm font-semibold text-white"
          onClick={onRestart}
        >
          再来一局
        </button>
      </div>
    </div>
  );
}

