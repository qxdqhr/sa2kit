'use client';

import type { ChangeEvent } from 'react';
import { Input } from '../admin/Input';

export type SearchBoxProps = {
  searchQuery: string;
  onSearchChange: (query: string) => void;
  placeholder?: string;
  size?: 'small' | 'medium' | 'large';
  className?: string;
};

const sizeMap = {
  small: 'small',
  medium: 'middle',
  large: 'large',
} as const;

/** 动森搜索框：基于 ui Input */
export function SearchBox({
  searchQuery,
  onSearchChange,
  placeholder = '搜索…',
  size = 'large',
  className,
}: SearchBoxProps) {
  return (
    <Input
      className={className}
      size={sizeMap[size]}
      value={searchQuery}
      placeholder={placeholder}
      allowClear
      onChange={(e: ChangeEvent<HTMLInputElement>) => onSearchChange(e.target.value)}
      onClear={() => onSearchChange('')}
    />
  );
}
