'use client';

import React, { useCallback, useEffect, useMemo, useState, type ChangeEvent } from 'react';
import { Button, Card, Select, Title } from 'sa2kit/common/ui';
import { FitnessDaySheet } from '../components/calendar/FitnessDaySheet';
import { FitnessMonthView } from '../components/calendar/FitnessMonthView';
import { fitnessPlanClient } from '../services/fitnessPlanClient';
import { useFitnessPlanStore } from '../store/fitnessPlanStore';
import type {
  MonthSchedulePayload,
  WeekDayKey,
  WorkoutPlanRecord,
} from '../../../domain/types';
import { WEEK_DAY_KEYS, WEEK_DAY_LABELS } from '../../../domain/types';
import {
  formatCalendarDate,
  formatMonthTitle,
  shiftMonth,
} from '../../../domain/utils/calendarDateUtils';

export function SchedulePage() {
  const selectedDate = useFitnessPlanStore((s) => s.ui.selectedDate);
  const setSelectedDate = useFitnessPlanStore((s) => s.setSelectedDate);
  const scheduleViewMonth = useFitnessPlanStore((s) => s.scheduleViewMonth);
  const setScheduleViewMonth = useFitnessPlanStore((s) => s.setScheduleViewMonth);

  const [monthData, setMonthData] = useState<MonthSchedulePayload | null>(null);
  const [plans, setPlans] = useState<WorkoutPlanRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [savingTemplate, setSavingTemplate] = useState(false);
  const [savingDay, setSavingDay] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [sheetDate, setSheetDate] = useState<Date | null>(null);
  const [sheetPlanId, setSheetPlanId] = useState('none');
  const [sheetRest, setSheetRest] = useState(false);
  const [weekPatternDraft, setWeekPatternDraft] = useState<
    Record<WeekDayKey, string>
  >({
    mon: 'none',
    tue: 'none',
    wed: 'none',
    thu: 'none',
    fri: 'none',
    sat: 'none',
    sun: 'none',
  });
  const [cycleWeeks, setCycleWeeks] = useState(4);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [schedule, planList] = await Promise.all([
        fitnessPlanClient.getMonthSchedule(scheduleViewMonth),
        fitnessPlanClient.listPlans('active'),
      ]);
      setMonthData(schedule);
      setPlans(planList);

      const draft = {} as Record<WeekDayKey, string>;
      for (const key of WEEK_DAY_KEYS) {
        const value = schedule.template.weekPattern[key];
        if (value === 'rest') draft[key] = 'rest';
        else if (typeof value === 'number') draft[key] = String(value);
        else draft[key] = 'none';
      }
      setWeekPatternDraft(draft);
      setCycleWeeks(schedule.template.cycleWeeks);
    } catch (err) {
      setError(err instanceof Error ? err.message : '加载失败');
    } finally {
      setLoading(false);
    }
  }, [scheduleViewMonth]);

  useEffect(() => {
    void load();
  }, [load]);

  const planOptions = useMemo(
    () => [
      { key: 'none', label: '未安排' },
      { key: 'rest', label: '休息' },
      ...plans.map((plan) => ({ key: String(plan.id), label: plan.name })),
    ],
    [plans],
  );

  const sheetDayInfo = useMemo(() => {
    if (!sheetDate || !monthData) return undefined;
    const key = formatCalendarDate(sheetDate);
    return monthData.days.find((day) => day.date === key);
  }, [monthData, sheetDate]);

  const openSheet = (date: Date) => {
    const key = formatCalendarDate(date);
    setSelectedDate(key);
    setSheetDate(date);
    const info = monthData?.days.find((day) => day.date === key);
    if (info?.isRest) {
      setSheetRest(true);
      setSheetPlanId('none');
    } else if (info?.planId) {
      setSheetRest(false);
      setSheetPlanId(String(info.planId));
    } else {
      setSheetRest(false);
      setSheetPlanId('none');
    }
    setSheetOpen(true);
  };

  const handleSaveTemplate = async () => {
    setSavingTemplate(true);
    setError(null);
    try {
      const weekPattern = {} as Record<WeekDayKey, number | 'rest' | null>;
      for (const key of WEEK_DAY_KEYS) {
        const value = weekPatternDraft[key];
        if (value === 'rest') weekPattern[key] = 'rest';
        else if (value === 'none') weekPattern[key] = null;
        else weekPattern[key] = Number(value);
      }
      await fitnessPlanClient.updateScheduleTemplate({
        cycleWeeks,
        weekPattern,
      });
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : '保存失败');
    } finally {
      setSavingTemplate(false);
    }
  };

  const handleSaveDay = async () => {
    if (!sheetDate) return;
    setSavingDay(true);
    setError(null);
    try {
      const date = formatCalendarDate(sheetDate);
      await fitnessPlanClient.setScheduleOverride({
        date,
        isRest: sheetRest,
        planId: sheetRest ? null : sheetPlanId === 'none' ? null : Number(sheetPlanId),
      });
      setSheetOpen(false);
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : '保存失败');
    } finally {
      setSavingDay(false);
    }
  };

  const handleClearOverride = async () => {
    if (!sheetDate) return;
    setSavingDay(true);
    try {
      await fitnessPlanClient.setScheduleOverride({
        date: formatCalendarDate(sheetDate),
        clear: true,
      });
      setSheetOpen(false);
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : '恢复失败');
    } finally {
      setSavingDay(false);
    }
  };

  return (
    <div className="fp-page">
      <Title size="middle" color="app-orange">
        训练日历
      </Title>
      <p className="fp-page__desc">月视图查看排期，配置周循环模板，并支持单日覆盖。</p>

      <div className="fp-cal-toolbar">
        <Button
          type="default"
          onClick={() => setScheduleViewMonth(shiftMonth(scheduleViewMonth, -1))}
        >
          上月
        </Button>
        <strong className="fp-cal-toolbar__title">{formatMonthTitle(scheduleViewMonth)}</strong>
        <Button
          type="default"
          onClick={() => setScheduleViewMonth(shiftMonth(scheduleViewMonth, 1))}
        >
          下月
        </Button>
        <Button
          type="dashed"
          onClick={() => {
            const now = formatCalendarDate(new Date()).slice(0, 7);
            setScheduleViewMonth(now);
          }}
        >
          本月
        </Button>
      </div>

      {error ? <p style={{ color: '#e05a5a', margin: 0 }}>{error}</p> : null}
      {loading ? <p style={{ color: '#9f927d' }}>加载日历…</p> : null}

      {monthData && !loading ? (
        <FitnessMonthView
          monthKey={scheduleViewMonth}
          days={monthData.days}
          selectedDate={selectedDate}
          onDateClick={openSheet}
        />
      ) : null}

      <Card pattern="app-yellow">
        <Title size="small" color="app-yellow">
          周循环模板
        </Title>
        <p className="fp-page__desc" style={{ marginTop: 8 }}>
          为周一到周日指定默认计划；循环 {cycleWeeks} 周后仍按同一模式重复。
        </p>
        <div className="fp-week-pattern">
          {WEEK_DAY_KEYS.map((key) => (
            <label key={key} className="fp-field">
              <span>{WEEK_DAY_LABELS[key]}</span>
              <Select
                value={weekPatternDraft[key]}
                onChange={(value: string) =>
                  setWeekPatternDraft((prev) => ({ ...prev, [key]: value }))
                }
                options={planOptions}
              />
            </label>
          ))}
        </div>
        <label className="fp-field" style={{ maxWidth: 200, marginTop: 12 }}>
          <span>循环周数</span>
          <Select
            value={String(cycleWeeks)}
            onChange={(value: string) => setCycleWeeks(Number(value))}
            options={[1, 2, 3, 4, 6, 8, 12].map((n) => ({
              key: String(n),
              label: `${n} 周`,
            }))}
          />
        </label>
        <div style={{ marginTop: 12 }}>
          <Button type="primary" loading={savingTemplate} onClick={() => void handleSaveTemplate()}>
            保存周循环
          </Button>
        </div>
      </Card>

      <FitnessDaySheet
        open={sheetOpen}
        date={sheetDate}
        dayInfo={sheetDayInfo}
        plans={plans}
        selectedPlanId={sheetPlanId}
        isRest={sheetRest}
        saving={savingDay}
        onClose={() => setSheetOpen(false)}
        onPlanChange={setSheetPlanId}
        onRestChange={setSheetRest}
        onSave={() => void handleSaveDay()}
        onClearOverride={() => void handleClearOverride()}
      />
    </div>
  );
}
