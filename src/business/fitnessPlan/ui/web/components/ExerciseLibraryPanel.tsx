'use client';

import React, { useCallback, useEffect, useMemo, useState, type ChangeEvent, type KeyboardEvent } from 'react';
import {
  Button,
  Card,
  Input,
  Modal,
  Select,
  Title,
} from 'sa2kit/common/ui';
import { fitnessPlanClient } from '../services/fitnessPlanClient';
import type { ExerciseFormData, ExerciseRecord, ExerciseType } from '../../../domain/types';
import {
  BODY_PART_LABELS,
  EXERCISE_TYPE_LABELS,
} from '../../../domain/types';

interface ExerciseLibraryPanelProps {
  open: boolean;
  onClose: () => void;
  onSelect?: (exercise: ExerciseRecord) => void;
  selectMode?: boolean;
}

const bodyPartOptions = Object.entries(BODY_PART_LABELS).map(([key, label]) => ({
  key,
  label,
}));

export function ExerciseLibraryPanel({
  open,
  onClose,
  onSelect,
  selectMode = false,
}: ExerciseLibraryPanelProps) {
  const [exercises, setExercises] = useState<ExerciseRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState<'all' | ExerciseType>('all');
  const [bodyPartFilter, setBodyPartFilter] = useState('all');
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState<ExerciseFormData>({
    name: '',
    type: 'strength',
    bodyPart: 'chest',
    equipment: 'dumbbell',
    description: '',
  });

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await fitnessPlanClient.listExercises({
        search: search || undefined,
        type: typeFilter === 'all' ? undefined : typeFilter,
        bodyPart: bodyPartFilter === 'all' ? undefined : bodyPartFilter,
      });
      setExercises(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : '加载失败');
    } finally {
      setLoading(false);
    }
  }, [bodyPartFilter, search, typeFilter]);

  useEffect(() => {
    if (open) void load();
  }, [load, open]);

  const customExercises = useMemo(
    () => exercises.filter((item) => item.isCustom),
    [exercises],
  );

  const handleCreate = async () => {
    if (!form.name.trim()) return;
    await fitnessPlanClient.createExercise(form);
    setShowCreate(false);
    setForm({
      name: '',
      type: 'strength',
      bodyPart: 'chest',
      equipment: 'dumbbell',
      description: '',
    });
    await load();
  };

  const handleDelete = async (id: number) => {
    await fitnessPlanClient.deleteExercise(id);
    await load();
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={selectMode ? '选择动作' : '动作库'}
      width={720}
      footer={
        <>
          <Button type="default" onClick={onClose}>
            关闭
          </Button>
          {!selectMode ? (
            <Button type="primary" onClick={() => setShowCreate(true)}>
              新建自定义动作
            </Button>
          ) : null}
        </>
      }
    >
      <div style={{ display: 'grid', gap: 12 }}>
        <div className="fp-filter-row">
          <Input
            placeholder="搜索动作名称"
            value={search}
            onChange={(e: ChangeEvent<HTMLInputElement>) => setSearch(e.target.value)}
            onKeyDown={(e: KeyboardEvent<HTMLInputElement>) => {
              if (e.key === 'Enter') void load();
            }}
          />
          <Select
            value={typeFilter}
            onChange={(value: string) => setTypeFilter(value as 'all' | ExerciseType)}
            options={[
              { key: 'all', label: '全部类型' },
              { key: 'strength', label: '力量' },
              { key: 'cardio', label: '有氧' },
            ]}
          />
          <Select
            value={bodyPartFilter}
            onChange={setBodyPartFilter}
            options={[{ key: 'all', label: '全部部位' }, ...bodyPartOptions]}
          />
          <Button type="default" onClick={() => void load()}>
            筛选
          </Button>
        </div>

        {error ? <p style={{ color: '#e05a5a', margin: 0 }}>{error}</p> : null}
        {loading ? <p style={{ margin: 0, color: '#9f927d' }}>加载中…</p> : null}

        <div className="fp-exercise-list">
          {exercises.map((exercise) => (
            <Card key={exercise.id} pattern="default" className="fp-exercise-item">
              <div className="fp-exercise-item__head">
                <strong>{exercise.name}</strong>
                <span className="fp-tag">
                  {EXERCISE_TYPE_LABELS[exercise.type]}
                  {exercise.bodyPart ? ` · ${BODY_PART_LABELS[exercise.bodyPart] ?? exercise.bodyPart}` : ''}
                </span>
              </div>
              {exercise.description ? (
                <p className="fp-exercise-item__desc">{exercise.description}</p>
              ) : null}
              <div className="fp-exercise-item__actions">
                {selectMode && onSelect ? (
                  <Button
                    type="primary"
                    size="small"
                    onClick={() => {
                      onSelect(exercise);
                      onClose();
                    }}
                  >
                    选用
                  </Button>
                ) : null}
                {exercise.isCustom ? (
                  <Button
                    type="dashed"
                    size="small"
                    onClick={() => void handleDelete(exercise.id)}
                  >
                    删除
                  </Button>
                ) : null}
              </div>
            </Card>
          ))}
        </div>

        {!selectMode && customExercises.length === 0 ? (
          <p style={{ margin: 0, color: '#9f927d' }}>暂无自定义动作，可点击右上角新建。</p>
        ) : null}
      </div>

      <Modal
        open={showCreate}
        onClose={() => setShowCreate(false)}
        title="新建自定义动作"
        footer={
          <>
            <Button type="default" onClick={() => setShowCreate(false)}>
              取消
            </Button>
            <Button type="primary" onClick={() => void handleCreate()}>
              保存
            </Button>
          </>
        }
      >
        <div style={{ display: 'grid', gap: 12 }}>
          <Input
            placeholder="动作名称"
            value={form.name}
            onChange={(e: ChangeEvent<HTMLInputElement>) => setForm((prev) => ({ ...prev, name: e.target.value }))}
          />
          <Select
            value={form.type}
            onChange={(value: string) =>
              setForm((prev) => ({ ...prev, type: value as ExerciseType }))
            }
            options={[
              { key: 'strength', label: '力量' },
              { key: 'cardio', label: '有氧' },
            ]}
          />
          {form.type === 'strength' ? (
            <Select
              value={form.bodyPart ?? 'chest'}
              onChange={(value: string) => setForm((prev) => ({ ...prev, bodyPart: value }))}
              options={bodyPartOptions}
            />
          ) : (
            <Input
              placeholder="有氧类型，如 running"
              value={form.cardioType ?? ''}
              onChange={(e: ChangeEvent<HTMLInputElement>) =>
                setForm((prev) => ({ ...prev, cardioType: e.target.value }))
              }
            />
          )}
          <Input
            placeholder="说明（可选）"
            value={form.description ?? ''}
            onChange={(e: ChangeEvent<HTMLInputElement>) =>
              setForm((prev) => ({ ...prev, description: e.target.value }))
            }
          />
        </div>
      </Modal>
    </Modal>
  );
}
