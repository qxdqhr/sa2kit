'use client';

import React from 'react';
import { CalendarDays, CalendarRange, Repeat2, Check } from 'lucide-react';
import { EventType } from '../../services/eventTypeService';
import { typeOptionClass, type TypeOptionVariant } from '../../calendarStyles';
import { hintClass } from './styles';

const TYPE_OPTIONS: {
  type: EventType;
  icon: typeof CalendarDays;
  title: string;
  variant: TypeOptionVariant;
  hint: string;
}[] = [
  {
    type: EventType.SINGLE,
    icon: CalendarDays,
    title: '单次',
    variant: 'default',
    hint: '指定时间发生一次，如会议、约会等。',
  },
  {
    type: EventType.MULTI_DAY,
    icon: CalendarRange,
    title: '多天',
    variant: 'multi',
    hint: '连续多天的单个活动，如培训、假期等。',
  },
  {
    type: EventType.RECURRING,
    icon: Repeat2,
    title: '重复',
    variant: 'repeat',
    hint: '按规律重复，如每日晨会、每周例会等。',
  },
];

interface EventTypeSelectorProps {
  value: EventType;
  onChange: (type: EventType) => void;
}

export default function EventTypeSelector({ value, onChange }: EventTypeSelectorProps) {
  const activeHint = TYPE_OPTIONS.find((o) => o.type === value)?.hint;

  return (
    <div className="space-y-2.5">
      <div className="grid grid-cols-3 gap-2">
        {TYPE_OPTIONS.map((option) => {
          const selected = value === option.type;
          const Icon = option.icon;

          return (
            <button
              key={option.type}
              type="button"
              onClick={() => onChange(option.type)}
              className={typeOptionClass(option.variant, selected)}
            >
              <Icon className="h-4 w-4 shrink-0" strokeWidth={selected ? 2.25 : 2} />
              <span className="truncate">{option.title}</span>
              {selected && (
                <span className="absolute -right-1 -top-1 flex h-4 w-4 items-center justify-center rounded-full bg-[#19c8b9]">
                  <Check className="h-2.5 w-2.5 text-white" strokeWidth={3} />
                </span>
              )}
            </button>
          );
        })}
      </div>

      {activeHint && <p className={`${hintClass} px-0.5`}>{activeHint}</p>}
    </div>
  );
}
