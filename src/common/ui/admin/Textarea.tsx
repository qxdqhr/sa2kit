'use client';

import { cn } from '../../utils';
import React, { type TextareaHTMLAttributes } from 'react';
import { forwardRef } from 'react';

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaHTMLAttributes<HTMLTextAreaElement>>(
  function Textarea({ className, ...rest }, ref) {
    return (
      <textarea
        ref={ref}
        className={cn(
          'sa2-textarea flex min-h-[80px] w-full rounded-md border border-current/20 bg-transparent px-3 py-2 text-sm',
          className,
        )}
        {...rest}
      />
    );
  },
);
