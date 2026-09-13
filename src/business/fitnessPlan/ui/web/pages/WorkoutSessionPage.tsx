'use client';

import Link from 'next/link';
import React, { useCallback, useEffect, useMemo, useState, type ChangeEvent } from 'react';
import { useRouter } from 'next/navigation';
import { Button, Card, Input, Title } from 'sa2kit/common/ui';
import { ExerciseLibraryPanel } from '../components/ExerciseLibraryPanel';
import { RestCountdown, WorkoutTimer } from '../components/workout/WorkoutTimer';
import { fitnessPlanClient } from '../services/fitnessPlanClient';
import { useFitnessPlanStore } from '../store/fitnessPlanStore';
import type {
  ExerciseRecord,
  WorkoutSessionDetail,
  WorkoutSessionItemDetail,
  WorkoutSetRecord,
  WorkoutSessionSummary,
} from '../../../domain/types';
import { EXERCISE_TYPE_LABELS } from '../../../domain/types';

interface WorkoutSessionPageProps {
  sessionId: string;
}

function parseSummary(json: Record<string, unknown> | null): WorkoutSessionSummary | null {
  if (!json) return null;
  return {
    totalSets: Number(json.totalSets ?? 0),
    completedSets: Number(json.completedSets ?? 0),
    strengthVolume: Number(json.strengthVolume ?? 0),
    cardioMinutes: Number(json.cardioMinutes ?? 0),
  };
}

function SetRow({
  set,
  isCardio,
  readOnly,
  onChange,
  onToggleComplete,
}: {
  set: WorkoutSetRecord;
  isCardio: boolean;
  readOnly: boolean;
  onChange: (patch: Partial<WorkoutSetRecord>) => void;
  onToggleComplete: () => void;
}) {
  if (isCardio) {
    return (
      <div className="fp-set-row">
        <span className="fp-set-row__label">有氧</span>
        <label>
          时长(分)
          <Input
            type="number"
            min={0}
            disabled={readOnly}
            value={set.durationMinutes ?? ''}
            onChange={(e: ChangeEvent<HTMLInputElement>) =>
              onChange({
                durationMinutes: e.target.value === '' ? null : Number(e.target.value),
              })
            }
          />
        </label>
        <label>
          距离(km)
          <Input
            type="number"
            min={0}
            step="0.1"
            disabled={readOnly}
            value={set.distance ?? ''}
            onChange={(e: ChangeEvent<HTMLInputElement>) =>
              onChange({ distance: e.target.value === '' ? null : Number(e.target.value) })
            }
          />
        </label>
        <label>
          热量
          <Input
            type="number"
            min={0}
            disabled={readOnly}
            value={set.calories ?? ''}
            onChange={(e: ChangeEvent<HTMLInputElement>) =>
              onChange({ calories: e.target.value === '' ? null : Number(e.target.value) })
            }
          />
        </label>
        <Button
          type={set.isCompleted ? 'primary' : 'default'}
          size="small"
          disabled={readOnly}
          onClick={onToggleComplete}
        >
          {set.isCompleted ? '✓ 已完成' : '完成'}
        </Button>
      </div>
    );
  }

  return (
    <div className="fp-set-row">
      <span className="fp-set-row__label">第 {set.setNumber} 组</span>
      <label>
        重量(kg)
        <Input
          type="number"
          min={0}
          step="0.5"
          disabled={readOnly}
          value={set.weight ?? ''}
          onChange={(e: ChangeEvent<HTMLInputElement>) =>
            onChange({ weight: e.target.value === '' ? null : Number(e.target.value) })
          }
        />
      </label>
      <label>
        次数
        <Input
          type="number"
          min={0}
          disabled={readOnly}
          value={set.reps ?? ''}
          onChange={(e: ChangeEvent<HTMLInputElement>) =>
            onChange({ reps: e.target.value === '' ? null : Number(e.target.value) })
          }
        />
      </label>
      <Button
        type={set.isCompleted ? 'primary' : 'default'}
        size="small"
        disabled={readOnly}
        onClick={onToggleComplete}
      >
        {set.isCompleted ? '✓ 已完成' : '完成'}
      </Button>
    </div>
  );
}

