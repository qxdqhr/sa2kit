'use client';

import { create } from 'zustand';
import type {
  ActiveWorkoutState,
  CheckinTodayState,
  FitnessProfileClient,
} from '../../../domain/types';
import { formatDateKey } from '../../../domain/types';

interface FitnessPlanUiState {
  selectedDate: string;
  sidebarCollapsed: boolean;
  mobileMoreOpen: boolean;
}

interface FitnessPlanStore {
  profile: FitnessProfileClient | null;
  profileLoading: boolean;
  profileError: string | null;
  ui: FitnessPlanUiState;
  activeWorkout: ActiveWorkoutState;
  checkinToday: CheckinTodayState;
  scheduleViewMonth: string;
  setProfile: (profile: FitnessProfileClient | null) => void;
  setProfileLoading: (loading: boolean) => void;
  setProfileError: (error: string | null) => void;
  setSelectedDate: (date: string) => void;
  setSidebarCollapsed: (collapsed: boolean) => void;
  setMobileMoreOpen: (open: boolean) => void;
  setActiveWorkout: (state: Partial<ActiveWorkoutState>) => void;
  clearActiveWorkout: () => void;
  setCheckinToday: (state: Partial<CheckinTodayState>) => void;
  setScheduleViewMonth: (monthKey: string) => void;
  resetForLogout: () => void;
}

const defaultCheckinToday: CheckinTodayState = {
  daily: false,
  workout: false,
  diet: false,
  weight: false,
};

const defaultActiveWorkout: ActiveWorkoutState = {
  sessionId: null,
  startedAt: null,
};

export const useFitnessPlanStore = create<FitnessPlanStore>((set) => ({
  profile: null,
  profileLoading: false,
  profileError: null,
  ui: {
    selectedDate: formatDateKey(new Date()),
    sidebarCollapsed: false,
    mobileMoreOpen: false,
  },
  activeWorkout: defaultActiveWorkout,
  checkinToday: defaultCheckinToday,
  scheduleViewMonth: formatDateKey(new Date()).slice(0, 7),
  setProfile: (profile) => set({ profile }),
  setProfileLoading: (profileLoading) => set({ profileLoading }),
  setProfileError: (profileError) => set({ profileError }),
  setSelectedDate: (selectedDate) =>
    set((state) => ({
      ui: { ...state.ui, selectedDate },
    })),
  setSidebarCollapsed: (sidebarCollapsed) =>
    set((state) => ({
      ui: { ...state.ui, sidebarCollapsed },
    })),
  setMobileMoreOpen: (mobileMoreOpen) =>
    set((state) => ({
      ui: { ...state.ui, mobileMoreOpen },
    })),
  setActiveWorkout: (patch) =>
    set((state) => ({
      activeWorkout: { ...state.activeWorkout, ...patch },
    })),
  clearActiveWorkout: () => set({ activeWorkout: defaultActiveWorkout }),
  setCheckinToday: (patch) =>
    set((state) => ({
      checkinToday: { ...state.checkinToday, ...patch },
    })),
  setScheduleViewMonth: (scheduleViewMonth) => set({ scheduleViewMonth }),
  resetForLogout: () =>
    set({
      profile: null,
      profileLoading: false,
      profileError: null,
      activeWorkout: defaultActiveWorkout,
      checkinToday: defaultCheckinToday,
    }),
}));
