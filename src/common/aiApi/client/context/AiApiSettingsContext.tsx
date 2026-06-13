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
  type AiApiSettings,
  DEFAULT_AI_API_SETTINGS,
  loadAiApiSettings,
  saveAiApiSettings,
} from '../settingsCore';

export interface AiApiSettingsContextValue {
  settings: AiApiSettings;
  updateSettings: (updates: Partial<AiApiSettings>) => void;
  resetSettings: () => void;
}

export interface AiApiSettingsProviderProps {
  children: React.ReactNode;
  /** 宿主可覆盖默认 baseUrl / model（如 MiMo） */
  defaultSettings?: Partial<AiApiSettings>;
  storageKey?: string;
}

const AiApiSettingsContext = createContext<AiApiSettingsContextValue | null>(null);

export function AiApiSettingsProvider({
  children,
  defaultSettings,
  storageKey,
}: AiApiSettingsProviderProps) {
  const mergedDefaults = useMemo(
    () => ({ ...DEFAULT_AI_API_SETTINGS, ...defaultSettings }),
    [defaultSettings]
  );

  const [settings, setSettings] = useState<AiApiSettings>(mergedDefaults);

  useEffect(() => {
    setSettings(loadAiApiSettings(storageKey, mergedDefaults));
  }, [storageKey, mergedDefaults]);

  const persist = useCallback(
    (next: AiApiSettings) => {
      setSettings(next);
      saveAiApiSettings(next, storageKey);
    },
    [storageKey]
  );

  const updateSettings = useCallback(
    (updates: Partial<AiApiSettings>) => {
      setSettings((prev) => {
        const next = { ...prev, ...updates };
        saveAiApiSettings(next, storageKey);
        return next;
      });
    },
    [storageKey]
  );

  const resetSettings = useCallback(() => {
    persist(mergedDefaults);
  }, [persist, mergedDefaults]);

  const value = useMemo(
    () => ({ settings, updateSettings, resetSettings }),
    [settings, updateSettings, resetSettings]
  );

  return (
    <AiApiSettingsContext.Provider value={value}>{children}</AiApiSettingsContext.Provider>
  );
}

export function useAiApiSettings() {
  const ctx = useContext(AiApiSettingsContext);
  if (!ctx) {
    throw new Error('useAiApiSettings must be used within AiApiSettingsProvider');
  }
  return ctx;
}
