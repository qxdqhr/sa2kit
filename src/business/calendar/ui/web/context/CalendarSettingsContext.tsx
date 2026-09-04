'use client';

import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import {
  type CalendarSettings,
  DEFAULT_CALENDAR_SETTINGS,
  loadCalendarSettings,
  saveCalendarSettings,
} from '../utils/calendarSettingsCore';

interface CalendarSettingsContextValue {
  settings: CalendarSettings;
  updateSettings: (updates: Partial<CalendarSettings>) => void;
  resetSettings: () => void;
  replaceSettings: (settings: CalendarSettings) => void;
}

const CalendarSettingsContext = createContext<CalendarSettingsContextValue | null>(null);

export function CalendarSettingsProvider({ children }: { children: React.ReactNode }) {
  const [settings, setSettings] = useState<CalendarSettings>(DEFAULT_CALENDAR_SETTINGS);

  useEffect(() => {
    setSettings(loadCalendarSettings());
  }, []);

  const replaceSettings = useCallback((next: CalendarSettings) => {
    setSettings(next);
    saveCalendarSettings(next);
  }, []);

  const updateSettings = useCallback((updates: Partial<CalendarSettings>) => {
    setSettings((prev) => {
      const next = { ...prev, ...updates };
      saveCalendarSettings(next);
      return next;
    });
  }, []);

  const resetSettings = useCallback(() => {
    replaceSettings(DEFAULT_CALENDAR_SETTINGS);
  }, [replaceSettings]);

  const value = useMemo(
    () => ({ settings, updateSettings, resetSettings, replaceSettings }),
    [settings, updateSettings, resetSettings, replaceSettings]
  );

  return (
    <CalendarSettingsContext.Provider value={value}>{children}</CalendarSettingsContext.Provider>
  );
}

export function useCalendarSettings() {
  const ctx = useContext(CalendarSettingsContext);
  if (!ctx) {
    throw new Error('useCalendarSettings must be used within CalendarSettingsProvider');
  }
  return ctx;
}
