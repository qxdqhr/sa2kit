import type { FitnessPlanRouteConfig } from '../../../shared';
import { createDb, json } from '../../../shared';
import type { DietEntryUpdateInput } from '../../../../domain/types';


interface RouteContext {
  params: Promise<{ id: string }>;
}

export function createPutDietEntriesByIdHandler(config: FitnessPlanRouteConfig) {
  const dbService = createDb(config);
  return async (request: Request, context: RouteContext) => {
    try {
      const user = await config.getSessionUser(request);
      if (!user) return json({ error: '未授权访问' }, { status: 401 });

      const { id } = await context.params;
      const entryId = Number(id);
      if (!Number.isFinite(entryId)) {
        return json({ error: '无效的记录 ID' }, { status: 400 });
      }

      const body = (await request.json()) as DietEntryUpdateInput;
      const data = await dbService.updateDietEntry(user.id, entryId, body);
      return json({ success: true, data });
    } catch (error) {
      console.error('[fitnessPlan/diet/entries PUT]', error);
      const message = error instanceof Error ? error.message : '更新饮食记录失败';
      return json({ error: message }, { status: 500 });
    }
  }


}

export function createDeleteDietEntriesByIdHandler(config: FitnessPlanRouteConfig) {
  const dbService = createDb(config);
  return async (request: Request, context: RouteContext) => {
    try {
      const user = await config.getSessionUser(request);
      if (!user) return json({ error: '未授权访问' }, { status: 401 });

      const { id } = await context.params;
      const entryId = Number(id);
      if (!Number.isFinite(entryId)) {
        return json({ error: '无效的记录 ID' }, { status: 400 });
      }

      const data = await dbService.deleteDietEntry(user.id, entryId);
      return json({ success: true, data });
    } catch (error) {
      console.error('[fitnessPlan/diet/entries DELETE]', error);
      const message = error instanceof Error ? error.message : '删除饮食记录失败';
      return json({ error: message }, { status: 500 });
    }
  }

}

