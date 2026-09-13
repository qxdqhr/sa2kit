import { fitnessPlanApiPath } from '../../../domain/fitnessPlanApiPath';
'use client';

import { useCallback, useEffect } from 'react';
import { useFitnessPlanStore } from '../store/fitnessPlanStore';
import type { FitnessProfileFormData } from '../../../domain/types';
import { parseProfileNumbers } from '../../../domain/types';

async function fetchJson<T>(url: string, init?: RequestInit): Promise<T> {
  const response = await fetch(url, {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      ...(init?.headers ?? {}),
    },
  });

  const payload = await response.json();

  if (!response.ok) {
    throw new Error(payload.error ?? payload.message ?? '请求失败');
  }

  return payload as T;
}

export function useFitnessPlanBootstrap(enabled: boolean) {
  const setProfile = useFitnessPlanStore((s) => s.setProfile);
  const setProfileLoading = useFitnessPlanStore((s) => s.setProfileLoading);
  const setProfileError = useFitnessPlanStore((s) => s.setProfileError);
  const setCheckinToday = useFitnessPlanStore((s) => s.setCheckinToday);
  const setActiveWorkout = useFitnessPlanStore((s) => s.setActiveWorkout);
  const resetForLogout = useFitnessPlanStore((s) => s.resetForLogout);

  const hydrate = useCallback(async () => {
    setProfileLoading(true);
    setProfileError(null);

    try {
      const [profileRes, checkinRes, activeSession] = await Promise.all([
        fetchJson<{ success: boolean; data: ReturnType<typeof parseProfileNumbers> }>(
          fitnessPlanApiPath('profile'),
        ),
        fetchJson<{ success: boolean; data: { daily: boolean; workout: boolean; diet: boolean; weight: boolean } }>(
          fitnessPlanApiPath('checkins/today'),
        ),
        fetchJson<{ success: boolean; data: { id: number; startedAt: string } | null }>(
          fitnessPlanApiPath('sessions/active'),
        ),
      ]);

      setProfile(profileRes.data);
      setCheckinToday(checkinRes.data);
      if (activeSession.data) {
        setActiveWorkout({
          sessionId: activeSession.data.id,
          startedAt: activeSession.data.startedAt,
        });
      } else {
        setActiveWorkout({ sessionId: null, startedAt: null });
      }
    } catch (error) {
      setProfileError(error instanceof Error ? error.message : '加载失败');
    } finally {
      setProfileLoading(false);
    }
  }, [setActiveWorkout, setCheckinToday, setProfile, setProfileError, setProfileLoading]);

  useEffect(() => {
    if (!enabled) {
      resetForLogout();
      return;
    }

    void hydrate();
  }, [enabled, hydrate, resetForLogout]);

  const updateProfile = useCallback(
    async (data: FitnessProfileFormData) => {
      const response = await fetchJson<{
        success: boolean;
        data: ReturnType<typeof parseProfileNumbers>;
      }>(fitnessPlanApiPath('profile'), {
        method: 'PUT',
        body: JSON.stringify(data),
      });
      setProfile(response.data);
      return response.data;
    },
    [setProfile],
  );

  return { hydrate, updateProfile };
}
