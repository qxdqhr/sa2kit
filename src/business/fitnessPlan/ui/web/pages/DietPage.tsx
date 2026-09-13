'use client';

import React, { useCallback, useEffect, useMemo, useRef, useState, type ChangeEvent } from 'react';
import { Button, Card, Input, Modal, Select, Title } from 'sa2kit/common/ui';
import { fitnessPlanClient } from '../services/fitnessPlanClient';
import { useFitnessPlanStore } from '../store/fitnessPlanStore';
import type { DietDayPayload, DietLogEntryRecord, MealType } from '../../../domain/types';
import { MEAL_TYPE_LABELS, MEAL_TYPE_ORDER, formatDateKey } from '../../../domain/types';

function shiftDate(dateKey: string, delta: number) {
  const date = new Date(`${dateKey}T12:00:00`);
  date.setDate(date.getDate() + delta);
  return formatDateKey(date);
}

function formatDisplayDate(dateKey: string) {
  const date = new Date(`${dateKey}T12:00:00`);
  return date.toLocaleDateString('zh-CN', {
    month: 'long',
    day: 'numeric',
    weekday: 'short',
  });
}

function groupEntries(entries: DietLogEntryRecord[]) {
  const groups = new Map<MealType, DietLogEntryRecord[]>();
  for (const meal of MEAL_TYPE_ORDER) {
    groups.set(meal, []);
  }
  for (const entry of entries) {
    const list = groups.get(entry.mealType) ?? [];
    list.push(entry);
    groups.set(entry.mealType, list);
  }
  return groups;
}

const mealOptions = MEAL_TYPE_ORDER.map((key) => ({
  key,
  label: MEAL_TYPE_LABELS[key],
}));

