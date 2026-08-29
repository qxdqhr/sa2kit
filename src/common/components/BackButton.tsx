'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { BackButton as PatternBackButton } from '../ui/patterns/BackButton';

export type BackButtonProps = {
  href?: string;
  className?: string;
};

/** Next 适配：注入 router；视觉来自 `sa2kit/common/ui/patterns` */
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
