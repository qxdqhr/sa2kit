'use client';

import React from 'react';

import type { CheckinHeatmapDay } from '../../../../domain/types';

const WEEKDAY_LABELS = ['一', '二', '三', '四', '五', '六', '日'];

function levelClass(score: number) {
  if (score >= 4) return 'is-l4';
  if (score >= 3) return 'is-l3';
  if (score >= 2) return 'is-l2';
  if (score >= 1) return 'is-l1';
  return 'is-l0';
}

interface CheckinHeatmapProps {
  days: CheckinHeatmapDay[];
}

export function CheckinHeatmap({ days }: CheckinHeatmapProps) {
  const weeks: CheckinHeatmapDay[][] = [];
  for (let index = 0; index < days.length; index += 7) {
    weeks.push(days.slice(index, index + 7));
  }

  return (
    <div className="fp-heatmap">
      <div className="fp-heatmap__labels" aria-hidden>
        {WEEKDAY_LABELS.map((label) => (
          <span key={label}>{label}</span>
        ))}
      </div>
      <div className="fp-heatmap__grid">
        {weeks.map((week, weekIndex) => (
          <div key={weekIndex} className="fp-heatmap__week">
            {week.map((day) => (
              <span
                key={day.date}
                className={`fp-heatmap__cell ${levelClass(day.score)}`}
                title={`${day.date} · ${day.score}/4 项完成`}
              />
            ))}
          </div>
        ))}
      </div>
      <div className="fp-heatmap__legend">
        <span>少</span>
        <span className="fp-heatmap__cell is-l0" />
        <span className="fp-heatmap__cell is-l1" />
        <span className="fp-heatmap__cell is-l2" />
        <span className="fp-heatmap__cell is-l3" />
        <span className="fp-heatmap__cell is-l4" />
        <span>多</span>
      </div>
    </div>
  );
}
