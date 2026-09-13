import type { FitnessPlanRouteConfig } from '../../shared';
import { createDb, json } from '../../shared';


export function createGetSessionsTodayPlanHandler(config: FitnessPlanRouteConfig) {
  const dbService = createDb(config);
  return async (request: Request) => {
    try {
      const user = await config.getSessionUser(request);
      if (!user) return json({ error: '未授权访问' }, { status: 401 });

      const data = await dbService.resolveTodayPlanId(user.id);
      return json({ success: true, data: { planId: data } });
    } catch (error) {
      console.error('[fitnessPlan/sessions/today-plan GET]', error);
      return json({ error: '获取今日计划失败' }, { status: 500 });
    }
  }

}

