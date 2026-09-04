'use client';

import React from 'react';

import { ChevronDown, ChevronLeft, ChevronRight, ChevronUp } from 'lucide-react';
import { cn } from '../utils/cn';
import {
  isVerticalReaderPosition,
  type LessonReaderBarPosition,
} from '../utils/lessonReaderSettings';
import {
  thLessonProgress,
  thLessonProgressCollapsed,
  thLessonProgressFloatCollapsed,
  thLessonProgressFloatExpanded,
  thLessonProgressLabel,
  thLessonProgressPercent,
  thLessonProgressRow,
  thLessonProgressShellHorizontal,
  thLessonProgressSlider,
  thLessonProgressSliderVertical,
  thLessonProgressToggle,
} from '../styles/tw';

type LessonReadingProgressProps = {
  position: LessonReaderBarPosition;
  expanded: boolean;
  percent: number;
  onPercentChange: (value: number) => void;
  onDragEnd: () => void;
  onExpandedChange: (expanded: boolean) => void;
};

function ToggleIcon({ position, expanded }: { position: LessonReaderBarPosition; expanded: boolean }) {
  if (position === 'top') {
    return expanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />;
  }
  if (position === 'bottom') {
    return expanded ? <ChevronDown className="h-4 w-4" /> : <ChevronUp className="h-4 w-4" />;
  }
  if (position === 'left') {
    return expanded ? <ChevronLeft className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />;
  }
  return expanded ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />;
}

export function LessonReadingProgress({
  position,
  expanded,
  percent,
  onPercentChange,
  onDragEnd,
  onExpandedChange,
}: LessonReadingProgressProps) {
  const vertical = isVerticalReaderPosition(position);

  const handleExpand = () => {
    onDragEnd();
    onExpandedChange(true);
  };

  const handleCollapse = () => {
    onDragEnd();
    onExpandedChange(false);
  };

  if (vertical && !expanded) {
    return (
      <div className={thLessonProgressFloatCollapsed} aria-label="阅读进度（已收起）">
        <span className="text-[0.62rem] font-semibold leading-none text-[#3d3428]">
          {Math.round(percent)}%
        </span>
        <button
          type="button"
          className={cn(thLessonProgressToggle, 'h-6 w-6')}
          aria-label="展开阅读进度条"
          onClick={handleExpand}
        >
          <ToggleIcon position={position} expanded={false} />
        </button>
      </div>
    );
  }

  if (!expanded) {
    return (
      <div
        className={cn(
          thLessonProgressCollapsed,
          position === 'top' && 'border-b',
          position === 'bottom' && 'border-t',
        )}
        aria-label="阅读进度（已收起）"
      >
        <span className={thLessonProgressPercent}>{percent.toFixed(1)}%</span>
        <button
          type="button"
          className={thLessonProgressToggle}
          aria-label="展开阅读进度条"
          onClick={handleExpand}
        >
          <ToggleIcon position={position} expanded={false} />
        </button>
      </div>
    );
  }

  const slider = (
    <input
      type="range"
      min={0}
      max={100}
      step={0.1}
      value={percent}
      className={vertical ? thLessonProgressSliderVertical : thLessonProgressSlider}
      aria-label="拖动调整阅读位置"
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={Math.round(percent)}
      aria-valuetext={`已阅读 ${percent.toFixed(1)}%`}
      onChange={(e) => onPercentChange(Number(e.target.value))}
      onPointerUp={onDragEnd}
      onPointerCancel={onDragEnd}
      onKeyUp={onDragEnd}
    />
  );

  if (vertical) {
    return (
      <div className={thLessonProgressFloatExpanded} aria-label="阅读进度">
        <button
          type="button"
          className={thLessonProgressToggle}
          aria-label="收起阅读进度条"
          onClick={handleCollapse}
        >
          <ToggleIcon position={position} expanded />
        </button>
        <span className={cn(thLessonProgressPercent, 'text-base')}>{percent.toFixed(1)}%</span>
        <span className={cn(thLessonProgressLabel, 'text-[0.65rem] [writing-mode:vertical-rl]')}>
          阅读进度
        </span>
        {slider}
      </div>
    );
  }

  return (
    <div
      className={cn(thLessonProgress, thLessonProgressShellHorizontal)}
      aria-label="阅读进度"
    >
      <div className={thLessonProgressRow}>
        <span className={thLessonProgressLabel}>阅读进度</span>
        <div className="flex items-center gap-2">
          <span className={thLessonProgressPercent}>{percent.toFixed(1)}%</span>
          <button
            type="button"
            className={thLessonProgressToggle}
            aria-label="收起阅读进度条"
            onClick={handleCollapse}
          >
            <ToggleIcon position={position} expanded />
          </button>
        </div>
      </div>
      {slider}
    </div>
  );
}
