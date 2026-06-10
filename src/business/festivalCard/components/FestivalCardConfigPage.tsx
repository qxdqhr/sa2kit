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
    try {
      const response = await fetch(apiBase, { cache: 'no-store' });
      if (!response.ok) throw new Error(`加载卡片列表失败: ${response.status}`);
      const data: unknown = await response.json();
      const items = parseListResponse(data);
      if (items.length === 0) {
        const fallbackId = 'default-festival-card';
        const fallbackConfig = normalizeFestivalCardConfig({ id: fallbackId, name: 'Holiday Card' });
        await fetch(`${apiBase}/${encodeURIComponent(fallbackId)}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ config: fallbackConfig }),
        });
        setList([{ id: fallbackId, name: fallbackConfig.name }]);
        setSelectedId(fallbackId);
        return;
      }
      setList(items);
    } catch (error) {
      window.alert((error as Error).message || '加载卡片列表失败');
    }
  }, [apiBase]);

  useEffect(() => {
    void reloadList();
  }, [reloadList]);

  const fetchConfig = async (): Promise<FestivalCardConfig> => {
    const response = await fetch(`${apiBase}/${encodeURIComponent(selectedId)}`, { cache: 'no-store' });
    if (!response.ok) {
      const message = `加载配置失败: ${response.status}`;
      window.alert(message);
      throw new Error(message);
    }
    const data: unknown = await response.json();
    return parseConfigResponse(data);
  };

  const saveConfig = async (config: FestivalCardConfig) => {
    try {
      const response = await fetch(`${apiBase}/${encodeURIComponent(selectedId)}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ config }),
      });
      if (!response.ok) throw new Error(`保存失败: ${response.status}`);
      await reloadList();
      window.alert('保存成功');
    } catch (error) {
      window.alert((error as Error).message || '保存失败');
      throw error;
    }
  };

  const createNew = async () => {
    const name = window.prompt('请输入新卡片名称');
    if (!name) return;
    const id = `festival-${Date.now()}`;
    const config = normalizeFestivalCardConfig({
      id,
      name,
    });
    try {
      const response = await fetch(`${apiBase}/${encodeURIComponent(id)}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ config }),
      });
      if (!response.ok) throw new Error(`创建失败: ${response.status}`);
      setSelectedId(id);
      await reloadList();
      window.alert('新卡片创建成功');
    } catch (error) {
      window.alert((error as Error).message || '创建失败');
    }
  };

  const mainLink = useMemo(() => `${mainPagePath}?cardId=${encodeURIComponent(selectedId)}`, [mainPagePath, selectedId]);

  return (
    <div className="grid gap-4">
      <div className="flex flex-wrap items-center gap-2 rounded-xl border border-slate-800 bg-slate-900/50 p-3">
        <select
          value={selectedId}
          onChange={(event) => setSelectedId(event.target.value)}
          className="min-w-[240px] rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 outline-none focus:border-sky-400 focus:ring-2 focus:ring-sky-100"
        >
          {list.map((item) => (
            <option key={item.id} value={item.id}>
              {item.name || item.id}
            </option>
          ))}
        </select>
        <button type="button" onClick={() => void createNew()} className="rounded-lg bg-slate-900 px-3 py-2 text-sm font-medium text-white">
          新建卡片
        </button>
        <a href={mainLink} className="rounded-lg border border-sky-200 bg-sky-50 px-3 py-2 text-sm text-sky-700">
          打开主页面
        </a>
      </div>

      <FestivalCardStudio fetchConfig={fetchConfig} onSave={saveConfig} />
    </div>
  );
};
