import type { FitnessPlanRouteConfig } from '../../shared';
import { createDb, json } from '../../shared';


export function createGetCheckinsTodayHandler(config: FitnessPlanRouteConfig) {
  const dbService = createDb(config);
  return async (request: Request) => {
    try {
      const user = await config.getSessionUser(request);
      if (!user) {
        return json({ error: '未授权访问' }, { status: 401 });
      }

      const dateParam = new URL(request.url).searchParams.get('date');
      const date = dateParam ? new Date(`${dateParam}T12:00:00`) : new Date();
      const data = await dbService.getTodayCheckins(user.id, date);

      return json({ success: true, data });
    } catch (error) {
      console.error('[fitnessPlan/checkins/today GET]', error);
      return json({ error: '获取打卡状态失败' }, { status: 500 });
    }
  }

}

