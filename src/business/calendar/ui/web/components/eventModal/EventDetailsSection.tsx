'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { AlignLeft, MapPin } from 'lucide-react';
import type { EventModalFormData } from './types';
import { hintClass, labelClass, scrollableShortTextClass, scrollableTextAreaClass } from './styles';

interface EventDetailsSectionProps {
  formData: EventModalFormData;
  errors: Record<string, string>;
  onChange: (field: keyof EventModalFormData, value: string | boolean | number) => void;
}

function FieldBlock({
  index,
  label,
  icon: Icon,
  required,
  children,
}: {
  index: number;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  required?: boolean;
  children: React.ReactNode;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.08, type: 'spring', duration: 0.3, bounce: 0 }}
      className="space-y-2"
    >
      <label className={`inline-flex items-center gap-2 ${labelClass}`}>
        <Icon className="h-4 w-4 text-[#9f927d]" aria-hidden />
        {label}
        {required && <span className="text-red-500">*</span>}
      </label>
      {children}
    </motion.div>
  );
}

export default function EventDetailsSection({
  formData,
  errors,
  onChange,
}: EventDetailsSectionProps) {
  return (
    <div className="space-y-5">
      <FieldBlock index={0} label="活动标题" icon={AlignLeft} required>
        <textarea
          value={formData.title}
          onChange={(e) => onChange('title', e.target.value)}
          rows={2}
          className={`${scrollableShortTextClass} ${errors.title ? 'shadow-[inset_0_0_0_2px_rgba(239,68,68,0.5)]' : ''}`}
          placeholder="为活动起个名字"
        />
        {errors.title && <p className="text-sm text-red-600">{errors.title}</p>}
      </FieldBlock>

      <FieldBlock index={1} label="活动描述" icon={AlignLeft}>
        <textarea
          value={formData.description}
          onChange={(e) => onChange('description', e.target.value)}
          rows={4}
          className={scrollableTextAreaClass}
          placeholder="补充说明（可选）"
        />
        {formData.description.length > 0 && (
          <p className={`tabular-nums ${hintClass}`}>已输入 {formData.description.length} 字</p>
        )}
      </FieldBlock>

      <FieldBlock index={2} label="地点" icon={MapPin}>
        <textarea
          value={formData.location}
          onChange={(e) => onChange('location', e.target.value)}
          rows={2}
          className={scrollableShortTextClass}
          placeholder="活动举办地点（可选）"
        />
      </FieldBlock>
    </div>
  );
}
