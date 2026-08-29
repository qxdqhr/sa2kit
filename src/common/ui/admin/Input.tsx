'use client';

import { Input as Sa2Input } from '@sa2kit-ui/react';
import React, { type ChangeEventHandler, type CSSProperties, type InputHTMLAttributes, type ReactNode } from 'react';

/** 自包含 props（不依赖 @sa2kit-ui/shared 解析，避免 npm 包 DTS 断裂） */
export type InputProps = Omit<
  InputHTMLAttributes<HTMLInputElement>,
  'size' | 'prefix' | 'onChange'
> & {
  id?: string;
  size?: 'small' | 'middle' | 'large';
  prefix?: ReactNode;
  suffix?: ReactNode;
  allowClear?: boolean;
  status?: 'error' | 'warning';
  shadow?: boolean;
  onChange?: ChangeEventHandler<HTMLInputElement>;
  onClear?: () => void;
  className?: string;
  style?: CSSProperties;
};

/** 透传动森 Input；保留原生 onChange 事件形态供表单使用 */
export function Input(props: InputProps) {
  return <Sa2Input {...(props as Parameters<typeof Sa2Input>[0])} />;
}

export type { ChangeEventHandler };
