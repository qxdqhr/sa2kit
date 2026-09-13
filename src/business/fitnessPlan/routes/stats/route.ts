import type { FitnessPlanRouteConfig } from '../shared';
import { createDb, json } from '../shared';


export function createGetStatsHandler(config: FitnessPlanRouteConfig) {
  const dbService = createDb(config);
  return async (request: Request) => {
    try {
      const user = await config.getSessionUser(request);
      if (!user) return json({ error: '未授权访问' }, { status: 401 });

      const days = Number(new URL(request.url).searchParams.get('days') ?? 30);
      const data = await dbService.getStatsOverview(user.id, days);
      return json({ success: true, data });
    } catch (error) {
      console.error('[fitnessPlan/stats GET]', error);
      return json({ error: '获取统计数据失败' }, { status: 500 });
    }
  }

}

