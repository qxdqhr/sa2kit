'use client';

import React, { useCallback, useEffect, useState } from 'react';
import { Button, Card, Title } from 'sa2kit/common/ui';
import { StatsTrendChart } from '../components/stats/StatsTrendChart';
import { fitnessPlanClient } from '../services/fitnessPlanClient';
import type { StatsOverviewPayload } from '../../../domain/types';
import { BODY_PART_LABELS } from '../../../domain/types';

const RANGE_OPTIONS = [30, 90, 180] as const;

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('zh-CN', {
    month: 'numeric',
    day: 'numeric',
  });
}

export function StatsPage() {
  const [rangeDays, setRangeDays] = useState<(typeof RANGE_OPTIONS)[number]>(30);
  const [stats, setStats] = useState<StatsOverviewPayload | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await fitnessPlanClient.getStatsOverview(rangeDays);
      setStats(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : '加载失败');
    } finally {
      setLoading(false);
    }
  }, [rangeDays]);

  useEffect(() => {
    void load();
  }, [load]);

  const maxBodyVolume = Math.max(...(stats?.bodyParts.map((item) => item.volume) ?? [1]), 1);

  return (
    <div className="fp-page">
      <Title size="middle" color="app-teal">
        数据统计
      </Title>
      <p className="fp-page__desc">训练容量趋势、PR 墙、部位分布与饮食热量曲线。</p>

      <div className="fp-action-row">
        {RANGE_OPTIONS.map((days) => (
          <Button
            key={days}
            type={rangeDays === days ? 'primary' : 'default'}
            size="small"
            onClick={() => setRangeDays(days)}
          >
            近 {days} 天
          </Button>
        ))}
      </div>

      {error ? <p className="fp-state-card is-error">{error}</p> : null}
      {loading ? <p className="fp-state-card">加载中…</p> : null}

      {!loading && stats ? (
        <>
          <div className="fp-stats-summary">
            <Card pattern="app-green">
              <span className="fp-stats-summary__label">完成训练</span>
              <strong>{stats.totals.workoutSessions}</strong>
            </Card>
            <Card pattern="app-teal">
              <span className="fp-stats-summary__label">总容量</span>
              <strong>{stats.totals.totalVolume}</strong>
            </Card>
            <Card pattern="app-blue">
              <span className="fp-stats-summary__label">有氧(分)</span>
              <strong>{stats.totals.totalCardioMinutes}</strong>
            </Card>
            <Card pattern="app-pink">
              <span className="fp-stats-summary__label">日均热量</span>
              <strong>{stats.totals.avgDailyCalories}</strong>
            </Card>
            <Card pattern="app-yellow">
              <span className="fp-stats-summary__label">打卡天数</span>
              <strong>{stats.totals.checkinDays}</strong>
            </Card>
          </div>

          <Card pattern="default">
            <Title size="small" color="app-teal">
              趋势（近 14 日）
            </Title>
            <StatsTrendChart trends={stats.trends} />
          </Card>

          <div className="fp-grid-2">
            <Card pattern="app-green">
              <Title size="small" color="app-green">
                部位分布
              </Title>
              {stats.bodyParts.length === 0 ? (
                <p className="fp-state-card">该时段暂无力量训练数据</p>
              ) : (
                <div className="fp-body-part-list">
                  {stats.bodyParts.map((item) => (
                    <div key={item.bodyPart} className="fp-body-part-row">
                      <span>{item.label}</span>
                      <div className="fp-body-part-row__bar-wrap">
                        <div
                          className="fp-body-part-row__bar"
                          style={{ width: `${Math.max(8, (item.volume / maxBodyVolume) * 100)}%` }}
                        />
                      </div>
                      <span className="fp-body-part-row__meta">
                        {item.volume} · {item.setCount} 组
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </Card>

            <Card pattern="app-yellow">
              <Title size="small" color="app-yellow">
                PR 墙（历史最佳重量）
              </Title>
              {stats.prs.length === 0 ? (
                <p className="fp-state-card">完成力量训练后将自动记录 PR</p>
              ) : (
                <div className="fp-pr-grid">
                  {stats.prs.map((pr) => (
                    <div key={pr.exerciseId} className="fp-pr-card">
                      <strong>{pr.exerciseName}</strong>
                      <p className="fp-pr-card__value">
                        {pr.weight} kg × {pr.reps}
                      </p>
                      <p className="fp-pr-card__meta">
                        {pr.bodyPart ? (BODY_PART_LABELS[pr.bodyPart] ?? pr.bodyPart) : '综合'} ·{' '}
                        {formatDate(pr.achievedAt)}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </Card>
          </div>
        </>
      ) : null}

      {!loading && !stats && !error ? (
        <Card pattern="default" type="dashed">
          <p className="fp-state-card">开始记录训练与饮食后，这里会展示你的数据趋势。</p>
        </Card>
      ) : null}
    </div>
  );
}
