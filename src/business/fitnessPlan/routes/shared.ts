import {
  createFitnessPlanDbService,
  type FitnessPlanDrizzleDb,
  type FitnessPlanDbService,
} from '../server';
import type { DietUploader } from '../server/dietUpload';

export type FitnessPlanSessionUser = { id: string };

export type FitnessPlanRouteConfig = {
  db: FitnessPlanDrizzleDb;
  getSessionUser: (request: Request) => Promise<FitnessPlanSessionUser | null>;
  uploadDietImage?: DietUploader;
};

export type IdRouteContext = { params: Promise<{ id: string }> };
export type ItemIdRouteContext = { params: Promise<{ itemId: string }> };
export type SetIdRouteContext = { params: Promise<{ setId: string }> };
export type SessionIdRouteContext = { params: Promise<{ id: string }> };

export function json(data: unknown, statusOrInit: number | { status?: number } = 200) {
  const status = typeof statusOrInit === 'number' ? statusOrInit : (statusOrInit.status ?? 200);
  return Response.json(data, { status });
}

export function unauthorized(message = '未授权访问') {
  return json({ error: message }, 401);
}

export function createDb(config: FitnessPlanRouteConfig): FitnessPlanDbService {
  return createFitnessPlanDbService(config.db);
}

export async function requireUser(config: FitnessPlanRouteConfig, request: Request) {
  const user = await config.getSessionUser(request);
  if (!user) return { user: null as null, response: unauthorized() };
  return { user, response: null as null };
}
