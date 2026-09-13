'use client';

import { comfyPromptApiPath } from '../../../domain/comfyPromptApiPath';

import React, { useCallback, useState } from 'react';
import type {
  ComfyPrompt,
  ComfyPromptGroup,
  ComfyPromptSet,
  ComfyWorkflow,
  PromptFormData,
  PromptGroupFormData,
  PromptKind,
  PromptSetFormData,
  WorkflowFormData,
} from '../../../domain/types';

type ApiResult<T> = { success: boolean; data?: T; message?: string };

async function request<T>(url: string, init?: RequestInit): Promise<ApiResult<T>> {
  const res = await fetch(url, {
    credentials: 'include',
    headers: { 'Content-Type': 'application/json', ...(init?.headers ?? {}) },
    ...init,
  });
  return res.json();
}

export function useComfyPromptData() {
  const [groups, setGroups] = useState<ComfyPromptGroup[]>([]);
  const [prompts, setPrompts] = useState<ComfyPrompt[]>([]);
  const [sets, setSets] = useState<ComfyPromptSet[]>([]);
  const [workflows, setWorkflows] = useState<ComfyWorkflow[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refreshAll = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [g, p, s, w] = await Promise.all([
        request<ComfyPromptGroup[]>(comfyPromptApiPath('groups')),
        request<ComfyPrompt[]>(comfyPromptApiPath('prompts')),
        request<ComfyPromptSet[]>(comfyPromptApiPath('sets')),
        request<ComfyWorkflow[]>(comfyPromptApiPath('workflows')),
      ]);
      if (!g.success || !p.success || !s.success || !w.success) {
        throw new Error(g.message || p.message || s.message || w.message || '加载失败');
      }
      setGroups(g.data ?? []);
      setPrompts(p.data ?? []);
      setSets(s.data ?? []);
      setWorkflows(w.data ?? []);
    } catch (e) {
      setError(e instanceof Error ? e.message : '加载失败');
    } finally {
      setLoading(false);
    }
  }, []);

  const createGroup = useCallback(async (data: PromptGroupFormData) => {
    const res = await request<ComfyPromptGroup>(comfyPromptApiPath('groups'), {
      method: 'POST',
      body: JSON.stringify(data),
    });
    if (!res.success) throw new Error(res.message);
    await refreshAll();
    return res.data!;
  }, [refreshAll]);

  const updateGroup = useCallback(async (id: number, data: Partial<PromptGroupFormData>) => {
    const res = await request<ComfyPromptGroup>(comfyPromptApiPath(`groups/${id}`), {
      method: 'PUT',
      body: JSON.stringify(data),
    });
    if (!res.success) throw new Error(res.message);
    await refreshAll();
  }, [refreshAll]);

  const deleteGroup = useCallback(async (id: number) => {
    const res = await request(comfyPromptApiPath(`groups/${id}`), { method: 'DELETE' });
    if (!res.success) throw new Error(res.message);
    await refreshAll();
  }, [refreshAll]);

  const createPrompt = useCallback(async (data: PromptFormData) => {
    const res = await request<ComfyPrompt>(comfyPromptApiPath('prompts'), {
      method: 'POST',
      body: JSON.stringify(data),
    });
    if (!res.success) throw new Error(res.message);
    await refreshAll();
    return res.data!;
  }, [refreshAll]);

  const updatePrompt = useCallback(async (id: number, data: Partial<PromptFormData>) => {
    const res = await request<ComfyPrompt>(comfyPromptApiPath(`prompts/${id}`), {
      method: 'PUT',
      body: JSON.stringify(data),
    });
    if (!res.success) throw new Error(res.message);
    await refreshAll();
  }, [refreshAll]);

  const deletePrompt = useCallback(async (id: number) => {
    const res = await request(comfyPromptApiPath(`prompts/${id}`), { method: 'DELETE' });
    if (!res.success) throw new Error(res.message);
    await refreshAll();
  }, [refreshAll]);

  const bulkCreatePrompts = useCallback(
    async (items: PromptFormData[]) => {
      const created: ComfyPrompt[] = [];
      for (const item of items) {
        const res = await request<ComfyPrompt>(comfyPromptApiPath('prompts'), {
          method: 'POST',
          body: JSON.stringify(item),
        });
        if (!res.success) throw new Error(res.message);
        if (res.data) created.push(res.data);
      }
      await refreshAll();
      return created;
    },
    [refreshAll],
  );

  const bulkUpdatePrompts = useCallback(
    async (ids: number[], data: Partial<PromptFormData>) => {
      for (const id of ids) {
        const res = await request<ComfyPrompt>(comfyPromptApiPath(`prompts/${id}`), {
          method: 'PUT',
          body: JSON.stringify(data),
        });
        if (!res.success) throw new Error(res.message);
      }
      await refreshAll();
    },
    [refreshAll],
  );

  const bulkAddTagsToPrompts = useCallback(
    async (ids: number[], newTags: string[]) => {
      const tagSet = new Set(newTags.map((t) => t.trim()).filter(Boolean));
      if (!tagSet.size) return;
      for (const id of ids) {
        const prompt = prompts.find((p) => p.id === id);
        if (!prompt) continue;
        const merged = [...new Set([...(prompt.tags ?? []), ...tagSet])];
        const res = await request<ComfyPrompt>(comfyPromptApiPath(`prompts/${id}`), {
          method: 'PUT',
          body: JSON.stringify({ tags: merged }),
        });
        if (!res.success) throw new Error(res.message);
      }
      await refreshAll();
    },
    [prompts, refreshAll],
  );

  const createSet = useCallback(async (data: PromptSetFormData) => {
    const res = await request<ComfyPromptSet>(comfyPromptApiPath('sets'), {
      method: 'POST',
      body: JSON.stringify(data),
    });
    if (!res.success) throw new Error(res.message);
    await refreshAll();
    return res.data!;
  }, [refreshAll]);

  const updateSet = useCallback(async (id: number, data: Partial<PromptSetFormData>) => {
    const res = await request<ComfyPromptSet>(comfyPromptApiPath(`sets/${id}`), {
      method: 'PUT',
      body: JSON.stringify(data),
    });
    if (!res.success) throw new Error(res.message);
    await refreshAll();
  }, [refreshAll]);

  const deleteSet = useCallback(async (id: number) => {
    const res = await request(comfyPromptApiPath(`sets/${id}`), { method: 'DELETE' });
    if (!res.success) throw new Error(res.message);
    await refreshAll();
  }, [refreshAll]);

  const createWorkflow = useCallback(async (data: WorkflowFormData) => {
    const res = await request<ComfyWorkflow>(comfyPromptApiPath('workflows'), {
      method: 'POST',
      body: JSON.stringify(data),
    });
    if (!res.success) throw new Error(res.message);
    await refreshAll();
    return res.data!;
  }, [refreshAll]);

  const updateWorkflow = useCallback(async (id: number, data: Partial<WorkflowFormData>) => {
    const res = await request<ComfyWorkflow>(comfyPromptApiPath(`workflows/${id}`), {
      method: 'PUT',
      body: JSON.stringify(data),
    });
    if (!res.success) throw new Error(res.message);
    await refreshAll();
  }, [refreshAll]);

  const deleteWorkflow = useCallback(async (id: number) => {
    const res = await request(comfyPromptApiPath(`workflows/${id}`), { method: 'DELETE' });
    if (!res.success) throw new Error(res.message);
    await refreshAll();
  }, [refreshAll]);

  const filterPrompts = useCallback(
    (kind?: PromptKind, groupId?: number | null, tag?: string, search?: string) => {
      return prompts.filter((p) => {
        if (kind && p.kind !== kind) return false;
        if (groupId !== undefined && groupId !== null && p.groupId !== groupId) return false;
        if (tag && !(p.tags ?? []).includes(tag)) return false;
        if (search) {
          const q = search.toLowerCase();
          if (!p.title.toLowerCase().includes(q) && !p.content.toLowerCase().includes(q)) return false;
        }
        return true;
      });
    },
    [prompts],
  );

  const allTags = useCallback(() => {
    const tagSet = new Set<string>();
    for (const p of prompts) (p.tags ?? []).forEach((t) => tagSet.add(t));
    for (const s of sets) (s.tags ?? []).forEach((t) => tagSet.add(t));
    for (const w of workflows) (w.tags ?? []).forEach((t) => tagSet.add(t));
    return [...tagSet].sort();
  }, [prompts, sets, workflows]);

  return {
    groups,
    prompts,
    sets,
    workflows,
    loading,
    error,
    refreshAll,
    createGroup,
    updateGroup,
    deleteGroup,
    createPrompt,
    updatePrompt,
    deletePrompt,
    bulkCreatePrompts,
    bulkUpdatePrompts,
    bulkAddTagsToPrompts,
    createSet,
    updateSet,
    deleteSet,
    createWorkflow,
    updateWorkflow,
    deleteWorkflow,
    filterPrompts,
    allTags,
  };
}
