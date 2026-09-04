'use client';

import React from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from 'sa2kit/common/ui';
import { CalendarViewType } from '../types';
import { cal, segmentedBtnClass } from '../calendarStyles';

export interface CalendarToolbarProps {
  title: string;
  viewType: CalendarViewType;
  onPrevious: () => void;
  onNext: () => void;
  onToday: () => void;
  onViewTypeChange: (view: CalendarViewType) => void;
}

const VIEW_OPTIONS: { key: CalendarViewType; label: string }[] = [
  { key: CalendarViewType.MONTH, label: '月' },
  { key: CalendarViewType.WEEK, label: '周' },
  { key: CalendarViewType.DAY, label: '日' },
];

export default function CalendarToolbar({
  title,
  viewType,
  onPrevious,
  onNext,
  onToday,
  onViewTypeChange,
}: CalendarToolbarProps) {
  return (
    <div className={`${cal.panel} ${cal.toolbar}`}>
      <div className={cal.toolbarInner}>
        <div className={cal.toolbarTitleRow}>
          <Button
            type="text"
            size="small"
            onClick={onPrevious}
            aria-label="上一段"
          >
            <ChevronLeft className="h-5 w-5" />
          </Button>
          <h2 className={cal.toolbarTitle}>{title}</h2>
          <Button
            type="text"
            size="small"
            onClick={onNext}
            aria-label="下一段"
          >
            <ChevronRight className="h-5 w-5" />
          </Button>
        </div>

        <div className={cal.toolbarActions}>
          <Button type="primary" size="small" onClick={onToday}>
            今天
          </Button>
          <div className={cal.segmented} role="group" aria-label="日历视图">
            {VIEW_OPTIONS.map(({ key, label }) => (
              <button
                key={key}
                type="button"
                onClick={() => onViewTypeChange(key)}
                aria-pressed={viewType === key}
                className={segmentedBtnClass(viewType === key)}
              >
                {label}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
