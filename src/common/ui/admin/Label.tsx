'use client';

import { cn } from '../cn';
import React, { type LabelHTMLAttributes } from 'react';

export function Label({ className, ...rest }: LabelHTMLAttributes<HTMLLabelElement>) {
  return (
    <label
      className={cn('sa2-label mb-1.5 block text-sm font-medium', className)}
      {...rest}
    />
  );
}
