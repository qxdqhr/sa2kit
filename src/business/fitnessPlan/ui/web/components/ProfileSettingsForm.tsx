'use client';

import React, { useEffect, useState, type ChangeEvent } from 'react';
import {
  Button,
  Card,
  Input,
  Select,
  Title,
} from 'sa2kit/common/ui';
import { fitnessPlanClient } from '../services/fitnessPlanClient';
import { useFitnessPlanStore } from '../store/fitnessPlanStore';
import type { FitnessGoal, FitnessProfileFormData } from '../../../domain/types';
import { FITNESS_GOAL_LABELS } from '../../../domain/types';

const goalOptions = (Object.keys(FITNESS_GOAL_LABELS) as FitnessGoal[]).map((key) => ({
  key,
  label: FITNESS_GOAL_LABELS[key],
}));

export function ProfileSettingsForm() {
  const profile = useFitnessPlanStore((s) => s.profile);
  const setProfile = useFitnessPlanStore((s) => s.setProfile);
  const [form, setForm] = useState<FitnessProfileFormData>({
    goal: 'maintain',
    weightUnit: 'kg',
    dailyCalorieGoal: 2000,
    currentWeight: null,
  });
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!profile) return;
    setForm({
      goal: profile.goal as FitnessGoal,
      weightUnit: profile.weightUnit as 'kg' | 'lb',
      dailyCalorieGoal: profile.dailyCalorieGoal,
      currentWeight:
        profile.currentWeight != null ? Number(profile.currentWeight) : null,
    });
  }, [profile]);

  const handleSave = async () => {
    setSaving(true);
    setMessage(null);
    setError(null);
    try {
      await fitnessPlanClient.updateProfile(form);
      const latest = await fitnessPlanClient.getProfile();
      setProfile(latest);
      setMessage('保存成功');
    } catch (err) {
      setError(err instanceof Error ? err.message : '保存失败');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Card pattern="app-teal">
      <Title size="small" color="app-teal">
        健身档案
      </Title>
      <div className="fp-settings-form">
        <label className="fp-field">
          <span>健身目标</span>
          <Select
            value={form.goal ?? 'maintain'}
            onChange={(value: string) =>
              setForm((prev) => ({ ...prev, goal: value as FitnessGoal }))
            }
            options={goalOptions}
          />
        </label>
        <label className="fp-field">
          <span>每日热量目标 (kcal)</span>
          <Input
            type="number"
            value={String(form.dailyCalorieGoal ?? 2000)}
            onChange={(e: ChangeEvent<HTMLInputElement>) =>
              setForm((prev) => ({
                ...prev,
                dailyCalorieGoal: Number(e.target.value) || 0,
              }))
            }
          />
        </label>
        <label className="fp-field">
          <span>当前体重</span>
          <Input
            type="number"
            placeholder="可选"
            value={form.currentWeight != null ? String(form.currentWeight) : ''}
            onChange={(e: ChangeEvent<HTMLInputElement>) =>
              setForm((prev) => ({
                ...prev,
                currentWeight: e.target.value ? Number(e.target.value) : null,
              }))
            }
          />
        </label>
        <label className="fp-field">
          <span>体重单位</span>
          <Select
            value={form.weightUnit ?? 'kg'}
            onChange={(value: string) =>
              setForm((prev) => ({ ...prev, weightUnit: value as 'kg' | 'lb' }))
            }
            options={[
              { key: 'kg', label: 'kg' },
              { key: 'lb', label: 'lb' },
            ]}
          />
        </label>
      </div>
      <div style={{ marginTop: 16, display: 'flex', gap: 8, alignItems: 'center' }}>
        <Button type="primary" loading={saving} onClick={() => void handleSave()}>
          保存设置
        </Button>
        {message ? <span style={{ color: '#6fba2c', fontWeight: 600 }}>{message}</span> : null}
        {error ? <span style={{ color: '#e05a5a' }}>{error}</span> : null}
      </div>
    </Card>
  );
}
