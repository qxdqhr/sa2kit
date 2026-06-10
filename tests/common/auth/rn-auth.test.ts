import { describe, expect, it, beforeEach } from 'vitest';
import {
  clearRnBearerToken,
  getRnBearerToken,
  setRnBearerToken,
  setRnBearerTokenStorage,
  RN_BEARER_TOKEN_KEY,
} from '../../../src/common/auth/rn/token-storage';
import { normalizeRnAuthBaseUrl } from '../../../src/common/auth/rn/create-rn-auth-client';
import { signInWithRnAuthClient } from '../../../src/common/auth/rn/sign-in';

describe('normalizeRnAuthBaseUrl', () => {
  it('parses /api suffix', () => {
    expect(normalizeRnAuthBaseUrl('http://10.0.2.2:3000/api')).toEqual({
      baseURL: 'http://10.0.2.2:3000',
      basePath: '/api/auth',
    });
  });

  it('parses /api/auth suffix', () => {
    expect(normalizeRnAuthBaseUrl('https://app.test/api/auth')).toEqual({
      baseURL: 'https://app.test',
      basePath: '/api/auth',
    });
  });
});

describe('rn bearer token storage', () => {
  const memory = new Map<string, string>();

  beforeEach(() => {
    memory.clear();
    setRnBearerTokenStorage({
      getItem: async (key) => memory.get(key) ?? null,
      setItem: async (key, value) => {
        memory.set(key, value);
      },
      removeItem: async (key) => {
        memory.delete(key);
      },
    });
  });

  it('stores and clears bearer token', async () => {
    await setRnBearerToken('session-token-abc');
    expect(await getRnBearerToken()).toBe('session-token-abc');
    expect(memory.get(RN_BEARER_TOKEN_KEY)).toBe('session-token-abc');
    await clearRnBearerToken();
    expect(await getRnBearerToken()).toBeNull();
  });
});

describe('signInWithRnAuthClient', () => {
  it('routes phone login to signIn.phoneNumber', async () => {
    const calls: string[] = [];
    const mockClient = {
      signIn: {
        phoneNumber: async () => {
          calls.push('phone');
          return { data: {}, error: null };
        },
        email: async () => {
          calls.push('email');
          return { data: {}, error: null };
        },
      },
    };

    const result = await signInWithRnAuthClient(mockClient as never, '13800138000', 'secret12');
    expect(result.success).toBe(true);
    expect(calls).toEqual(['phone']);
  });

  it('routes email login to signIn.email', async () => {
    const calls: string[] = [];
    const mockClient = {
      signIn: {
        phoneNumber: async () => {
          calls.push('phone');
          return { data: {}, error: null };
        },
        email: async () => {
          calls.push('email');
          return { data: {}, error: null };
        },
      },
    };

    const result = await signInWithRnAuthClient(
      mockClient as never,
      'user@example.com',
      'secret12',
    );
    expect(result.success).toBe(true);
    expect(calls).toEqual(['email']);
  });
});
