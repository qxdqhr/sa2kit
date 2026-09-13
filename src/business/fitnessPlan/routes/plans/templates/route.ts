import type { FitnessPlanRouteConfig } from '../../shared';
import { createDb, json } from '../../shared';


export function createGetPlansTemplatesHandler(config: FitnessPlanRouteConfig) {
  const dbService = createDb(config);
  return async (request: Request) => {
    try {
      const user = await config.getSessionUser(request);
      if (!user) return json({ error: '未授权访问' }, { status: 401 });

      return json({ success: true, data: PLAN_TEMPLATES });
    } catch (error) {
      console.error('[fitnessPlan/plans/templates GET]', error);
      return json({ error: '获取模板失败' }, { status: 500 });
    }
  }

}

