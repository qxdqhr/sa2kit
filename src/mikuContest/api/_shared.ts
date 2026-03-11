import { mikuContestDbService } from '../server';
import type { MikuContestRouteConfig } from '../routes';

export function ensureMikuContestDbReady(): Response | null {
  if (mikuContestDbService.isConfigured()) return null;

  return Response.json(
    {
      success: false,
      error:
        'MikuContest DB is not initialized. Please call mikuContestDbService.setDb(db) or use create*Handler from sa2kit/mikuContest/routes with db injection.',
    },
    { status: 500 },
  );
}

export function createDefaultMikuContestRouteConfig(): MikuContestRouteConfig {
  return {
    db: mikuContestDbService.db,
  };
}

export function withMikuContestDbGuard<T extends unknown[]>(
  handler: (...args: T) => Promise<Response>,
) {
  return async (...args: T): Promise<Response> => {
    const dbError = ensureMikuContestDbReady();
    if (dbError) return dbError;
    return handler(...args);
  };
}
