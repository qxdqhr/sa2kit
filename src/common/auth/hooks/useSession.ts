'use client';

import type { Sa2kitAuthClient } from '../react';

/**
 * 薄封装 Better Auth React `useSession`
 */
export function useSession(authClient: Sa2kitAuthClient) {
  return authClient.useSession();
}

export type UseSessionReturn = ReturnType<typeof useSession>;
