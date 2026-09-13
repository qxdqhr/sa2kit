'use client';

import React from 'react';

import { ProfileSettingsForm } from '../components/ProfileSettingsForm';
import { Title } from 'sa2kit/common/ui';
import { useFitnessPlanStore } from '../store/fitnessPlanStore';

export { PlansPage } from './PlansPage';
export { PlanDetailPage } from './PlanDetailPage';
export { SchedulePage } from './SchedulePage';
export { WorkoutListPage } from './WorkoutListPage';
export { WorkoutSessionPage } from './WorkoutSessionPage';
export { DietPage } from './DietPage';
export { TodayPage } from './TodayPage';
export { CheckinPage } from './CheckinPage';
export { StatsPage } from './StatsPage';

export function SettingsPage() {
  const profileError = useFitnessPlanStore((s) => s.profileError);

  return (
    <div className="fp-page">
      <Title size="middle" color="app-teal">
        设置
      </Title>
      <p className="fp-page__desc">健身档案、体重与每日热量目标。</p>
      <ProfileSettingsForm />
      {profileError ? (
        <p style={{ color: '#e05a5a', margin: 0 }}>{profileError}</p>
      ) : null}
    </div>
  );
}
