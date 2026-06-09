import { BaseApiClient } from '../client/base-api-client';
import { ReactNativeStorageAdapter } from '../../../storage/adapters/react-native-adapter';
import { ReactNativeRequestAdapter } from '../../../request/adapters/react-native-adapter';

let cached: BaseApiClient | null = null;
let cachedBase = '';

/** 创建 RN 用 BaseApiClient（AsyncStorage + fetch，无 Cookie） */
export function createRnAuthClient(authApiBase: string): BaseApiClient {
  const base = authApiBase.replace(/\/+$/, '');
  if (cached && cachedBase === base) {
    return cached;
  }
  const client = new BaseApiClient(
    new ReactNativeStorageAdapter(),
    new ReactNativeRequestAdapter(),
    base,
  );
  cached = client;
  cachedBase = base;
  return client;
}

export async function initRnAuthClient(authApiBase: string): Promise<BaseApiClient> {
  const client = createRnAuthClient(authApiBase);
  await client.init();
  return client;
}

/** 切换认证根地址时清空单例缓存 */
export function resetRnAuthClientCache(): void {
  cached = null;
  cachedBase = '';
}
