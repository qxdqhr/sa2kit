'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { FestivalCardBook3D } from './FestivalCardBook3D';
import type { FestivalCardConfig, FestivalCardConfigSummary } from '../types';

interface FestivalCardManagedPageProps {
  apiBase?: string;
  cardId?: string;
  configPagePath?: string;
}

const isSummary = (value: unknown): value is FestivalCardConfigSummary => {
  if (!value || typeof value !== 'object') return false;
  return typeof (value as { id?: unknown }).id === 'string';
};

const parseListResponse = (data: unknown): FestivalCardConfigSummary[] => {
  if (!data || typeof data !== 'object') return [];
  const payload = (data as { data?: unknown }).data;
  if (!Array.isArray(payload)) return [];
  return payload.filter(isSummary).map((item) => ({ id: item.id, name: item.name }));
};

const parseConfigResponse = (data: unknown): FestivalCardConfig | null => {
  if (!data || typeof data !== 'object') return null;
  const payload = (data as { data?: unknown }).data;
  if (!payload || typeof payload !== 'object') return null;
  if (!Array.isArray((payload as FestivalCardConfig).pages)) return null;
  return payload as FestivalCardConfig;
};

export const FestivalCardManagedPage: React.FC<FestivalCardManagedPageProps> = ({
  apiBase = '/api/festivalCard',
  cardId,
  configPagePath = '/festivalCard/config',
}) => {
  const [list, setList] = useState<FestivalCardConfigSummary[]>([]);
  const [currentCardId, setCurrentCardId] = useState<string>(cardId || '');
  const [config, setConfig] = useState<FestivalCardConfig | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchList = async () => {
      const response = await fetch(apiBase, { cache: 'no-store' });
      const data: unknown = await response.json();
      const items = parseListResponse(data);
      setList(items);
      const first = items[0];
      if (!currentCardId && first) {
        setCurrentCardId(first.id);
      }
    };

    void fetchList();
  }, [apiBase, currentCardId]);

  useEffect(() => {
    if (!currentCardId) return;
    setLoading(true);
    void fetch(`${apiBase}/${encodeURIComponent(currentCardId)}`, { cache: 'no-store' })
      .then((res) => res.json() as Promise<unknown>)
      .then((data) => setConfig(parseConfigResponse(data)))
      .finally(() => setLoading(false));
  }, [apiBase, currentCardId]);

  const configLink = useMemo(() => {
    if (!currentCardId) return configPagePath;
    return `${configPagePath}?cardId=${encodeURIComponent(currentCardId)}`;
  }, [configPagePath, currentCardId]);

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '240px 1fr', gap: 14 }}>
      <aside style={{ borderRadius: 16, padding: 12, background: '#0f172a', color: '#e2e8f0' }}>
        <div style={{ fontSize: 14, marginBottom: 8 }}>卡片列表</div>
        <div style={{ display: 'grid', gap: 8 }}>
          {list.map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => setCurrentCardId(item.id)}
              style={{
                borderRadius: 8,
                border: '1px solid #334155',
                padding: '8px 10px',
                textAlign: 'left',
                background: currentCardId === item.id ? '#1e293b' : '#0b1220',
                color: '#e2e8f0',
              }}
            >
              {item.name || item.id}
            </button>
          ))}
        </div>
        <a href={configLink} style={{ display: 'inline-block', marginTop: 12, color: '#93c5fd', fontSize: 13 }}>
          进入配置页
        </a>
      </aside>

      <div>{loading || !config ? <div>加载中...</div> : <FestivalCardBook3D config={config} />}</div>
    </div>
  );
};
