'use client';

/**
 * Next.js 适配返回按钮（注入 router）。
 * 无框架版本：`sa2kit/common/ui/patterns` 的 BackButton（自传 onClick）。
 */
import React from 'react';
import { useRouter } from 'next/navigation';
import { BackButton as PatternBackButton } from './BackButton';

export type BackButtonProps = {
  href?: string;
  className?: string;
};

export function BackButton({ href, className = '' }: BackButtonProps) {
  const router = useRouter();

  return (
    <PatternBackButton
      className={className}
      onClick={() => {
        if (href) router.push(href);
        else router.back();
      }}
    />
  );
}

export default BackButton;
