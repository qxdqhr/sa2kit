'use client';

import React from 'react';
export type TimelineItem = {
  date: string;
  title: string;
  description: string;
};

export type TimelineConfig = {
  items: TimelineItem[];
};

type TimelineProps = {
  items?: TimelineItem[];
};

/** 动森风格时间线 */
export function Timeline({ items = [] }: TimelineProps) {
  if (!items.length) return null;

  return (
    <div className="relative">
      <div className="absolute bottom-0 left-4 top-0 w-0.5 bg-[var(--sa2-border-light,#e8e2d6)]" />
      {items.map((item, index) => (
        <div key={`${item.date}-${item.title}-${index}`} className="relative pb-8 pl-12">
          <div className="absolute left-0 flex h-8 w-8 items-center justify-center rounded-full border-4 border-[var(--sa2-bg,#f8f8f0)] bg-[var(--sa2-primary,#19c8b9)] shadow-md">
            <div className="h-2 w-2 rounded-full bg-white" />
          </div>
          <div className="rounded-[18px] border-2 border-[var(--sa2-border-light,#e8e2d6)] bg-[var(--sa2-bg-panel,#fff)] p-4 shadow-sm">
            <div className="mb-2 text-sm text-[var(--sa2-text-secondary,#9f927d)]">{item.date}</div>
            <h4 className="mb-2 text-lg font-semibold text-[var(--sa2-text,#794f27)]">{item.title}</h4>
            <p className="m-0 text-[var(--sa2-text-body,#725d42)]">{item.description}</p>
          </div>
        </div>
      ))}
    </div>
  );
}

export default Timeline;