function ExerciseBlock({
  item,
  readOnly,
  savingSetId,
  onAddSet,
  onUpdateSet,
  onCompleteSet,
}: {
  item: WorkoutSessionItemDetail;
  readOnly: boolean;
  savingSetId: number | null;
  onAddSet: () => void;
  onUpdateSet: (setId: number, patch: Partial<WorkoutSetRecord>) => void;
  onCompleteSet: (setId: number, restSeconds: number) => void;
}) {
  const isCardio = item.exercise.type === 'cardio';

  return (
    <Card pattern="default" className="fp-exercise-block">
      <div className="fp-exercise-block__head">
        <div>
          <strong>{item.exercise.name}</strong>
          <div className="fp-exercise-block__tags">
            <span className="fp-tag">{EXERCISE_TYPE_LABELS[item.exercise.type]}</span>
            {!isCardio ? <span className="fp-tag">休息 {item.restSeconds}s</span> : null}
          </div>
        </div>
        {!readOnly && !isCardio ? (
          <Button type="default" size="small" onClick={onAddSet}>
            加一组
          </Button>
        ) : null}
      </div>

      <div className="fp-set-list">
        {item.sets.map((set) => (
          <SetRow
            key={set.id}
            set={set}
            isCardio={isCardio}
            readOnly={readOnly || savingSetId === set.id}
            onChange={(patch) => onUpdateSet(set.id, patch)}
            onToggleComplete={() => onCompleteSet(set.id, item.restSeconds)}
          />
        ))}
      </div>
    </Card>
  );
}

