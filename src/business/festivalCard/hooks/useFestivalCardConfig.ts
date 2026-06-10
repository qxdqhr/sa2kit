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
    const fetchConfig = options?.fetchConfig;
    if (!fetchConfig) return;

    let active = true;
    void fetchConfig()
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
  }, [options?.fetchConfig]);

  const save = useCallback(async () => {
    const onSave = options?.onSave;
    if (!onSave) return;
    setSaving(true);
    try {
      await onSave(config);
    } finally {
      setSaving(false);
    }
  }, [config, options?.onSave]);

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
