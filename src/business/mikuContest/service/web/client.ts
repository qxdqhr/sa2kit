import { createMikuContestApiClient, type Requester } from '../api';

export interface MikuContestWebClientOptions {
  baseUrl?: string;
  basePath?: string;
  headers?: Record<string, string>;
}

const defaultRequester = (options: MikuContestWebClientOptions): Requester => {
  const baseUrl = options.baseUrl || '';
  const commonHeaders = options.headers || {};

  return async <T>(url: string, requestOptions?: { method?: 'GET' | 'POST' | 'PATCH'; body?: unknown }): Promise<T> => {
    const response = await fetch(`${baseUrl}${url}`, {
      method: requestOptions?.method || 'GET',
      headers: {
        'Content-Type': 'application/json',
        ...commonHeaders,
      },
      body: requestOptions?.body ? JSON.stringify(requestOptions.body) : undefined,
    });

    const json = (await response.json()) as T;
    return json;
  };
};

export const createMikuContestWebClient = (options: MikuContestWebClientOptions = {}) => {
  const basePath = options.basePath || '/api/miku-contest';
  return createMikuContestApiClient(basePath, defaultRequester(options));
};
