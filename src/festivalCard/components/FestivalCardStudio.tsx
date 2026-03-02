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
    <div style={{ display: 'grid', gridTemplateColumns: '1.4fr 1fr', gap: 16 }}>
      <FestivalCardBook3D config={config} />
      <div>
        <FestivalCardConfigEditor value={config} onChange={setConfig} />
        {onSave ? (
          <button
            type="button"
            onClick={() => void save()}
            disabled={saving}
            style={{ marginTop: 12, width: '100%', padding: '10px 16px' }}
          >
            {saving ? '保存中...' : '保存配置'}
          </button>
        ) : null}
      </div>
    </div>
  );
};
