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
  const [currentCardId, setCurrentCardId] = useState<string>(cardId || '');
  const [config, setConfig] = useState<FestivalCardConfig | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchList = async () => {
      const response = await fetch(apiBase, { cache: 'no-store' });
      const data: unknown = await response.json();
      const items = parseListResponse(data);
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
    <div className="space-y-4">
      <div className="flex justify-end">
        <a href={configLink} className="rounded-lg border border-slate-700 bg-slate-900 px-3 py-1.5 text-sm text-sky-300">
          进入配置页
        </a>
      </div>

      <div>{loading || !config ? <div className="py-12 text-center text-slate-400">加载中...</div> : <FestivalCardBook3D config={config} />}</div>
    </div>
  );
};
