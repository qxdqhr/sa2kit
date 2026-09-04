'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { Palette, Star } from 'lucide-react';
import { EventPriority } from '../../types';
import { EVENT_COLOR_PRESETS } from '../../utils/eventDisplay';
import type { EventModalFormData } from './types';
import { labelClass } from './styles';
import { cal, priorityChipClass } from '../../calendarStyles';
import { cn } from '../../utils/cn';

interface EventAppearanceSectionProps {
  formData: EventModalFormData;
  onChange: (field: keyof EventModalFormData, value: string | boolean | number) => void;
}

const PRIORITY_OPTIONS = [
  { value: EventPriority.LOW, label: '低' },
  { value: EventPriority.NORMAL, label: '普通' },
  { value: EventPriority.HIGH, label: '高' },
  { value: EventPriority.URGENT, label: '紧急' },
] as const;

export default function EventAppearanceSection({
  formData,
  onChange,
}: EventAppearanceSectionProps) {
  return (
    <div className="space-y-6">
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0, type: 'spring', duration: 0.3, bounce: 0 }}
        className="space-y-3"
      >
        <label className={`inline-flex items-center gap-2 ${labelClass}`}>
          <Palette className="h-4 w-4 text-[#9f927d]" aria-hidden />
          活动颜色
        </label>
        <div className="flex items-center gap-3">
          <label
            className="relative flex h-11 w-11 cursor-pointer items-center justify-center rounded-xl shadow-[inset_0_0_0_1px_rgba(0,0,0,0.1)] transition-transform active:scale-[0.96]"
            style={{ backgroundColor: formData.color }}
          >
            <input
              type="color"
              value={formData.color}
              onChange={(e) => onChange('color', e.target.value)}
              className="absolute inset-0 cursor-pointer opacity-0"
              aria-label="选择自定义颜色"
            />
          </label>
          <span className={`${cal.textBody} tabular-nums text-sm font-medium`}>
            {formData.color.toUpperCase()}
          </span>
        </div>
        <div className="flex flex-wrap gap-2">
          {EVENT_COLOR_PRESETS.map((color, index) => (
            <motion.button
              key={color}
              type="button"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: index * 0.04, type: 'spring', duration: 0.3, bounce: 0 }}
              onClick={() => onChange('color', color)}
              aria-label={`选择颜色 ${color}`}
              className={`h-10 w-10 rounded-[18px] transition-[transform,box-shadow] active:scale-[0.96] ${
                formData.color === color
                  ? 'shadow-[0_0_0_2px_#19c8b9,inset_0_0_0_1px_rgba(0,0,0,0.1)]'
                  : 'shadow-[inset_0_0_0_1px_rgba(0,0,0,0.1)] hover:scale-105'
              }`}
              style={{ backgroundColor: color }}
            />
          ))}
        </div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1, type: 'spring', duration: 0.3, bounce: 0 }}
        className="space-y-2"
      >
        <label className={`inline-flex items-center gap-2 ${labelClass}`}>
          <Star className="h-4 w-4 text-[#9f927d]" aria-hidden />
          优先级
        </label>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
          {PRIORITY_OPTIONS.map((option) => {
            const selected = formData.priority === option.value;
            return (
              <label key={option.value} className="cursor-pointer">
                <input
                  type="radio"
                  name="priority"
                  value={option.value}
                  checked={selected}
                  onChange={() => onChange('priority', option.value)}
                  className="sr-only"
                />
                <span
                  className={cn(priorityChipClass(selected), 'flex h-10 items-center justify-center')}
                >
                  {option.label}
                </span>
              </label>
            );
          })}
        </div>
      </motion.div>
    </div>
  );
}
