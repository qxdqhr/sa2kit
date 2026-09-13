'use client';

import Link from 'next/link';
import React, { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button, Card, Title } from 'sa2kit/common/ui';
import { ExerciseLibraryPanel } from '../components/ExerciseLibraryPanel';
import { PLAN_TEMPLATE_GROUPS } from '../../../domain/data/planTemplates';
import { fitnessPlanClient } from '../services/fitnessPlanClient';
import type { WorkoutPlanRecord, WorkoutPlanStatus } from '../../../domain/types';
import { FITNESS_GOAL_LABELS } from '../../../domain/types';

export function PlansPage() {
  const router = useRouter();
  const [status, setStatus] = useState<WorkoutPlanStatus>('active');
  const [plans, setPlans] = useState<WorkoutPlanRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [libraryOpen, setLibraryOpen] = useState(false);
  const [copyingGroup, setCopyingGroup] = useState<string | null>(null);

  const loadPlans = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await fitnessPlanClient.listPlans(status);
      setPlans(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : '加载失败');
    } finally {
      setLoading(false);
    }
  }, [status]);

  useEffect(() => {
    void loadPlans();
  }, [loadPlans]);

  const handleCopyGroup = async (groupId: string) => {
    setCopyingGroup(groupId);
    try {
      await fitnessPlanClient.copyTemplateGroup(groupId);
      setStatus('active');
      await loadPlans();
    } catch (err) {
      setError(err instanceof Error ? err.message : '复制模板失败');
    } finally {
      setCopyingGroup(null);
    }
  };

  const handleCopyPlan = async (planId: number) => {
    const copied = await fitnessPlanClient.copyPlan(planId);
    router.push(`/plans/${copied.id}`);
  };

  const handleArchive = async (planId: number) => {
    await fitnessPlanClient.updatePlan(planId, { status: 'archived' });
    await loadPlans();
  };

  const handleRestore = async (planId: number) => {
    await fitnessPlanClient.updatePlan(planId, { status: 'active' });
    await loadPlans();
  };

  const handleDelete = async (planId: number) => {
    if (!window.confirm('确定删除该计划？')) return;
    await fitnessPlanClient.deletePlan(planId);
    await loadPlans();
  };

  return (
    <div className="fp-page">
      <Title size="middle" color="app-blue">
        训练计划
      </Title>
      <p className="fp-page__desc">管理个人计划，或从系统模板一键复制推拉腿 / Upper-Lower / 有氧力量组合。</p>

      <div className="fp-action-row">
        <Link href="/plans/new">
          <Button type="primary">新建计划</Button>
        </Link>
        <Button type="default" onClick={() => setLibraryOpen(true)}>
          动作库
        </Button>
        <Button type={status === 'active' ? 'primary' : 'default'} onClick={() => setStatus('active')}>
          进行中
        </Button>
        <Button type={status === 'archived' ? 'primary' : 'default'} onClick={() => setStatus('archived')}>
          已归档
        </Button>
      </div>

      <Card pattern="app-yellow">
        <Title size="small" color="app-yellow">
          系统模板
        </Title>
        <div className="fp-template-grid">
          {PLAN_TEMPLATE_GROUPS.map((group) => (
            <div key={group.id} className="fp-template-card">
              <strong>{group.title}</strong>
              <p>{group.templateIds.length} 个计划单元</p>
              <Button
                type="default"
                size="small"
                loading={copyingGroup === group.id}
                onClick={() => void handleCopyGroup(group.id)}
              >
                复制到我的计划
              </Button>
            </div>
          ))}
        </div>
      </Card>

      {error ? <p style={{ color: '#e05a5a', margin: 0 }}>{error}</p> : null}
      {loading ? <p style={{ color: '#9f927d' }}>加载中…</p> : null}

      <div className="fp-plan-grid">
        {plans.map((plan) => (
          <Card key={plan.id} pattern="app-blue" className="fp-plan-card">
            <Link href={`/plans/${plan.id}`} className="fp-plan-card__title">
              {plan.name}
            </Link>
            {plan.description ? <p className="fp-plan-card__desc">{plan.description}</p> : null}
            <div className="fp-plan-card__meta">
              <span>{plan.itemCount ?? 0} 个动作</span>
              {plan.goalTags?.slice(0, 2).map((tag) => (
                <span key={tag} className="fp-tag">
                  {FITNESS_GOAL_LABELS[tag as keyof typeof FITNESS_GOAL_LABELS] ?? tag}
                </span>
              ))}
            </div>
            <div className="fp-plan-card__actions">
              <Link href={`/plans/${plan.id}`}>
                <Button type="primary" size="small">
                  编排
                </Button>
              </Link>
              <Button type="default" size="small" onClick={() => void handleCopyPlan(plan.id)}>
                复制
              </Button>
              {status === 'active' ? (
                <Button type="dashed" size="small" onClick={() => void handleArchive(plan.id)}>
                  归档
                </Button>
              ) : (
                <Button type="dashed" size="small" onClick={() => void handleRestore(plan.id)}>
                  恢复
                </Button>
              )}
              <Button type="dashed" size="small" onClick={() => void handleDelete(plan.id)}>
                删除
              </Button>
            </div>
          </Card>
        ))}
      </div>

      {!loading && plans.length === 0 ? (
        <Card type="dashed">
          <p style={{ margin: 0 }}>暂无{status === 'active' ? '进行中' : '已归档'}的计划，可从模板复制或新建。</p>
        </Card>
      ) : null}

      <ExerciseLibraryPanel open={libraryOpen} onClose={() => setLibraryOpen(false)} />
    </div>
  );
}
