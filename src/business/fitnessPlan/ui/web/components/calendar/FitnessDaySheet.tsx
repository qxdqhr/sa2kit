'use client';

import React from 'react';

import Link from 'next/link';
import { Button, Card, Select } from 'sa2kit/common/ui';
import type { ScheduleDayInfo, WorkoutPlanRecord } from '../../../../domain/types';
import { formatCalendarDate, isToday } from '../../../../domain/utils/calendarDateUtils';

interface FitnessDaySheetProps {
  open: boolean;
  date: Date | null;
  dayInfo?: ScheduleDayInfo;
  plans: WorkoutPlanRecord[];
  selectedPlanId: string;
  isRest: boolean;
  saving: boolean;
  onClose: () => void;
  onPlanChange: (planId: string) => void;
  onRestChange: (isRest: boolean) => void;
  onSave: () => void;
  onClearOverride: () => void;
}

export function FitnessDaySheet({
  open,
  date,
  dayInfo,
  plans,
  selectedPlanId,
  isRest,
  saving,
  onClose,
  onPlanChange,
  onRestChange,
  onSave,
  onClearOverride,
}: FitnessDaySheetProps) {
  if (!open || !date) return null;

  const title = date.toLocaleDateString('zh-CN', {
    month: 'long',
    day: 'numeric',
    weekday: 'short',
  });

  const planOptions = [
    { key: 'none', label: '不指定计划' },
    ...plans.map((plan) => ({ key: String(plan.id), label: plan.name })),
  ];

  return (
    <>
      <button type="button" className="fp-day-sheet-backdrop" aria-label="关闭" onClick={onClose} />
      <Card className="fp-day-sheet" pattern="app-orange">
        <div className="fp-day-sheet__head">
          <div>
            <p className="fp-day-sheet__eyebrow">
              {isToday(date) ? '今天' : formatCalendarDate(date)}
            </p>
            <h3 className="fp-day-sheet__title">{title}</h3>
          </div>
          <Button type="text" onClick={onClose}>
            关闭
          </Button>
        </div>

        <div className="fp-day-sheet__status">
          <p>
            当前：
            {dayInfo?.isRest
              ? '休息日'
              : dayInfo?.planName
                ? dayInfo.planName
                : '未安排'}
            {dayInfo?.isOverride ? '（单日覆盖）' : '（周循环）'}
          </p>
          {dayInfo ? (
            <div className="fp-cal-cell__badges">
              {dayInfo.badges.daily ? <span>🔥 已打卡</span> : null}
              {dayInfo.badges.workout ? <span>✓ 训练</span> : null}
              {dayInfo.badges.diet ? <span>🍽 饮食</span> : null}
            </div>
          ) : null}
        </div>

        <label className="fp-field">
          <span>单日安排</span>
          <Select
            value={isRest ? 'rest' : selectedPlanId}
            onChange={(key: string) => {
              if (key === 'rest') {
                onRestChange(true);
                return;
              }
              onRestChange(false);
              onPlanChange(key);
            }}
            options={[
              { key: 'rest', label: '休息日' },
              ...planOptions.filter((item) => item.key !== 'none'),
            ]}
          />
        </label>

        <div className="fp-day-sheet__actions">
          <Button type="primary" loading={saving} onClick={onSave}>
            保存单日安排
          </Button>
          {dayInfo?.isOverride ? (
            <Button type="dashed" onClick={onClearOverride}>
              恢复周循环
            </Button>
          ) : null}
          {dayInfo?.planId && !dayInfo.isRest ? (
            <Link href={`/plans/${dayInfo.planId}`}>
              <Button type="default">查看计划</Button>
            </Link>
          ) : null}
        </div>
      </Card>
    </>
  );
}
