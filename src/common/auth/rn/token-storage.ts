/**
 * RN Bearer Token 持久化（AsyncStorage）
 */
import { ReactNativeStorageAdapter } from '../../../storage/adapters/react-native-adapter';

export const RN_BEARER_TOKEN_KEY = 'sa2kit_auth_bearer_token';

export type RnBearerTokenStorage = {
  getItem(key: string): Promise<string | null>;
  setItem(key: string, value: string): Promise<void>;
  removeItem(key: string): Promise<void>;
};

let storageOverride: RnBearerTokenStorage | null = null;
const defaultStorage = new ReactNativeStorageAdapter();

function storage(): RnBearerTokenStorage {
  return storageOverride ?? defaultStorage;
}

/** 测试或自定义存储注入 */
export function setRnBearerTokenStorage(next: RnBearerTokenStorage | null): void {
  storageOverride = next;
}

export async function getRnBearerToken(): Promise<string | null> {
  return storage().getItem(RN_BEARER_TOKEN_KEY);
}

export async function setRnBearerToken(token: string): Promise<void> {
  await storage().setItem(RN_BEARER_TOKEN_KEY, token);
}

export async function clearRnBearerToken(): Promise<void> {
  await storage().removeItem(RN_BEARER_TOKEN_KEY);
}
