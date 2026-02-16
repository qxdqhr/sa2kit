import React from 'react';

interface GameHUDProps {
  score: number;
  bestScore: number;
  nextLevel: number;
  statusText: string;
}

export function GameHUD({ score, bestScore, nextLevel, statusText }: GameHUDProps) {
  return (
    <div className="flex items-center justify-between gap-2 rounded-lg border border-cyan-200 bg-white/80 p-3">
      <div className="min-w-0">
        <div className="text-xs text-slate-500">当前分数</div>
        <div className="text-xl font-bold text-cyan-700">{score}</div>
        <div className="text-xs text-slate-500">最高分 {bestScore}</div>
      </div>
      <div className="text-right">
        <div className="text-xs text-slate-500">下一个</div>
        <div className="text-base font-semibold text-emerald-700">M{nextLevel}</div>
        <div className="text-xs font-medium text-slate-600">{statusText}</div>
      </div>
    </div>
  );
}

