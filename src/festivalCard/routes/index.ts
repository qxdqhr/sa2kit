import { NextResponse } from 'next/server';
import { initializeFestivalCardDb } from '../server/db';
import { FestivalCardService } from '../services';
import { normalizeFestivalCardConfig } from '../core';
import type { FestivalCardConfig, FestivalCardDbAdapter } from '../types';
import type { NextRequest } from 'next/server';

export interface FestivalCardRouteConfig {
  db?: FestivalCardDbAdapter;
}

const createService = (config: FestivalCardRouteConfig) => {
  if (config.db) initializeFestivalCardDb(config.db);
  return new FestivalCardService({ db: config.db });
};

export const createListFestivalCardsHandler = (config: FestivalCardRouteConfig = {}) => {
  const service = createService(config);
  return async (_request: NextRequest) => {
    try {
      const data = await service.listConfigs();
      return NextResponse.json({ success: true, data });
    } catch (error) {
      return NextResponse.json({ success: false, error: (error as Error).message }, { status: 500 });
    }
  };
};

export const createGetFestivalCardHandler = (config: FestivalCardRouteConfig = {}) => {
  const service = createService(config);
  return async (_request: NextRequest, context: { params: { id: string } }) => {
    try {
      const card = await service.getConfig(context.params.id);
      return NextResponse.json({ success: true, data: card });
    } catch (error) {
      return NextResponse.json({ success: false, error: (error as Error).message }, { status: 500 });
    }
  };
};

export const createUpsertFestivalCardHandler = (config: FestivalCardRouteConfig = {}) => {
  const service = createService(config);
  return async (request: NextRequest, context: { params: { id: string } }) => {
    try {
      const body: unknown = await request.json();
      const payload =
        body && typeof body === 'object' && 'config' in body
          ? (body as { config?: unknown }).config
          : undefined;
      const normalized = normalizeFestivalCardConfig((payload || {}) as Partial<FestivalCardConfig>);
      const data = await service.saveConfig(context.params.id, normalized);
      return NextResponse.json({ success: true, data });
    } catch (error) {
      return NextResponse.json({ success: false, error: (error as Error).message }, { status: 500 });
    }
  };
};

export const createDeleteFestivalCardHandler = (config: FestivalCardRouteConfig = {}) => {
  const service = createService(config);
  return async (_request: NextRequest, context: { params: { id: string } }) => {
    try {
      await service.deleteConfig(context.params.id);
      return NextResponse.json({ success: true });
    } catch (error) {
      return NextResponse.json({ success: false, error: (error as Error).message }, { status: 500 });
    }
  };
};
