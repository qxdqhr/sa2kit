import { NextRequest, NextResponse } from 'next/server';
import { HttpLikeRequest, createNapCatWebApi } from './webApi';
import { NapCatClient } from './client';

export interface NextNapCatRouteConfig {
  client: NapCatClient;
  basePath?: string;
  onWebhookEvent?: (event: Record<string, unknown>) => Promise<void> | void;
}

export function createNextNapCatRouteHandler(config: NextNapCatRouteConfig) {
  const basePath = config.basePath ?? '/api/qqbot';
  const handle = createNapCatWebApi(config.client, {
    onWebhookEvent: config.onWebhookEvent,
  });

  return async function handler(request: NextRequest) {
    const url = new URL(request.url);
    const path = url.pathname.startsWith(basePath) ? url.pathname.slice(basePath.length) || '/' : url.pathname;

    const body = request.method.toUpperCase() === 'GET' ? undefined : await request.json().catch(() => undefined);

    const payload: HttpLikeRequest = {
      method: request.method,
      path,
      body,
    };

    const result = await handle(payload);
    return NextResponse.json(result.body, { status: result.status, headers: result.headers });
  };
}
