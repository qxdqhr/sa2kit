'use client';

import React, { createContext, useContext, useMemo } from 'react';
import type { Sa2kitAuthClient } from '../react';
import { useAuthActions, type UseAuthActionsReturn } from '../hooks/useAuthActions';

export type AuthUser = {
  id: string;
  email?: string;
  name?: string;
  phoneNumber?: string | null;
  role?: string;
  image?: string | null;
  [key: string]: unknown;
};

export type AuthContextValue = UseAuthActionsReturn & {
  authClient: Sa2kitAuthClient;
  user: AuthUser | null;
  isAuthenticated: boolean;
  loading: boolean;
  refreshSession: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export type AuthProviderProps = {
  authClient: Sa2kitAuthClient;
  children: React.ReactNode;
};

export function AuthProvider({ authClient, children }: AuthProviderProps) {
  const session = authClient.useSession();
  const actions = useAuthActions(authClient);

  const user = (session.data?.user as AuthUser | undefined) ?? null;

  const value = useMemo<AuthContextValue>(
    () => ({
      authClient,
      user,
      isAuthenticated: !!user,
      loading: session.isPending,
      refreshSession: async () => {
        await session.refetch();
      },
      ...actions,
    }),
    [authClient, user, session.isPending, session.refetch, actions],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuthContext(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error('useAuthContext 必须在 AuthProvider 内使用');
  }
  return ctx;
}
