import { NapCatWebhookEvent, NapCatWebApiResponse } from '../types';
import { NapCatClient } from './client';

export interface HttpLikeRequest {
  method: string;
  path: string;
  body?: unknown;
}

export interface HttpLikeResponse {
  status: number;
  headers?: Record<string, string>;
  body: NapCatWebApiResponse<unknown>;
}

export interface NapCatWebApiOptions {
  onWebhookEvent?: (event: NapCatWebhookEvent) => Promise<void> | void;
}

function json(status: number, body: NapCatWebApiResponse<unknown>): HttpLikeResponse {
  return {
    status,
    headers: { 'Content-Type': 'application/json' },
    body,
  };
}

export function createNapCatWebApi(client: NapCatClient, options: NapCatWebApiOptions = {}) {
  return async function handle(request: HttpLikeRequest): Promise<HttpLikeResponse> {
    const method = request.method.toUpperCase();

    if (method === 'GET' && request.path === '/health') {
      return json(200, { ok: true, data: { service: 'qqbot-napcat-bridge' } });
    }

    if (method === 'POST' && request.path === '/send/group') {
      const result = await client.sendGroupMessage((request.body ?? {}) as any);
      return json(result.status === 'ok' ? 200 : 502, {
        ok: result.status === 'ok',
        data: result.data,
        error: result.message,
      });
    }

    if (method === 'POST' && request.path === '/send/private') {
      const result = await client.sendPrivateMessage((request.body ?? {}) as any);
      return json(result.status === 'ok' ? 200 : 502, {
        ok: result.status === 'ok',
        data: result.data,
        error: result.message,
      });
    }

    if (method === 'POST' && request.path === '/groups') {
      const result = await client.getGroupList();
      return json(result.status === 'ok' ? 200 : 502, {
        ok: result.status === 'ok',
        data: result.data,
        error: result.message,
      });
    }

    if (method === 'POST' && request.path === '/friends') {
      const result = await client.getFriendList();
      return json(result.status === 'ok' ? 200 : 502, {
        ok: result.status === 'ok',
        data: result.data,
        error: result.message,
      });
    }

    if (method === 'POST' && request.path.startsWith('/action/')) {
      const action = request.path.replace('/action/', '');
      const result = await client.callApi(action, (request.body ?? {}) as Record<string, unknown>);
      return json(result.status === 'ok' ? 200 : 502, {
        ok: result.status === 'ok',
        data: result.data,
        error: result.message,
      });
    }

    if (method === 'POST' && request.path === '/webhook/event') {
      const event = (request.body ?? {}) as NapCatWebhookEvent;
      await options.onWebhookEvent?.(event);
      return json(200, { ok: true });
    }

    return json(404, { ok: false, error: `Route not found: ${method} ${request.path}` });
  };
}
