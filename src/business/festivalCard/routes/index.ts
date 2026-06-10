import { NextResponse } from 'next/server';
import { initializeFestivalCardDb } from '../server/db';
import { createFestivalCardDrizzleDbAdapter } from '../server/services/drizzleDbAdapter';
import { FestivalCardService } from '../services';
import { normalizeFestivalCardConfig } from '../core';
import type { FestivalCardConfig, FestivalCardDbAdapter } from '../types';
import type { DrizzleLikeDb } from '../server/services/drizzleDbAdapter';
import type { NextRequest } from 'next/server';

export interface FestivalCardRouteConfig {
  db?: unknown;
  dbAdapter?: FestivalCardDbAdapter;
}

type RouteContext =
  | { params: { id: string } }
  | { params: Promise<{ id: string }> };

const createService = (config: FestivalCardRouteConfig) => {
  const adapter = resolveDbAdapter(config);
  if (adapter) initializeFestivalCardDb(adapter);
  return new FestivalCardService({ db: adapter || undefined });
};

const resolveCardId = async (context: RouteContext): Promise<string> => {
  const params = await context.params;
  return params.id;
};

const isFestivalCardAdapter = (value: unknown): value is FestivalCardDbAdapter => {
  if (!value || typeof value !== 'object') return false;
  const candidate = value as Record<string, unknown>;
  return typeof candidate.getConfig === 'function' && typeof candidate.saveConfig === 'function';
};

const isDrizzleDb = (value: unknown): value is DrizzleLikeDb => {
  if (!value || typeof value !== 'object') return false;
  const candidate = value as Record<string, unknown>;
  return (
    typeof candidate.select === 'function' &&
    typeof candidate.insert === 'function' &&
    typeof candidate.update === 'function' &&
    typeof candidate.delete === 'function'
  );
};

const resolveDbAdapter = (config: FestivalCardRouteConfig): FestivalCardDbAdapter | undefined => {
  if (config.dbAdapter) return config.dbAdapter;
  if (isFestivalCardAdapter(config.db)) return config.db;
  if (isDrizzleDb(config.db)) return createFestivalCardDrizzleDbAdapter(config.db);
  return undefined;
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
  return async (_request: NextRequest, context: RouteContext) => {
    try {
      const cardId = await resolveCardId(context);
      const card = await service.getConfig(cardId);
      return NextResponse.json({ success: true, data: card });
    } catch (error) {
      return NextResponse.json({ success: false, error: (error as Error).message }, { status: 500 });
    }
  };
};

export const createUpsertFestivalCardHandler = (config: FestivalCardRouteConfig = {}) => {
  const service = createService(config);
  return async (request: NextRequest, context: RouteContext) => {
    try {
      const cardId = await resolveCardId(context);
      const body: unknown = await request.json();
      const payload =
        body && typeof body === 'object' && 'config' in body
          ? (body as { config?: unknown }).config
          : undefined;
      const normalized = normalizeFestivalCardConfig((payload || {}) as Partial<FestivalCardConfig>);
      const data = await service.saveConfig(cardId, normalized);
      return NextResponse.json({ success: true, data });
    } catch (error) {
      return NextResponse.json({ success: false, error: (error as Error).message }, { status: 500 });
    }
  };
};

export const createDeleteFestivalCardHandler = (config: FestivalCardRouteConfig = {}) => {
  const service = createService(config);
  return async (_request: NextRequest, context: RouteContext) => {
    try {
      const cardId = await resolveCardId(context);
      await service.deleteConfig(cardId);
      return NextResponse.json({ success: true });
    } catch (error) {
      return NextResponse.json({ success: false, error: (error as Error).message }, { status: 500 });
    }
  };
};
