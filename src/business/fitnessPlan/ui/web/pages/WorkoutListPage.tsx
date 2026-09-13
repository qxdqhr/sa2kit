'use client';

import Link from 'next/link';
import React, { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button, Card, Title } from 'sa2kit/common/ui';
import { fitnessPlanClient } from '../services/fitnessPlanClient';
import { useFitnessPlanStore } from '../store/fitnessPlanStore';
import type { WorkoutSessionListItem, WorkoutSessionStatus } from '../../../domain/types';

const STATUS_LABELS: Record<WorkoutSessionStatus, string> = {
  in_progress: '进行中',
  completed: '已完成',
  abandoned: '已放弃',
};

function formatDuration(seconds: number | null) {
  if (seconds == null) return '—';
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  if (m >= 60) {
    const h = Math.floor(m / 60);
    return `${h}h ${m % 60}m`;
  }
  return m > 0 ? `${m}m ${s}s` : `${s}s`;
}

function formatWhen(iso: string) {
  const date = new Date(iso);
  return date.toLocaleString('zh-CN', {
    month: 'numeric',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function WorkoutListPage() {
  const router = useRouter();
  const activeWorkout = useFitnessPlanStore((s) => s.activeWorkout);
  const setActiveWorkout = useFitnessPlanStore((s) => s.setActiveWorkout);

  const [sessions, setSessions] = useState<WorkoutSessionListItem[]>([]);
  const [todayPlanId, setTodayPlanId] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [starting, setStarting] = useState<'empty' | 'today' | null>(null);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [list, planId] = await Promise.all([
        fitnessPlanClient.listSessions(),
        fitnessPlanClient.getTodayPlanId(),
      ]);
      setSessions(list);
      setTodayPlanId(planId);
    } catch (err) {
      setError(err instanceof Error ? err.message : '加载失败');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const handleStart = async (mode: 'empty' | 'today') => {
    if (activeWorkout.sessionId) {
      router.push(`/workout/${activeWorkout.sessionId}`);
      return;
    }

    setStarting(mode);
    setError(null);
    try {
      const session = await fitnessPlanClient.startSession(
        mode === 'empty' ? { empty: true } : { planId: todayPlanId ?? undefined },
      );
      setActiveWorkout({
        sessionId: session.id,
        startedAt: session.startedAt,
      });
      router.push(`/workout/${session.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : '开练失败');
    } finally {
      setStarting(null);
    }
  };

  const hasActive = activeWorkout.sessionId != null;

  return (
    <div className="fp-page">
      <Title size="middle" color="app-green">
        训练记录
      </Title>
      <p className="fp-page__desc">历史训练会话，或从今日计划 / 空训练快速开练。</p>

      {hasActive ? (
        <Card pattern="app-teal">
          <div className="fp-workout-active-banner">
            <div>
              <strong>你有进行中的训练</strong>
              <p>点击继续记录组数，或完成 / 放弃本次训练。</p>
            </div>
            <Link href={`/workout/${activeWorkout.sessionId}`}>
              <Button type="primary">继续训练</Button>
            </Link>
          </div>
        </Card>
      ) : null}

      <div className="fp-action-row">
        <Button
          type="primary"
          loading={starting === 'empty'}
          disabled={hasActive || starting != null}
          onClick={() => void handleStart('empty')}
        >
          空训练开练
        </Button>
        <Button
          type="default"
          loading={starting === 'today'}
          disabled={hasActive || starting != null || todayPlanId == null}
          onClick={() => void handleStart('today')}
        >
          {todayPlanId ? '今日计划开练' : '今日无计划'}
        </Button>
      </div>

      {error ? <p style={{ color: '#e05a5a', margin: 0 }}>{error}</p> : null}
      {loading ? <p style={{ color: '#9f927d' }}>加载中…</p> : null}

      <div className="fp-session-list">
        {sessions.map((session) => (
          <Card key={session.id} pattern="default">
            <div className="fp-session-card">
              <div className="fp-session-card__main">
                <Link
                  href={`/workout/${session.id}`}
                  className="fp-session-card__title"
                >
                  {session.planName ?? '空训练'} #{session.id}
                </Link>
                <div className="fp-session-card__meta">
                  <span className="fp-tag">{STATUS_LABELS[session.status]}</span>
                  <span>{formatWhen(session.startedAt)}</span>
                  {session.durationSeconds != null ? (
                    <span>{formatDuration(session.durationSeconds)}</span>
                  ) : null}
                </div>
              </div>
              {session.status === 'in_progress' ? (
                <Link href={`/workout/${session.id}`}>
                  <Button type="primary" size="small">
                    继续
                  </Button>
                </Link>
              ) : null}
            </div>
          </Card>
        ))}
        {!loading && sessions.length === 0 ? (
          <Card pattern="default" type="dashed">
            <p className="fp-state-card">还没有训练记录，点上方按钮开始第一次训练吧。</p>
          </Card>
        ) : null}
      </div>
    </div>
  );
}
