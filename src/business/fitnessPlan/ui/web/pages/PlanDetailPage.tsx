'use client';

import Link from 'next/link';
import React, { useCallback, useEffect, useMemo, useState, type ChangeEvent } from 'react';
import { useRouter } from 'next/navigation';
import { Button, Card, Input, Select, Title } from 'sa2kit/common/ui';
import { ExerciseLibraryPanel } from '../components/ExerciseLibraryPanel';
import { fitnessPlanClient } from '../services/fitnessPlanClient';
import type {
  ExerciseRecord,
  PlanItemInput,
  WorkoutPlanDetail,
  WorkoutPlanItemRecord,
} from '../../../domain/types';
import { EXERCISE_TYPE_LABELS } from '../../../domain/types';

interface EditableItem extends PlanItemInput {
  key: string;
  exerciseName: string;
  exerciseType: 'strength' | 'cardio';
}

function toEditableItem(item: WorkoutPlanItemRecord): EditableItem {
  return {
    key: `item-${item.id}`,
    exerciseId: item.exerciseId,
    exerciseName: item.exercise?.name ?? '未知动作',
    exerciseType: item.exercise?.type ?? 'strength',
    targetSets: item.targetSets,
    targetReps: item.targetReps,
    targetWeight: item.targetWeight,
    restSeconds: item.restSeconds ?? 90,
    targetDurationMinutes: item.targetDurationMinutes,
    targetDistance: item.targetDistance,
    targetCalories: item.targetCalories,
  };
}

function toPayload(items: EditableItem[]): PlanItemInput[] {
  return items.map((item) => ({
    exerciseId: item.exerciseId,
    targetSets: item.targetSets,
    targetReps: item.targetReps,
    targetWeight: item.targetWeight,
    restSeconds: item.restSeconds,
    targetDurationMinutes: item.targetDurationMinutes,
    targetDistance: item.targetDistance,
    targetCalories: item.targetCalories,
  }));
}

