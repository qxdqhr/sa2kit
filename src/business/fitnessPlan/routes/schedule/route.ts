import type { FitnessPlanRouteConfig } from '../shared';
import { createDb, json } from '../shared';


export function createGetScheduleHandler(config: FitnessPlanRouteConfig) {
  const dbService = createDb(config);
  return async (request: Request) => {
    try {
      const user = await config.getSessionUser(request);
      if (!user) return json({ error: '未授权访问' }, { status: 401 });

      const month = new URL(request.url).searchParams.get('month');
      if (!month || !/^\d{4}-\d{2}$/.test(month)) {
        return json({ error: 'month 参数格式应为 YYYY-MM' }, { status: 400 });
      }

      const data = await dbService.getMonthSchedule(user.id, month);
      return json({ success: true, data });
    } catch (error) {
      console.error('[fitnessPlan/schedule GET]', error);
      return json({ error: '获取日历排期失败' }, { status: 500 });
    }
  }

}

