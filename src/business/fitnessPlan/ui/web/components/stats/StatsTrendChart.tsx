'use client';

import React from 'react';

import type { StatsTrendPoint } from '../../../../domain/types';

interface StatsTrendChartProps {
  trends: StatsTrendPoint[];
  maxBars?: number;
}

function pickRecentPoints(trends: StatsTrendPoint[], maxBars: number) {
  if (trends.length <= maxBars) return trends;
  return trends.slice(trends.length - maxBars);
}

function formatShortDate(dateKey: string) {
  const [, month, day] = dateKey.split('-');
  return `${Number(month)}/${Number(day)}`;
}

export function StatsTrendChart({ trends, maxBars = 14 }: StatsTrendChartProps) {
  const points = pickRecentPoints(trends, maxBars);
  const maxVolume = Math.max(...points.map((point) => point.workoutVolume), 1);
  const maxCalories = Math.max(...points.map((point) => point.dietCalories), 1);

  if (points.length === 0) {
    return <p className="fp-state-card">暂无趋势数据</p>;
  }

  return (
    <div className="fp-stats-chart">
      <div className="fp-stats-chart__legend">
        <span className="fp-stats-chart__key fp-stats-chart__key--volume">训练容量</span>
        <span className="fp-stats-chart__key fp-stats-chart__key--diet">饮食热量</span>
      </div>
      <div className="fp-stats-chart__bars">
        {points.map((point) => (
          <div key={point.date} className="fp-stats-chart__col" title={point.date}>
            <div className="fp-stats-chart__pair">
              <div
                className="fp-stats-chart__bar fp-stats-chart__bar--volume"
                style={{ height: `${Math.max(6, (point.workoutVolume / maxVolume) * 100)}%` }}
              />
              <div
                className="fp-stats-chart__bar fp-stats-chart__bar--diet"
                style={{ height: `${Math.max(6, (point.dietCalories / maxCalories) * 100)}%` }}
              />
            </div>
            <span className="fp-stats-chart__label">{formatShortDate(point.date)}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
