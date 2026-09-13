'use client';

import Link from 'next/link';
import React, { useCallback, useEffect, useState, type ChangeEvent } from 'react';
import { Button, Card, Input, Title } from 'sa2kit/common/ui';
import { CheckinHeatmap } from '../components/checkin/CheckinHeatmap';
import { fitnessPlanClient } from '../services/fitnessPlanClient';
import { useFitnessPlanStore } from '../store/fitnessPlanStore';
import type { CheckinHeatmapPayload, CheckinType } from '../../../domain/types';
import { CHECKIN_TYPE_LABELS, formatDateKey } from '../../../domain/types';

const MANUAL_TYPES: Array<'daily' | 'weight'> = ['daily', 'weight'];

export function CheckinPage() {
  const today = formatDateKey(new Date());
  const checkinToday = useFitnessPlanStore((s) => s.checkinToday);
  const setCheckinToday = useFitnessPlanStore((s) => s.setCheckinToday);
  const profile = useFitnessPlanStore((s) => s.profile);
  const setProfile = useFitnessPlanStore((s) => s.setProfile);

  const [heatmap, setHeatmap] = useState<CheckinHeatmapPayload | null>(null);
  const [loading, setLoading] = useState(true);
  const [acting, setActing] = useState<CheckinType | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [weightInput, setWeightInput] = useState(
    profile?.currentWeight != null ? String(profile.currentWeight) : '',
  );

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await fitnessPlanClient.getCheckinHeatmap(12);
      setHeatmap(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : '加载失败');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    if (profile?.currentWeight != null) {
      setWeightInput(String(profile.currentWeight));
    }
  }, [profile?.currentWeight]);

  const refreshToday = async () => {
    const state = await fitnessPlanClient.getCheckinsToday(today);
    setCheckinToday(state);
  };

  const handleManualCheckin = async (type: 'daily' | 'weight') => {
    setActing(type);
    setError(null);
    try {
      const currentWeight =
        type === 'weight' && weightInput.trim() !== '' ? Number(weightInput) : undefined;
      if (type === 'weight' && currentWeight != null && !Number.isFinite(currentWeight)) {
        setError('请输入有效体重');
        return;
      }

      const state = await fitnessPlanClient.createManualCheckin({
        date: today,
        type,
        currentWeight: type === 'weight' ? currentWeight ?? null : undefined,
      });
      setCheckinToday(state);
      if (type === 'weight' && currentWeight != null) {
        const updatedProfile = await fitnessPlanClient.getProfile();
        setProfile(updatedProfile);
      }
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : '打卡失败');
    } finally {
      setActing(null);
    }
  };

  const handleRemove = async (type: 'daily' | 'weight') => {
    setActing(type);
    setError(null);
    try {
      const state = await fitnessPlanClient.removeManualCheckin(today, type);
      setCheckinToday(state);
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : '撤销失败');
    } finally {
      setActing(null);
    }
  };

  return (
    <div className="fp-page">
      <Title size="middle" color="app-yellow">
        打卡中心
      </Title>
      <p className="fp-page__desc">综合日打卡、体重打卡、连续 streak 与近 12 周热力图。</p>

      <div className="fp-grid-2">
        <Card pattern="app-yellow">
          <Title size="small" color="app-yellow">
            连续打卡
          </Title>
          <div className="fp-streak-stats">
            <div>
              <span className="fp-streak-stats__label">当前 streak</span>
              <strong className="fp-streak-stats__value">{heatmap?.streak.current ?? 0} 天</strong>
            </div>
            <div>
              <span className="fp-streak-stats__label">最佳 streak</span>
              <strong className="fp-streak-stats__value">{heatmap?.streak.best ?? 0} 天</strong>
            </div>
          </div>
          <p className="fp-page__desc" style={{ marginTop: 12 }}>
            以「综合日打卡」为准；今日或昨日未打卡则当前 streak 归零。
          </p>
        </Card>

        <Card pattern="app-teal">
          <Title size="small" color="app-teal">
            今日进度
          </Title>
          <div className="fp-checkin-grid" style={{ marginTop: 12 }}>
            {(Object.keys(checkinToday) as CheckinType[]).map((key) => (
              <div
                key={key}
                className={`fp-checkin-item ${checkinToday[key] ? 'is-done' : 'is-pending'}`}
              >
                <span>{checkinToday[key] ? '✓' : '○'}</span>
                <span>{CHECKIN_TYPE_LABELS[key]}</span>
              </div>
            ))}
          </div>
        </Card>
      </div>

      <Card pattern="default">
        <Title size="small" color="app-yellow">
          手动打卡
        </Title>
        <p className="fp-page__desc">训练 / 饮食由完成训练或添加饮食自动触发。</p>

        <div className="fp-manual-checkin-list">
          {MANUAL_TYPES.map((type) => (
            <div key={type} className="fp-manual-checkin-item">
              <div>
                <strong>{CHECKIN_TYPE_LABELS[type]}</strong>
                {type === 'weight' ? (
                  <label className="fp-field" style={{ marginTop: 8 }}>
                    <span>当前体重 ({profile?.weightUnit ?? 'kg'})</span>
                    <Input
                      type="number"
                      step="0.1"
                      min={0}
                      value={weightInput}
                      onChange={(e: ChangeEvent<HTMLInputElement>) => setWeightInput(e.target.value)}
                      placeholder="可选，同步到档案"
                    />
                  </label>
                ) : null}
              </div>
              {checkinToday[type] ? (
                <Button
                  type="default"
                  size="small"
                  loading={acting === type}
                  onClick={() => void handleRemove(type)}
                >
                  撤销
                </Button>
              ) : (
                <Button
                  type="primary"
                  size="small"
                  loading={acting === type}
                  onClick={() => void handleManualCheckin(type)}
                >
                  打卡
                </Button>
              )}
            </div>
          ))}
        </div>
      </Card>

      <Card pattern="default">
        <Title size="small" color="app-teal">
          近 12 周热力图
        </Title>
        <p className="fp-page__desc">颜色越深表示当天完成的打卡项越多（最多 4 项）。</p>
        {loading ? <p style={{ color: '#9f927d' }}>加载中…</p> : null}
        {heatmap ? <CheckinHeatmap days={heatmap.days} /> : null}
      </Card>

      {error ? <p style={{ color: '#e05a5a', margin: 0 }}>{error}</p> : null}

      <div className="fp-action-row">
        <Link href="/fitness-plan/schedule">
          <Button type="default">查看训练日历</Button>
        </Link>
        <Button type="default" onClick={() => void refreshToday()}>
          刷新今日状态
        </Button>
      </div>
    </div>
  );
}
