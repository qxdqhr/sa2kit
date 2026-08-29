'use client';

import { Input as Sa2Input, type InputProps as Sa2InputProps } from '@sa2kit-ui/react';
import type { ChangeEventHandler } from 'react';

/** 透传动森 Input；保留原生 onChange 事件形态供表单使用 */
export function Input(props: Sa2InputProps & { id?: string }) {
  return <Sa2Input {...props} />;
}

export type { Sa2InputProps as InputProps };
export type { ChangeEventHandler };
