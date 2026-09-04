'use client';

import { useCallback, useEffect } from 'react';
import { fetchWorkspaces } from '../services/teachHubClient';
import { useTeachHubStore } from '../store/teachHubStore';

export function useTeachHubBootstrap(enabled: boolean) {
  const setWorkspaces = useTeachHubStore((s) => s.setWorkspaces);
  const setListLoading = useTeachHubStore((s) => s.setListLoading);
  const setListError = useTeachHubStore((s) => s.setListError);

  const reload = useCallback(async () => {
    setListLoading(true);
    setListError(null);
    try {
      const items = await fetchWorkspaces({ status: 'active' });
      setWorkspaces(items);
    } catch (error) {
      setListError(error instanceof Error ? error.message : '加载失败');
      setWorkspaces([]);
    } finally {
      setListLoading(false);
    }
  }, [setListError, setListLoading, setWorkspaces]);

  useEffect(() => {
    if (!enabled) return;
    void reload();
  }, [enabled, reload]);

  return { reload };
}
