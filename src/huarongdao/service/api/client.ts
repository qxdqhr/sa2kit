import type { CreateHuarongdaoConfigInput, HuarongdaoConfig, HuarongdaoStateSnapshot } from '../../types';

export type HttpMethod = 'GET' | 'POST' | 'PATCH' | 'DELETE';
export interface Requester {
  <T>(url: string, options?: { method?: HttpMethod; body?: unknown }): Promise<T>;
}

interface ApiEnvelope<T> {
  success: boolean;
  data?: T;
  error?: string;
}

const unwrap = <T>(result: ApiEnvelope<T>): T => {
  if (!result.success || result.data === undefined) throw new Error(result.error || '请求失败');
  return result.data;
};

export const createHuarongdaoApiClient = (basePath: string, requester: Requester) => ({
  async getSnapshot(): Promise<HuarongdaoStateSnapshot> {
    return unwrap(await requester<ApiEnvelope<HuarongdaoStateSnapshot>>(`${basePath}/snapshot`, { method: 'GET' }));
  },
  async listConfigs(): Promise<HuarongdaoConfig[]> {
    return unwrap(await requester<ApiEnvelope<HuarongdaoConfig[]>>(`${basePath}/configs`, { method: 'GET' }));
  },
  async createConfig(input: CreateHuarongdaoConfigInput): Promise<HuarongdaoConfig> {
    return unwrap(await requester<ApiEnvelope<HuarongdaoConfig>>(`${basePath}/configs`, { method: 'POST', body: input }));
  },
  async updateConfig(id: string, patch: Partial<HuarongdaoConfig>): Promise<HuarongdaoConfig> {
    return unwrap(await requester<ApiEnvelope<HuarongdaoConfig>>(`${basePath}/configs`, { method: 'PATCH', body: { id, patch } }));
  },
  async deleteConfig(id: string): Promise<boolean> {
    return unwrap(await requester<ApiEnvelope<boolean>>(`${basePath}/configs`, { method: 'DELETE', body: { id } }));
  },
});
