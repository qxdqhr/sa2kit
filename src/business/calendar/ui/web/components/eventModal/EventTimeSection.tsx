'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { Switch } from 'sa2kit/common/ui';
import { Clock, Sun, Info } from 'lucide-react';
import { RecurrencePattern } from '../../services/eventTypeService';
import type { EventModalFormData } from './types';
import { hintClass, inputClass, labelClass, sectionClass } from './styles';
import { cal } from '../../calendarStyles';

interface EventTimeSectionProps {
  formData: EventModalFormData;
  variant: 'single' | 'multi_day' | 'recurring';
  onChange: (field: keyof EventModalFormData, value: string | boolean | number) => void;
  staggerBase?: number;
  showAllDayToggle?: boolean;
}

function TimeField({
  id,
  label,
  type,
  value,
  onChange,
  required,
}: {
  id: string;
  label: string;
  type: string;
  value: string;
  onChange: (v: string) => void;
  required?: boolean;
}) {
  return (
    <div className="space-y-2">
      <label htmlFor={id} className={labelClass}>
        {label}
        {required && <span className="ml-0.5 text-red-500">*</span>}
      </label>
      <input
        id={id}
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className={`${inputClass} tabular-nums`}
      />
    </div>
  );
}

export default function EventTimeSection({
  formData,
  variant,
  onChange,
  staggerBase = 0,
  showAllDayToggle = true,
}: EventTimeSectionProps) {
  const allDayBlock = showAllDayToggle ? (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: staggerBase, type: 'spring', duration: 0.3, bounce: 0 }}
      className={`${sectionClass} !p-3`}
    >
      <label className="flex cursor-pointer items-center justify-between gap-4">
        <div>
          <p className={labelClass}>全天活动</p>
          <p className={hintClass}>不设置具体时间，整天有效</p>
        </div>
        <Switch
          checked={formData.allDay}
          onChange={(checked: boolean) => onChange('allDay', checked)}
        />
      </label>
    </motion.div>
  ) : null;

  if (variant === 'single') {
    return (
      <div className="space-y-4">
        {allDayBlock}
        {formData.allDay ? (
          <div className={`${sectionClass} space-y-4`}>
            <div className="flex items-start gap-3">
              <Sun className="mt-0.5 h-5 w-5 shrink-0 text-amber-500" />
              <div>
                <p className={`${cal.label} text-sm`}>全天模式</p>
                <p className={`mt-1 ${hintClass}`}>选择活动日期，将在该日全天显示。</p>
              </div>
            </div>
            <TimeField
              id="allDayDate"
              label="活动日期"
              type="date"
              value={formData.startDate}
              onChange={(v) => onChange('startDate', v)}
              required
            />
          </div>
        ) : (
          <>
            <div className={`${sectionClass} space-y-4`}>
              <TimeField
                id="eventDate"
                label="活动日期"
                type="date"
                value={formData.startDate}
                onChange={(v) => onChange('startDate', v)}
                required
              />
              <div className={`${cal.label} flex items-center gap-2 text-sm`}>
                <Clock className="h-4 w-4 text-[#19c8b9]" />
                时间段
              </div>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <TimeField
                  id="startTime"
                  label="开始时间"
                  type="datetime-local"
                  value={formData.startTime}
                  onChange={(v) => onChange('startTime', v)}
                  required
                />
                <TimeField
                  id="endTime"
                  label="结束时间"
                  type="datetime-local"
                  value={formData.endTime}
                  onChange={(v) => onChange('endTime', v)}
                  required
                />
              </div>
            </div>
            <div className={cal.infoBox}>
              <Info className="mt-0.5 h-4 w-4 shrink-0 text-[#19c8b9]" />
              <p className={hintClass}>请确保结束时间晚于开始时间。</p>
            </div>
          </>
        )}
      </div>
    );
  }

  if (variant === 'multi_day') {
    return (
      <div className="space-y-4">
        {allDayBlock}
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: staggerBase + 0.08, type: 'spring', duration: 0.3, bounce: 0 }}
          className="space-y-4"
        >
          <div className={`${sectionClass} space-y-4`}>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <TimeField
                id="startDate"
                label="开始日期"
                type="date"
                value={formData.startDate}
                onChange={(v) => onChange('startDate', v)}
                required
              />
              <TimeField
                id="endDate"
                label="结束日期"
                type="date"
                value={formData.endDate}
                onChange={(v) => onChange('endDate', v)}
                required
              />
            </div>

            {!formData.allDay && (
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <TimeField
                  id="dailyStartTime"
                  label="每日开始"
                  type="time"
                  value={formData.dailyStartTime}
                  onChange={(v) => onChange('dailyStartTime', v)}
                />
                <TimeField
                  id="dailyEndTime"
                  label="每日结束"
                  type="time"
                  value={formData.dailyEndTime}
                  onChange={(v) => onChange('dailyEndTime', v)}
                />
              </div>
            )}
          </div>
          <p className={hintClass}>
            例如：21 日至 23 日的培训，系统会在连续三天各创建一个活动实例。
          </p>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {allDayBlock}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: staggerBase + 0.08, type: 'spring', duration: 0.3, bounce: 0 }}
        className="space-y-4"
      >
        <div className={`${sectionClass} space-y-4`}>
          <TimeField
            id="recurrenceStartDate"
            label="开始日期"
            type="date"
            value={formData.recurrenceStartDate}
            onChange={(v) => onChange('recurrenceStartDate', v)}
            required
          />

          {!formData.allDay && (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <TimeField
                id="recurrenceStartTime"
                label="开始时间"
                type="datetime-local"
                value={formData.recurrenceStartTime}
                onChange={(v) => onChange('recurrenceStartTime', v)}
                required
              />
              <TimeField
                id="recurrenceEndTime"
                label="结束时间"
                type="datetime-local"
                value={formData.recurrenceEndTime}
                onChange={(v) => onChange('recurrenceEndTime', v)}
                required
              />
            </div>
          )}

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <label htmlFor="recurrencePattern" className={labelClass}>
                重复模式 <span className="text-red-500">*</span>
              </label>
              <select
                id="recurrencePattern"
                value={formData.recurrencePattern}
                onChange={(e) =>
                  onChange('recurrencePattern', e.target.value as RecurrencePattern)
                }
                className={inputClass}
              >
                <option value="daily">每天</option>
                <option value="weekly">每周</option>
                <option value="monthly">每月</option>
                <option value="yearly">每年</option>
              </select>
            </div>
            <div className="space-y-2">
              <label htmlFor="recurrenceInterval" className={labelClass}>
                重复间隔
              </label>
              <input
                id="recurrenceInterval"
                type="number"
                min={1}
                max={365}
                value={formData.recurrenceInterval}
                onChange={(e) => onChange('recurrenceInterval', parseInt(e.target.value, 10) || 1)}
                className={`${inputClass} tabular-nums`}
              />
            </div>
          </div>

          <div className="space-y-3">
            <p className={labelClass}>结束条件</p>
            <label className="flex min-h-10 cursor-pointer items-center gap-3">
              <input
                type="radio"
                checked={formData.useEndDate}
                onChange={() => onChange('useEndDate', true)}
                className={cal.checkbox}
              />
              <span className={`${cal.textBody} text-sm`}>结束日期</span>
            </label>
            {formData.useEndDate && (
              <input
                type="date"
                value={formData.recurrenceEndDate}
                onChange={(e) => onChange('recurrenceEndDate', e.target.value)}
                className={`${inputClass} tabular-nums`}
              />
            )}
            <label className="flex min-h-10 cursor-pointer items-center gap-3">
              <input
                type="radio"
                checked={!formData.useEndDate}
                onChange={() => onChange('useEndDate', false)}
                className={cal.checkbox}
              />
              <span className={`${cal.textBody} text-sm`}>重复次数</span>
            </label>
            {!formData.useEndDate && (
              <input
                type="number"
                min={1}
                max={999}
                value={formData.recurrenceCount}
                onChange={(e) => onChange('recurrenceCount', parseInt(e.target.value, 10) || 0)}
                className={`${inputClass} tabular-nums`}
                placeholder="输入重复次数"
              />
            )}
          </div>
        </div>
        <p className={hintClass}>例如：每天重复 3 次，将在连续 3 天各创建一个活动实例。</p>
      </motion.div>
    </div>
  );
}