export function PlanDetailPage({ planId }: { planId: string }) {
  const router = useRouter();
  const isNew = planId === 'new';
  const numericId = Number(planId);

  const [plan, setPlan] = useState<WorkoutPlanDetail | null>(null);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [items, setItems] = useState<EditableItem[]>([]);
  const [loading, setLoading] = useState(!isNew);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [libraryOpen, setLibraryOpen] = useState(false);

  const loadPlan = useCallback(async () => {
    if (isNew || !Number.isFinite(numericId)) return;
    setLoading(true);
    setError(null);
    try {
      const data = await fitnessPlanClient.getPlan(numericId);
      setPlan(data);
      setName(data.name);
      setDescription(data.description ?? '');
      setItems(data.items.map(toEditableItem));
    } catch (err) {
      setError(err instanceof Error ? err.message : '加载失败');
    } finally {
      setLoading(false);
    }
  }, [isNew, numericId]);

  useEffect(() => {
    void loadPlan();
  }, [loadPlan]);

  const pageTitle = useMemo(
    () => (isNew ? '新建计划' : plan?.name ?? `计划 #${planId}`),
    [isNew, plan?.name, planId],
  );

  const handleCreate = async () => {
    if (!name.trim()) {
      setError('请填写计划名称');
      return;
    }
    setSaving(true);
    setError(null);
    try {
      const created = await fitnessPlanClient.createPlan(
        { name, description },
        toPayload(items),
      );
      router.replace(`/plans/${created.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : '创建失败');
    } finally {
      setSaving(false);
    }
  };

  const handleSave = async () => {
    if (!plan) return;
    setSaving(true);
    setError(null);
    try {
      await fitnessPlanClient.updatePlan(plan.id, { name, description });
      const updated = await fitnessPlanClient.setPlanItems(plan.id, toPayload(items));
      setPlan(updated);
      setItems(updated.items.map(toEditableItem));
    } catch (err) {
      setError(err instanceof Error ? err.message : '保存失败');
    } finally {
      setSaving(false);
    }
  };

  const handleAddExercise = (exercise: ExerciseRecord) => {
    setItems((prev) => [
      ...prev,
      {
        key: `draft-${exercise.id}-${Date.now()}`,
        exerciseId: exercise.id,
        exerciseName: exercise.name,
        exerciseType: exercise.type,
        targetSets: exercise.type === 'strength' ? 3 : undefined,
        targetReps: exercise.type === 'strength' ? 10 : undefined,
        restSeconds: 90,
        targetDurationMinutes: exercise.type === 'cardio' ? 20 : undefined,
      },
    ]);
  };

  const updateItem = (key: string, patch: Partial<EditableItem>) => {
    setItems((prev) => prev.map((item) => (item.key === key ? { ...item, ...patch } : item)));
  };

  const removeItem = (key: string) => {
    setItems((prev) => prev.filter((item) => item.key !== key));
  };

  const moveItem = (key: string, direction: -1 | 1) => {
    setItems((prev) => {
      const index = prev.findIndex((item) => item.key === key);
      if (index < 0) return prev;
      const target = index + direction;
      if (target < 0 || target >= prev.length) return prev;
      const next = [...prev];
      [next[index], next[target]] = [next[target], next[index]];
      return next;
    });
  };

  if (loading) {
    return (
      <div className="fp-page">
        <p style={{ color: '#9f927d' }}>加载计划…</p>
      </div>
    );
  }

  return (
    <div className="fp-page">
      <div className="fp-action-row">
        <Link href="/fitness-plan/plans">
          <Button type="default">← 返回列表</Button>
        </Link>
      </div>

      <Title size="middle" color="app-blue">
        {pageTitle}
      </Title>
      <p className="fp-page__desc">编排力量/有氧动作的目标组数、休息或时长。</p>

      <Card pattern="default">
        <div className="fp-settings-form">
          <label className="fp-field">
            <span>计划名称</span>
            <Input value={name} onChange={(e: ChangeEvent<HTMLInputElement>) => setName(e.target.value)} />
          </label>
          <label className="fp-field">
            <span>描述</span>
            <Input
              value={description}
              onChange={(e: ChangeEvent<HTMLInputElement>) => setDescription(e.target.value)}
              placeholder="可选"
            />
          </label>
        </div>
      </Card>

      <div className="fp-action-row">
        <Button type="default" onClick={() => setLibraryOpen(true)}>
          添加动作
        </Button>
        {isNew ? (
          <Button type="primary" loading={saving} onClick={() => void handleCreate()}>
            创建计划
          </Button>
        ) : (
          <Button type="primary" loading={saving} onClick={() => void handleSave()}>
            保存编排
          </Button>
        )}
      </div>

      {error ? <p style={{ color: '#e05a5a', margin: 0 }}>{error}</p> : null}

      <div className="fp-plan-items">
        {items.map((item, index) => (
          <Card key={item.key} pattern="app-teal" className="fp-plan-item-card">
            <div className="fp-plan-item-card__head">
              <strong>{item.exerciseName}</strong>
              <span className="fp-tag">{EXERCISE_TYPE_LABELS[item.exerciseType]}</span>
            </div>

            {item.exerciseType === 'strength' ? (
              <div className="fp-item-fields">
                <label>
                  组数
                  <Input
                    type="number"
                    value={String(item.targetSets ?? '')}
                    onChange={(e: ChangeEvent<HTMLInputElement>) =>
                      updateItem(item.key, { targetSets: Number(e.target.value) || 0 })
                    }
                  />
                </label>
                <label>
                  次数
                  <Input
                    type="number"
                    value={String(item.targetReps ?? '')}
                    onChange={(e: ChangeEvent<HTMLInputElement>) =>
                      updateItem(item.key, { targetReps: Number(e.target.value) || 0 })
                    }
                  />
                </label>
                <label>
                  目标重量
                  <Input
                    type="number"
                    value={item.targetWeight != null ? String(item.targetWeight) : ''}
                    onChange={(e: ChangeEvent<HTMLInputElement>) =>
                      updateItem(item.key, {
                        targetWeight: e.target.value ? Number(e.target.value) : undefined,
                      })
                    }
                  />
                </label>
                <label>
                  休息(秒)
                  <Input
                    type="number"
                    value={String(item.restSeconds ?? 90)}
                    onChange={(e: ChangeEvent<HTMLInputElement>) =>
                      updateItem(item.key, { restSeconds: Number(e.target.value) || 90 })
                    }
                  />
                </label>
              </div>
            ) : (
              <div className="fp-item-fields">
                <label>
                  时长(分)
                  <Input
                    type="number"
                    value={String(item.targetDurationMinutes ?? '')}
                    onChange={(e: ChangeEvent<HTMLInputElement>) =>
                      updateItem(item.key, {
                        targetDurationMinutes: Number(e.target.value) || 0,
                      })
                    }
                  />
                </label>
                <label>
                  距离(km)
                  <Input
                    type="number"
                    value={item.targetDistance != null ? String(item.targetDistance) : ''}
                    onChange={(e: ChangeEvent<HTMLInputElement>) =>
                      updateItem(item.key, {
                        targetDistance: e.target.value ? Number(e.target.value) : undefined,
                      })
                    }
                  />
                </label>
                <label>
                  卡路里
                  <Input
                    type="number"
                    value={item.targetCalories != null ? String(item.targetCalories) : ''}
                    onChange={(e: ChangeEvent<HTMLInputElement>) =>
                      updateItem(item.key, {
                        targetCalories: e.target.value ? Number(e.target.value) : undefined,
                      })
                    }
                  />
                </label>
              </div>
            )}

            <div className="fp-plan-card__actions">
              <Button type="dashed" size="small" disabled={index === 0} onClick={() => moveItem(item.key, -1)}>
                上移
              </Button>
              <Button
                type="dashed"
                size="small"
                disabled={index === items.length - 1}
                onClick={() => moveItem(item.key, 1)}
              >
                下移
              </Button>
              <Button type="dashed" size="small" onClick={() => removeItem(item.key)}>
                移除
              </Button>
            </div>
          </Card>
        ))}
      </div>

      {items.length === 0 ? (
        <Card type="dashed">
          <p style={{ margin: 0 }}>还没有动作，点击「添加动作」从动作库选取。</p>
        </Card>
      ) : null}

      <ExerciseLibraryPanel
        open={libraryOpen}
        onClose={() => setLibraryOpen(false)}
        selectMode
        onSelect={handleAddExercise}
      />
    </div>
  );
}