export function DietPage() {
  const selectedDate = useFitnessPlanStore((s) => s.ui.selectedDate);
  const setSelectedDate = useFitnessPlanStore((s) => s.setSelectedDate);
  const setCheckinToday = useFitnessPlanStore((s) => s.setCheckinToday);

  const [day, setDay] = useState<DietDayPayload | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [addOpen, setAddOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [form, setForm] = useState({
    mealType: 'lunch' as MealType,
    foodName: '',
    imageUrl: null as string | null,
  });

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await fitnessPlanClient.getDietDay(selectedDate);
      setDay(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : '加载失败');
    } finally {
      setLoading(false);
    }
  }, [selectedDate]);

  useEffect(() => {
    void load();
  }, [load]);

  const grouped = useMemo(
    () => groupEntries(day?.entries ?? []),
    [day?.entries],
  );

  const entryCount = day?.entries.length ?? 0;

  const resetForm = () => {
    setForm({
      mealType: 'lunch',
      foodName: '',
      imageUrl: null,
    });
  };

  const handleUpload = async (file: File) => {
    setUploading(true);
    setError(null);
    try {
      const result = await fitnessPlanClient.uploadDietImage(file);
      setForm((prev) => ({ ...prev, imageUrl: result.imageUrl }));
    } catch (err) {
      setError(err instanceof Error ? err.message : '上传失败');
    } finally {
      setUploading(false);
    }
  };

  const handleAddEntry = async () => {
    if (!form.foodName.trim()) {
      setError('请填写名称');
      return;
    }

    setSaving(true);
    setError(null);
    try {
      const data = await fitnessPlanClient.addDietEntry({
        logDate: selectedDate,
        mealType: form.mealType,
        foodName: form.foodName.trim(),
        imageUrl: form.imageUrl,
      });
      setDay(data);
      if (selectedDate === formatDateKey(new Date())) {
        setCheckinToday({ diet: true });
      }
      setAddOpen(false);
      resetForm();
    } catch (err) {
      setError(err instanceof Error ? err.message : '保存失败');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (entryId: number) => {
    if (!window.confirm('确定删除这条饮食记录？')) return;
    try {
      const data = await fitnessPlanClient.deleteDietEntry(entryId);
      setDay(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : '删除失败');
    }
  };

  return (
    <div className="fp-page">
      <Title size="middle" color="app-pink">
        饮食记录
      </Title>
      <p className="fp-page__desc">按日记录餐次、名称与饮食截图（不上线 OCR）。</p>

      <div className="fp-diet-toolbar">
        <Button type="default" size="small" onClick={() => setSelectedDate(shiftDate(selectedDate, -1))}>
          前一天
        </Button>
        <div className="fp-diet-toolbar__date">
          <strong>{formatDisplayDate(selectedDate)}</strong>
          <span>{selectedDate}</span>
        </div>
        <Button type="default" size="small" onClick={() => setSelectedDate(shiftDate(selectedDate, 1))}>
          后一天
        </Button>
        <Button type="default" size="small" onClick={() => setSelectedDate(formatDateKey(new Date()))}>
          今天
        </Button>
      </div>

      <Card pattern="app-pink">
        <div className="fp-diet-summary">
          <div>
            <span className="fp-diet-summary__label">今日记录</span>
            <strong className="fp-diet-summary__value">
              {entryCount}
              <small> 条</small>
            </strong>
          </div>
        </div>
      </Card>

      <div className="fp-action-row">
        <Button type="primary" onClick={() => setAddOpen(true)}>
          添加饮食
        </Button>
      </div>

      {error ? <p style={{ color: '#e05a5a', margin: 0 }}>{error}</p> : null}
      {loading ? <p style={{ color: '#9f927d' }}>加载中…</p> : null}

      {MEAL_TYPE_ORDER.map((mealType) => {
        const entries = grouped.get(mealType) ?? [];
        if (entries.length === 0 && !loading) return null;

        return (
          <Card key={mealType} pattern="default">
            <Title size="small" color="app-pink">
              {MEAL_TYPE_LABELS[mealType]}
            </Title>
            <div className="fp-diet-entry-list">
              {entries.map((entry) => (
                <div key={entry.id} className="fp-diet-entry">
                  {entry.imageUrl ? (
                    <a
                      href={entry.imageUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="fp-diet-entry__thumb-wrap"
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={entry.imageUrl}
                        alt={entry.foodName}
                        className="fp-diet-entry__thumb"
                      />
                    </a>
                  ) : (
                    <div className="fp-diet-entry__thumb-wrap fp-diet-entry__thumb-wrap--empty">
                      🍽
                    </div>
                  )}
                  <div className="fp-diet-entry__body">
                    <strong>{entry.foodName}</strong>
                  </div>
                  <Button type="default" size="small" onClick={() => void handleDelete(entry.id)}>
                    删除
                  </Button>
                </div>
              ))}
            </div>
          </Card>
        );
      })}

      {!loading && entryCount === 0 ? (
        <Card pattern="default" type="dashed">
          <p style={{ margin: 0, color: '#9f927d' }}>
            今天还没有饮食记录，点击「添加饮食」开始记录吧。
          </p>
        </Card>
      ) : null}

      <Modal open={addOpen} onClose={() => setAddOpen(false)} title="添加饮食">
        <div className="fp-diet-form">
          <label className="fp-field">
            <span>餐次</span>
            <Select
              value={form.mealType}
              options={mealOptions}
              onChange={(value: string) => setForm((prev) => ({ ...prev, mealType: value as MealType }))}
            />
          </label>

          <label className="fp-field">
            <span>名称</span>
            <Input
              value={form.foodName}
              onChange={(e: ChangeEvent<HTMLInputElement>) => setForm((prev) => ({ ...prev, foodName: e.target.value }))}
              placeholder="例如：公司午餐、蛋白粉"
            />
          </label>

          <div className="fp-diet-upload">
            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp,image/gif"
              hidden
              onChange={(e: ChangeEvent<HTMLInputElement>) => {
                const file = e.target.files?.[0];
                if (file) void handleUpload(file);
                e.target.value = '';
              }}
            />
            <Button
              type="default"
              loading={uploading}
              onClick={() => fileInputRef.current?.click()}
            >
              上传饮食截图
            </Button>
            {form.imageUrl ? (
              <a href={form.imageUrl} target="_blank" rel="noreferrer" className="fp-diet-upload__preview">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={form.imageUrl} alt="预览" />
              </a>
            ) : null}
          </div>

          <div className="fp-action-row">
            <Button type="primary" loading={saving} onClick={() => void handleAddEntry()}>
              保存
            </Button>
            <Button
              type="default"
              onClick={() => {
                setAddOpen(false);
                resetForm();
              }}
            >
              取消
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
