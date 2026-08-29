'use client';

import { cn } from '../../utils';
import React, { type HTMLAttributes } from 'react';

export function Badge({
  className,
  variant = 'default',
  ...rest
}: HTMLAttributes<HTMLSpanElement> & {
  variant?: 'default' | 'outline' | 'secondary' | 'destructive';
}) {
  return (
    <span
      className={cn(
        'sa2-badge inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium',
        variant === 'outline' && 'border border-current bg-transparent',
        variant === 'secondary' && 'opacity-80',
        variant === 'destructive' && 'text-red-600',
        className,
      )}
      {...rest}
    />
  );
}
