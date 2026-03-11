import { createHuarongdaoApiClient, type Requester } from '../api';

export interface HuarongdaoWebClientOptions {
  baseUrl?: string;
  basePath?: string;
  headers?: Record<string, string>;
}

const requester = (options: HuarongdaoWebClientOptions): Requester => {
  const baseUrl = options.baseUrl || '';
  return async <T>(url: string, req?: { method?: 'GET' | 'POST' | 'PATCH' | 'DELETE'; body?: unknown }): Promise<T> => {
    const res = await fetch(`${baseUrl}${url}`, {
      method: req?.method || 'GET',
      headers: { 'Content-Type': 'application/json', ...(options.headers || {}) },
      body: req?.body ? JSON.stringify(req.body) : undefined,
    });
    return (await res.json()) as T;
  };
};

export const createHuarongdaoWebClient = (options: HuarongdaoWebClientOptions = {}) => {
  return createHuarongdaoApiClient(options.basePath || '/api/huarongdao', requester(options));
};
