import type { FitnessPlanRouteConfig } from '../shared';
import { createDb, json } from '../shared';


export function createGetDietHandler(config: FitnessPlanRouteConfig) {
  const dbService = createDb(config);
  return async (request: Request) => {
    try {
      const user = await config.getSessionUser(request);
      if (!user) return json({ error: '未授权访问' }, { status: 401 });

      const date =
        new URL(request.url).searchParams.get('date') ?? formatDateKey(new Date());
      const data = await dbService.getDietDay(user.id, date);
      return json({ success: true, data });
    } catch (error) {
      console.error('[fitnessPlan/diet GET]', error);
      return json({ error: '获取饮食记录失败' }, { status: 500 });
    }
  }

}

