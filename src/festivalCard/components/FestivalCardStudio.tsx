'use client';

import React from 'react';
import { normalizeFestivalCardConfig } from '../core';
import { useFestivalCardConfig } from '../hooks/useFestivalCardConfig';
import type { FestivalCardConfig } from '../types';
import { FestivalCardBook3D } from './FestivalCardBook3D';
import { FestivalCardConfigEditor } from './FestivalCardConfigEditor';

interface FestivalCardStudioProps {
  initialConfig?: FestivalCardConfig;
  fetchConfig?: () => Promise<FestivalCardConfig>;
  onSave?: (config: FestivalCardConfig) => Promise<void> | void;
}

export const FestivalCardStudio: React.FC<FestivalCardStudioProps> = ({ initialConfig, fetchConfig, onSave }) => {
  const { config, setConfig, loading, save, saving } = useFestivalCardConfig({
    initialConfig: normalizeFestivalCardConfig(initialConfig),
    fetchConfig,
    onSave,
  });

  if (loading) return <div>加载中...</div>;

  return (
    <div className="grid items-start gap-4 lg:grid-cols-[1.45fr_1fr]">
      <FestivalCardBook3D config={config} className="h-full" />
      <div className="lg:sticky lg:top-4">
        <FestivalCardConfigEditor value={config} onChange={setConfig} />
        {onSave ? (
          <button
            type="button"
            onClick={() => void save()}
            disabled={saving}
            className="mt-3 w-full rounded-lg bg-slate-900 px-4 py-2.5 text-sm font-medium text-white disabled:opacity-60"
          >
            {saving ? '保存中...' : '保存配置'}
          </button>
        ) : null}
      </div>
    </div>
  );
};
