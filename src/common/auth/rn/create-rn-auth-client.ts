/**
 * Better Auth RN 客户端（Bearer + AsyncStorage，无 Cookie）
 */
import { createAuthClient } from 'better-auth/react';
import { emailOTPClient } from 'better-auth/client/plugins';
import { phoneNumberClient } from 'better-auth/client/plugins';
import {
  clearRnBearerToken,
  getRnBearerToken,
  setRnBearerToken,
} from './token-storage';

export type Sa2kitRnAuthClientOptions = {
  /** 应用根地址，如 http://10.0.2.2:3000 */
  baseURL: string;
  basePath?: string;
};

/**
 * 兼容 legacy `authApiBase`（含 `/api` 或 `/api/auth` 后缀）
 */
export function normalizeRnAuthBaseUrl(authApiBase: string): {
  baseURL: string;
  basePath: string;
} {
  const trimmed = authApiBase.replace(/\/+$/, '');
  if (trimmed.endsWith('/api/auth')) {
    return {
      baseURL: trimmed.slice(0, -'/api/auth'.length),
      basePath: '/api/auth',
    };
  }
  if (trimmed.endsWith('/api')) {
    return {
      baseURL: trimmed.slice(0, -'/api'.length),
      basePath: '/api/auth',
    };
  }
  return {
    baseURL: trimmed,
    basePath: '/api/auth',
  };
}

function buildSa2kitRnAuthClient(options: Sa2kitRnAuthClientOptions) {
  return createAuthClient({
    baseURL: options.baseURL.replace(/\/+$/, ''),
    basePath: options.basePath ?? '/api/auth',
    plugins: [emailOTPClient(), phoneNumberClient()],
    disableDefaultFetchPlugins: false,
    fetchOptions: {
      credentials: 'omit',
      onRequest: async (ctx) => {
        const token = await getRnBearerToken();
        if (token) {
          ctx.headers.set('Authorization', `Bearer ${token}`);
        }
        return ctx;
      },
      onResponse: async (ctx) => {
        const token = ctx.response.headers.get('set-auth-token');
        if (token) {
          await setRnBearerToken(token);
        }
        return ctx;
      },
    },
  });
}

export type Sa2kitRnAuthClient = ReturnType<typeof buildSa2kitRnAuthClient>;

let cachedClient: Sa2kitRnAuthClient | null = null;
let cachedKey = '';

function cacheKey(options: Sa2kitRnAuthClientOptions): string {
  return `${options.baseURL}|${options.basePath ?? '/api/auth'}`;
}

export function createSa2kitRnAuthClient(options: Sa2kitRnAuthClientOptions): Sa2kitRnAuthClient {
  const key = cacheKey(options);
  if (cachedClient && cachedKey === key) {
    return cachedClient;
  }
  cachedClient = buildSa2kitRnAuthClient(options);
  cachedKey = key;
  return cachedClient;
}

/** 从 legacy authApiBase 创建客户端 */
export function createSa2kitRnAuthClientFromApiBase(authApiBase: string): Sa2kitRnAuthClient {
  const { baseURL, basePath } = normalizeRnAuthBaseUrl(authApiBase);
  return createSa2kitRnAuthClient({ baseURL, basePath });
}

export async function initSa2kitRnAuthClient(
  options: Sa2kitRnAuthClientOptions | string,
): Promise<Sa2kitRnAuthClient> {
  const client =
    typeof options === 'string'
      ? createSa2kitRnAuthClientFromApiBase(options)
      : createSa2kitRnAuthClient(options);

  const token = await getRnBearerToken();
  if (token) {
    try {
      await client.getSession();
    } catch {
      await clearRnBearerToken();
    }
  }
  return client;
}

export async function signOutSa2kitRnAuthClient(client: Sa2kitRnAuthClient): Promise<void> {
  try {
    await client.signOut();
  } finally {
    await clearRnBearerToken();
  }
}

export function resetSa2kitRnAuthClientCache(): void {
  cachedClient = null;
  cachedKey = '';
}
