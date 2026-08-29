'use client';

import type { CSSProperties, ReactNode } from 'react';
import { cn } from '../../utils';

type AvatarProps = {
  className?: string;
  style?: CSSProperties;
  children?: ReactNode;
};

/** 轻量头像容器（替代已删除的 shadcn Avatar） */
export function Avatar({ className, style, children }: AvatarProps) {
  return (
    <span
      className={cn(
        'relative inline-flex shrink-0 overflow-hidden rounded-full bg-[var(--sa2-bg-secondary,#f0e8d8)]',
        className,
      )}
      style={style}
    >
      {children}
    </span>
  );
}

export function AvatarImage({
  src,
  alt,
  className,
}: {
  src?: string;
  alt?: string;
  className?: string;
}) {
  if (!src) return null;
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img src={src} alt={alt ?? ''} className={cn('aspect-square h-full w-full object-cover', className)} />
  );
}

export function AvatarFallback({
  className,
  children,
}: {
  className?: string;
  children?: ReactNode;
}) {
  return (
    <span
      className={cn(
        'flex h-full w-full items-center justify-center text-[var(--sa2-text,#794f27)]',
        className,
      )}
    >
      {children}
    </span>
  );
}