export function WorkoutSessionPage({ sessionId }: WorkoutSessionPageProps) {
  const router = useRouter();
  const numericId = Number(sessionId);
  const setActiveWorkout = useFitnessPlanStore((s) => s.setActiveWorkout);
  const clearActiveWorkout = useFitnessPlanStore((s) => s.clearActiveWorkout);
  const setCheckinToday = useFitnessPlanStore((s) => s.setCheckinToday);

  const [session, setSession] = useState<WorkoutSessionDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [libraryOpen, setLibraryOpen] = useState(false);
  const [restSeconds, setRestSeconds] = useState<number | null>(null);
  const [savingSetId, setSavingSetId] = useState<number | null>(null);
  const [finishing, setFinishing] = useState<'completed' | 'abandoned' | null>(null);
  const [notes, setNotes] = useState('');

  const readOnly = session?.status !== 'in_progress';
  const summary = useMemo(() => parseSummary(session?.summaryJson ?? null), [session?.summaryJson]);

  const load = useCallback(async () => {
    if (!Number.isFinite(numericId)) {
      setError('无效的训练 ID');
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const data = await fitnessPlanClient.getSession(numericId);
      setSession(data);
      setNotes(data.notes ?? '');
      if (data.status === 'in_progress') {
        setActiveWorkout({ sessionId: data.id, startedAt: data.startedAt });
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : '加载失败');
    } finally {
      setLoading(false);
    }
  }, [numericId, setActiveWorkout]);

  useEffect(() => {
    void load();
  }, [load]);

  const persistSet = async (
    setId: number,
    patch: {
      weight?: number | null;
      reps?: number | null;
      durationMinutes?: number | null;
      distance?: number | null;
      calories?: number | null;
      isCompleted?: boolean;
    },
  ) => {
    setSavingSetId(setId);
    try {
      await fitnessPlanClient.updateWorkoutSet(setId, patch);
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : '保存失败');
    } finally {
      setSavingSetId(null);
    }
  };

  const handleUpdateSet = (setId: number, patch: Partial<WorkoutSetRecord>) => {
    if (!session) return;
    setSession({
      ...session,
      items: session.items.map((item) => ({
        ...item,
        sets: item.sets.map((set) => (set.id === setId ? { ...set, ...patch } : set)),
      })),
    });
    void persistSet(setId, patch);
  };

  const handleCompleteSet = async (setId: number, restSec: number) => {
    const target = session?.items.flatMap((item) => item.sets).find((set) => set.id === setId);
    if (!target || readOnly) return;

    const nextCompleted = !target.isCompleted;
    await persistSet(setId, { isCompleted: nextCompleted });

    if (nextCompleted) {
      const item = session?.items.find((entry) => entry.sets.some((set) => set.id === setId));
      if (item?.exercise.type === 'strength') {
        setRestSeconds(restSec);
      }
    }
  };

  const handleAddExercise = async (exercise: ExerciseRecord) => {
    if (!session || readOnly) return;
    setLibraryOpen(false);
    try {
      await fitnessPlanClient.addSessionExercise(session.id, exercise.id);
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : '添加动作失败');
    }
  };

  const handleAddSet = async (sessionItemId: number) => {
    if (readOnly) return;
    try {
      await fitnessPlanClient.addWorkoutSet(sessionItemId);
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : '加组失败');
    }
  };

  const handleFinish = async (status: 'completed' | 'abandoned') => {
    if (!session || readOnly) return;
    if (status === 'abandoned' && !window.confirm('确定放弃本次训练？')) return;

    setFinishing(status);
    setError(null);
    try {
      if (notes !== (session.notes ?? '')) {
        await fitnessPlanClient.updateSessionNotes(session.id, notes || null);
      }
      await fitnessPlanClient.completeSession(session.id, { status, notes: notes || undefined });
      clearActiveWorkout();
      if (status === 'completed') {
        setCheckinToday({ workout: true });
      }
      router.push('/workout');
    } catch (err) {
      setError(err instanceof Error ? err.message : '结束训练失败');
    } finally {
      setFinishing(null);
    }
  };

  if (loading) {
    return (
      <div className="fp-page fp-workout-session fp-workout-session--focus">
        <p className="fp-state-card">加载训练会话…</p>
      </div>
    );
  }

  if (error && !session) {
    return (
      <div className="fp-page fp-workout-session fp-workout-session--focus">
        <Title size="middle" color="app-green">
          训练会话
        </Title>
        <p className="fp-state-card is-error">{error}</p>
        <Link href="/fitness-plan/workout">
          <Button type="default">返回列表</Button>
        </Link>
      </div>
    );
  }

  if (!session) return null;

  return (
    <div className="fp-page fp-workout-session fp-workout-session--focus">
      <div className="fp-workout-session__head">
        <div>
          <Link href="/fitness-plan/workout" className="fp-workout-session__back">
            ← 训练列表
          </Link>
          <Title size="middle" color="app-green">
            {session.planName ?? '空训练'}
          </Title>
          <p className="fp-page__desc">
            {session.status === 'in_progress'
              ? '记录每组重量 / 次数，完成后自动写入训练打卡。'
              : session.status === 'completed'
                ? '本次训练已完成'
                : '本次训练已放弃'}
          </p>
        </div>
        {session.status === 'in_progress' ? (
          <WorkoutTimer startedAt={session.startedAt} />
        ) : null}
      </div>

      {restSeconds != null ? (
        <RestCountdown seconds={restSeconds} onDismiss={() => setRestSeconds(null)} />
      ) : null}

      {error ? <p style={{ color: '#e05a5a', margin: 0 }}>{error}</p> : null}

      {summary ? (
        <Card pattern="app-yellow">
          <div className="fp-session-summary">
            <span>完成 {summary.completedSets}/{summary.totalSets} 组</span>
            <span>容量 {Math.round(summary.strengthVolume)}</span>
            <span>有氧 {summary.cardioMinutes} 分钟</span>
          </div>
        </Card>
      ) : null}

      {!readOnly ? (
        <div className="fp-action-row">
          <Button type="default" onClick={() => setLibraryOpen(true)}>
            添加动作
          </Button>
        </div>
      ) : null}

      <div className="fp-exercise-stack">
        {session.items.length === 0 ? (
          <Card pattern="default" type="dashed">
            <p style={{ margin: 0, color: '#9f927d' }}>
              {readOnly ? '本次训练没有记录动作。' : '还没有动作，点击「添加动作」开始记录。'}
            </p>
          </Card>
        ) : (
          session.items.map((item) => (
            <ExerciseBlock
              key={item.id}
              item={item}
              readOnly={readOnly}
              savingSetId={savingSetId}
              onAddSet={() => void handleAddSet(item.id)}
              onUpdateSet={handleUpdateSet}
              onCompleteSet={(setId, restSec) => void handleCompleteSet(setId, restSec)}
            />
          ))
        )}
      </div>

      <Card pattern="default">
        <label className="fp-field">
          <span>训练备注</span>
          <Input
            value={notes}
            disabled={readOnly}
            onChange={(e: ChangeEvent<HTMLInputElement>) => setNotes(e.target.value)}
            placeholder="可选：感受、PR、调整说明…"
          />
        </label>
      </Card>

      {!readOnly ? (
        <div className="fp-workout-session__footer">
          <Button
            type="primary"
            loading={finishing === 'completed'}
            disabled={finishing != null}
            onClick={() => void handleFinish('completed')}
          >
            完成训练
          </Button>
          <Button
            type="default"
            loading={finishing === 'abandoned'}
            disabled={finishing != null}
            onClick={() => void handleFinish('abandoned')}
          >
            放弃
          </Button>
        </div>
      ) : null}

      <ExerciseLibraryPanel
        open={libraryOpen}
        onClose={() => setLibraryOpen(false)}
        selectMode
        onSelect={(exercise) => void handleAddExercise(exercise)}
      />
    </div>
  );
}
