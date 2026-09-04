'use client';

import { X } from 'lucide-react';
import type { ReactNode } from 'react';

interface MobileBottomSheetProps {
  open: boolean;
  title: string;
  onClose: () => void;
  children: ReactNode;
}

export function MobileBottomSheet({ open, title, onClose, children }: MobileBottomSheetProps) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-40 lg:hidden" role="presentation">
      <button
        type="button"
        className="absolute inset-0 bg-black/45"
        aria-label="关闭面板"
        onClick={onClose}
      />
      <div
        className="absolute inset-x-0 bottom-0 flex max-h-[min(78dvh,640px)] flex-col rounded-t-2xl border-t border-[var(--nn-shell-border)] bg-[var(--nn-shell-surface)] shadow-2xl nn-safe-bottom"
        role="dialog"
        aria-modal="true"
        aria-label={title}
      >
        <div className="flex shrink-0 items-center gap-3 border-b border-[var(--nn-shell-border)] px-4 py-3">
          <div className="mx-auto h-1 w-10 rounded-full bg-[var(--nn-shell-border)]" aria-hidden />
        </div>
        <div className="flex shrink-0 items-center justify-between gap-2 px-4 pb-2">
          <h2 className="text-base font-semibold text-[var(--nn-shell-text)]">{title}</h2>
          <button
            type="button"
            onClick={onClose}
            className="inline-flex min-h-11 min-w-11 cursor-pointer items-center justify-center rounded-lg text-[var(--nn-shell-muted)] hover:bg-[var(--nn-shell-bg)]"
            aria-label="关闭"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
        <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain">{children}</div>
      </div>
    </div>
  );
}
