'use client';

import React, { useMemo, useState } from 'react';
import {
  defaultVocaloidBoothConfig,
  normalizeVocaloidBoothConfig,
  type VocaloidBoothConfig,
} from '../core';

export interface BoothConfigPageProps {
  initialConfig?: Partial<VocaloidBoothConfig>;
  onSave?: (config: VocaloidBoothConfig) => Promise<void> | void;
}

export const BoothConfigPage: React.FC<BoothConfigPageProps> = ({ initialConfig, onSave }) => {
  const [config, setConfig] = useState<VocaloidBoothConfig>(
    normalizeVocaloidBoothConfig(initialConfig)
  );
  const [saving, setSaving] = useState(false);

  const extText = useMemo(() => config.allowedExtensions.join(','), [config.allowedExtensions]);

  const update = <K extends keyof VocaloidBoothConfig>(key: K, value: VocaloidBoothConfig[K]) =>
    setConfig((prev) => ({ ...prev, [key]: value }));

  const save = async () => {
    setSaving(true);
    try {
      const normalized = normalizeVocaloidBoothConfig(config);
      setConfig(normalized);
      await onSave?.(normalized);
    } finally {
      setSaving(false);
    }
  };

  const reset = () => setConfig(defaultVocaloidBoothConfig);

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm space-y-3">
      <h3 className="text-lg font-semibold">Vocaloid Booth 配置页</h3>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
        <input className="rounded border px-3 py-2" value={config.boothId} onChange={(e) => update('boothId', e.target.value)} placeholder="boothId" />
        <input className="rounded border px-3 py-2" value={config.title} onChange={(e) => update('title', e.target.value)} placeholder="标题" />
        <input className="rounded border px-3 py-2 md:col-span-2" value={config.description ?? ''} onChange={(e) => update('description', e.target.value)} placeholder="描述" />

        <input className="rounded border px-3 py-2" type="number" value={config.defaultTtlHours} onChange={(e) => update('defaultTtlHours', Number(e.target.value) || 1)} placeholder="默认保存时长（小时）" />
        <input className="rounded border px-3 py-2" type="number" value={config.maxFiles} onChange={(e) => update('maxFiles', Number(e.target.value) || 1)} placeholder="最大文件数" />
        <input className="rounded border px-3 py-2" type="number" value={config.maxSingleFileSizeMb} onChange={(e) => update('maxSingleFileSizeMb', Number(e.target.value) || 1)} placeholder="单文件上限 MB" />
        <input className="rounded border px-3 py-2" type="number" value={config.maxTotalFileSizeMb} onChange={(e) => update('maxTotalFileSizeMb', Number(e.target.value) || 1)} placeholder="总大小上限 MB" />

        <textarea
          className="rounded border px-3 py-2 md:col-span-2"
          rows={3}
          value={extText}
          onChange={(e) =>
            update(
              'allowedExtensions',
              e.target.value
                .split(',')
                .map((v) => v.trim())
                .filter(Boolean)
            )
          }
          placeholder="允许后缀，逗号分隔"
        />
      </div>

      <div className="flex gap-2">
        <button className="rounded bg-indigo-600 px-3 py-2 text-white" disabled={saving} onClick={save}>
          {saving ? '保存中...' : '保存配置'}
        </button>
        <button className="rounded border px-3 py-2" onClick={reset}>
          恢复默认
        </button>
      </div>
    </div>
  );
};
