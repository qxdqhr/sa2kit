'use client';

import React from 'react';
import { cn } from '../cn';
import { Button } from '../admin/Button';

export type FilterOption<T> = {
  value: T;
  label: string;
  icon?: string;
  /** @deprecated 动森按钮组不再使用自定义 activeColor，保留字段以免破坏调用方 */
  activeColor?: {
    bg: string;
    shadow: string;
  };
  count?: number;
  showCount?: boolean;
};

export type FilterButtonGroupProps<T> = {
  label: string;
  value: T;
  options: FilterOption<T>[];
  onChange: (value: T) => void;
  className?: string;
};

/** 动森筛选按钮组 */
export function FilterButtonGroup<T extends string>({
  label,
  value,
  options,
  onChange,
  className,
}: FilterButtonGroupProps<T>) {
  return (
    <div className={cn('space-y-3', className)}>
      <h3 className="m-0 text-base font-semibold text-[var(--sa2-text,#794f27)]">{label}</h3>
      <div className="flex flex-wrap gap-2">
        {options.map((option) => {
          const active = value === option.value;
          return (
            <Button
              key={option.value}
              type={active ? 'primary' : 'default'}
              size="small"
              onClick={() => onChange(option.value)}
            >
              {option.icon ? <span className="mr-1">{option.icon}</span> : null}
              {option.label}
              {option.showCount && option.count !== undefined ? (
                <span className="ml-1 opacity-80">({option.count})</span>
              ) : null}
            </Button>
          );
        })}
      </div>
    </div>
  );
}
