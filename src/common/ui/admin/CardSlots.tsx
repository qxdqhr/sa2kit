'use client';

import { cn } from '../../utils';
import type { HTMLAttributes } from 'react';

export function CardHeader({ className, ...rest }: HTMLAttributes<HTMLDivElement>) {
  return <div className={cn('sa2-card-header flex flex-col gap-1.5 p-4 pb-2', className)} {...rest} />;
}

export function CardTitle({ className, ...rest }: HTMLAttributes<HTMLHeadingElement>) {
  return <h3 className={cn('sa2-card-title text-lg font-semibold leading-none', className)} {...rest} />;
}

export function CardDescription({ className, ...rest }: HTMLAttributes<HTMLParagraphElement>) {
  return <p className={cn('sa2-card-description text-sm opacity-70', className)} {...rest} />;
}

export function CardContent({ className, ...rest }: HTMLAttributes<HTMLDivElement>) {
  return <div className={cn('sa2-card-content p-4 pt-2', className)} {...rest} />;
}

export function CardFooter({ className, ...rest }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={cn('sa2-card-footer flex items-center gap-2 p-4 pt-0', className)} {...rest} />
  );
}
