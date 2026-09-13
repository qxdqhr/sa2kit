import type { FitnessPlanRouteConfig } from '../../shared';
import { createDb, json } from '../../shared';
import type { DietEntryInput } from '../../../domain/types';


export function createPostDietEntriesHandler(config: FitnessPlanRouteConfig) {
  const dbService = createDb(config);
  return async (request: Request) => {
    try {
      const user = await config.getSessionUser(request);
      if (!user) return json({ error: '未授权访问' }, { status: 401 });

      const body = (await request.json()) as DietEntryInput;
      if (!body.logDate || !body.mealType || !body.foodName?.trim()) {
        return json({ error: '请填写餐次和名称' }, { status: 400 });
      }

      const data = await dbService.addDietEntry(user.id, body);
      return json({ success: true, data });
    } catch (error) {
      console.error('[fitnessPlan/diet/entries POST]', error);
      const message = error instanceof Error ? error.message : '添加饮食记录失败';
      return json({ error: message }, { status: 500 });
    }
  }

}

