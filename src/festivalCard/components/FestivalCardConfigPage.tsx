'use client';

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { FestivalCardStudio } from './FestivalCardStudio';
import { normalizeFestivalCardConfig } from '../core';
import type { FestivalCardConfig, FestivalCardConfigSummary } from '../types';

interface FestivalCardConfigPageProps {
  apiBase?: string;
  cardId?: string;
  mainPagePath?: string;
}

export const FestivalCardConfigPage: React.FC<FestivalCardConfigPageProps> = ({
  apiBase = '/api/festivalCard',
  cardId,
  mainPagePath = '/festivalCard',
}) => {
  const [list, setList] = useState<FestivalCardConfigSummary[]>([]);
  const [selectedId, setSelectedId] = useState(cardId || 'default-festival-card');

  const parseListResponse = (data: unknown): FestivalCardConfigSummary[] => {
    if (!data || typeof data !== 'object') return [];
    const payload = (data as { data?: unknown }).data;
    if (!Array.isArray(payload)) return [];
    return payload
      .filter((item): item is FestivalCardConfigSummary => Boolean(item && typeof item === 'object' && typeof (item as { id?: unknown }).id === 'string'))
      .map((item) => ({ id: item.id, name: item.name }));
  };

  const parseConfigResponse = (data: unknown): FestivalCardConfig => {
    if (!data || typeof data !== 'object') return normalizeFestivalCardConfig();
    const payload = (data as { data?: unknown }).data;
    if (!payload || typeof payload !== 'object') return normalizeFestivalCardConfig();
    return normalizeFestivalCardConfig(payload as Partial<FestivalCardConfig>);
  };

  const reloadList = useCallback(async () => {
    const response = await fetch(apiBase, { cache: 'no-store' });
    const data: unknown = await response.json();
    setList(parseListResponse(data));
  }, [apiBase]);

  useEffect(() => {
    void reloadList();
  }, [reloadList]);

  const fetchConfig = async (): Promise<FestivalCardConfig> => {
    const response = await fetch(`${apiBase}/${encodeURIComponent(selectedId)}`, { cache: 'no-store' });
    const data: unknown = await response.json();
    return parseConfigResponse(data);
  };

  const saveConfig = async (config: FestivalCardConfig) => {
    await fetch(`${apiBase}/${encodeURIComponent(selectedId)}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ config }),
    });
    await reloadList();
  };

  const createNew = async () => {
    const name = window.prompt('请输入新卡片名称');
    if (!name) return;
    const id = `festival-${Date.now()}`;
    const config = normalizeFestivalCardConfig({
      id,
      name,
    });
    await fetch(`${apiBase}/${encodeURIComponent(id)}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ config }),
    });
    setSelectedId(id);
    await reloadList();
  };

  const mainLink = useMemo(() => `${mainPagePath}?cardId=${encodeURIComponent(selectedId)}`, [mainPagePath, selectedId]);

  return (
    <div style={{ display: 'grid', gap: 12 }}>
      <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
        <select value={selectedId} onChange={(event) => setSelectedId(event.target.value)}>
          {list.map((item) => (
            <option key={item.id} value={item.id}>
              {item.name || item.id}
            </option>
          ))}
        </select>
        <button type="button" onClick={() => void createNew()}>
          新建卡片
        </button>
        <a href={mainLink} style={{ color: '#2563eb', fontSize: 14 }}>
          打开主页面
        </a>
      </div>

      <FestivalCardStudio fetchConfig={fetchConfig} onSave={saveConfig} />
    </div>
  );
};
