import {
  createComfyPromptDbService,
  type ComfyPromptDrizzleDb,
  type ComfyPromptDbService,
} from '../server';

export type ComfyPromptSessionUser = { id: string };

export type ComfyPromptRouteConfig = {
  db: ComfyPromptDrizzleDb;
  getSessionUser: (request: Request) => Promise<ComfyPromptSessionUser | null>;
};

export function json(data: unknown, statusOrInit: number | { status?: number } = 200) {
  const status = typeof statusOrInit === 'number' ? statusOrInit : (statusOrInit.status ?? 200);
  return Response.json(data, { status });
}

export function ok<T>(data: T) {
  return json({ success: true, data });
}

export function fail(message: string, status = 500) {
  return json({ success: false, message }, status);
}

export function createDb(config: ComfyPromptRouteConfig): ComfyPromptDbService {
  return createComfyPromptDbService(config.db);
}

export async function requireAuthUser(config: ComfyPromptRouteConfig, request: Request) {
  const user = await config.getSessionUser(request);
  if (!user) {
    return { user: null as null, response: fail('未授权访问', 401) };
  }
  return { user, response: null as null };
}
