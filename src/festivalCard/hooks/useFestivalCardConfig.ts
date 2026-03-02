'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { DEFAULT_FESTIVAL_CARD_CONFIG, normalizeFestivalCardConfig } from '../core';
import type { FestivalCardConfig } from '../types';

interface UseFestivalCardConfigOptions {
  initialConfig?: FestivalCardConfig;
  fetchConfig?: () => Promise<FestivalCardConfig>;
  onSave?: (config: FestivalCardConfig) => Promise<void> | void;
}

export const useFestivalCardConfig = (options?: UseFestivalCardConfigOptions) => {
  const [config, setConfig] = useState<FestivalCardConfig>(() =>
    normalizeFestivalCardConfig(options?.initialConfig || DEFAULT_FESTIVAL_CARD_CONFIG)
  );
  const [loading, setLoading] = useState(Boolean(options?.fetchConfig));
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!options?.fetchConfig) return;

    let active = true;
    void options
      .fetchConfig()
      .then((value) => {
        if (!active) return;
        setConfig(normalizeFestivalCardConfig(value));
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [options]);

  const save = useCallback(async () => {
    if (!options?.onSave) return;
    setSaving(true);
    try {
      await options.onSave(config);
    } finally {
      setSaving(false);
    }
  }, [config, options]);

  return useMemo(
    () => ({
      config,
      setConfig,
      loading,
      saving,
      save,
    }),
    [config, loading, save, saving]
  );
};
