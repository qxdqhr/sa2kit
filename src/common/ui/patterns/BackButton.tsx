'use client';

import { cn } from '../../utils';
import { Button } from '../admin/Button';

export type BackButtonProps = {
  /** 点击回调（宿主注入 router.back / push） */
  onClick?: () => void;
  /** 若提供则渲染为链接 */
  href?: string;
  label?: string;
  className?: string;
};

/** 动森风格返回按钮（无框架路由依赖） */
export function BackButton({
  onClick,
  href,
  label = '返回',
  className,
}: BackButtonProps) {
  if (href) {
    return (
      <a href={href} className={cn('inline-flex no-underline', className)}>
        <Button type="default" size="small" className="gap-2">
          <BackIcon />
          {label}
        </Button>
      </a>
    );
  }

  return (
    <Button type="default" size="small" className={cn('gap-2', className)} onClick={onClick}>
      <BackIcon />
      {label}
    </Button>
  );
}

function BackIcon() {
  return (
    <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
    </svg>
  );
}
