'use client';

import React from 'react';
import type { SyncStatusSummary } from '../../../domain/types';

function formatDateTime(iso: string | null | undefined) {
  if (!iso) return '-';
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return iso;
  return new Intl.DateTimeFormat('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).format(date);
}

interface SyncStatusBarProps {
  summary: SyncStatusSummary | null;
  lastSyncAt?: string | null;
}

export function SyncStatusBar({ summary, lastSyncAt }: SyncStatusBarProps) {
  const displayAt = summary?.finishedAt ?? summary?.startedAt ?? lastSyncAt;

  return (
    <div className="rounded-md border border-gray-200 bg-gray-50 px-3 py-2 text-sm text-gray-600">
      <p>
        后台最近同步：
        {formatDateTime(displayAt)}
        {summary ? (
          <>
            {' '}
            · 写入
            {summary.eventsUpserted}
            {' '}
            条 · 新发现
            {summary.newEventsFound}
            {' '}
            · 截止提醒
            {summary.endingSoonTriggered}
            {' '}
            · 已推送
            {summary.notificationsSent}
          </>
        ) : (
          <span className="text-amber-700">（尚无同步记录，请运行 cron 或 pnpm ticket-monitor:sync）</span>
        )}
      </p>
      {summary?.errors?.length ? (
        <p className="mt-1 text-xs text-amber-800">
          同步异常：
          {summary.errors.join(' | ')}
        </p>
      ) : null}
    </div>
  );
}
