'use client';

import { create } from 'zustand';
import type { TeachWorkspaceSummary } from '../types';

interface TeachHubStore {
  workspaces: TeachWorkspaceSummary[];
  listLoading: boolean;
  listError: string | null;
  mobileSidebarOpen: boolean;
  setWorkspaces: (items: TeachWorkspaceSummary[]) => void;
  setListLoading: (loading: boolean) => void;
  setListError: (error: string | null) => void;
  setMobileSidebarOpen: (open: boolean) => void;
  resetForLogout: () => void;
}

export const useTeachHubStore = create<TeachHubStore>((set) => ({
  workspaces: [],
  listLoading: false,
  listError: null,
  mobileSidebarOpen: false,
  setWorkspaces: (items) => set({ workspaces: items }),
  setListLoading: (loading) => set({ listLoading: loading }),
  setListError: (error) => set({ listError: error }),
  setMobileSidebarOpen: (open) => set({ mobileSidebarOpen: open }),
  resetForLogout: () =>
    set({
      workspaces: [],
      listLoading: false,
      listError: null,
      mobileSidebarOpen: false,
    }),
}));
