'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { fetchAiModels } from '../fetchModels';
import type { AiApiSettings } from '../settingsCore';
import { toServerClientSettings } from '../settingsCore';

export interface UseAiModelsOptions {
  modelsEndpoint?: string;
  debounceMs?: number;
}

export interface UseAiModelsResult {
  visionModels: string[];
  allModels: string[];
  loading: boolean;
  error: string | null;
  refresh: () => void;
}

export function useAiModels(
  settings: AiApiSettings,
  onSuggestedModel?: (model: string) => void,
  options?: UseAiModelsOptions
): UseAiModelsResult {
  const [visionModels, setVisionModels] = useState<string[]>([]);
  const [allModels, setAllModels] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const abortRef = useRef<AbortController | null>(null);
  const onSuggestedRef = useRef(onSuggestedModel);
  const settingsRef = useRef(settings);
  onSuggestedRef.current = onSuggestedModel;
  settingsRef.current = settings;

  const load = useCallback(async () => {
    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    setLoading(true);
    setError(null);

    const currentSettings = settingsRef.current;

    try {
      const clientSettings = toServerClientSettings(currentSettings);
      const result = await fetchAiModels(clientSettings, {
        signal: controller.signal,
        modelsEndpoint: options?.modelsEndpoint,
      });

      if (controller.signal.aborted) return;

      if (!result.success) {
        setVisionModels([]);
        setAllModels([]);
        setError(result.error?.message ?? '获取模型列表失败');
        return;
      }

      setVisionModels(result.visionModels);
      setAllModels(result.models);

      if (result.suggestedVisionModel) {
        const current = currentSettings.visionModel.trim();
        const shouldAutoSelect =
          !current ||
          (!result.visionModels.includes(current) && !result.models.includes(current));

        if (shouldAutoSelect) {
          onSuggestedRef.current?.(result.suggestedVisionModel);
        }
      }
    } catch (err) {
      if (controller.signal.aborted) return;
      setVisionModels([]);
      setAllModels([]);
      setError(err instanceof Error ? err.message : '获取模型列表失败');
    } finally {
      if (!controller.signal.aborted) {
        setLoading(false);
      }
    }
  }, [options?.modelsEndpoint, settings.apiKey, settings.baseUrl]);

  useEffect(() => {
    const debounceMs = options?.debounceMs ?? 600;
    const timer = window.setTimeout(() => {
      void load();
    }, debounceMs);

    return () => {
      window.clearTimeout(timer);
      abortRef.current?.abort();
    };
  }, [load, options?.debounceMs]);

  return {
    visionModels,
    allModels,
    loading,
    error,
    refresh: load,
  };
}
