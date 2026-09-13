import type { FitnessPlanRouteConfig } from '../../shared';
import { createDb, json } from '../../shared';
import type { ScheduleOverrideInput } from '../../../domain/types';


export function createPutScheduleOverridesHandler(config: FitnessPlanRouteConfig) {
  const dbService = createDb(config);
  return async (request: Request) => {
    try {
      const user = await config.getSessionUser(request);
      if (!user) return json({ error: '未授权访问' }, { status: 401 });

      const body = (await request.json()) as ScheduleOverrideInput;
      if (!body.date || !/^\d{4}-\d{2}-\d{2}$/.test(body.date)) {
        return json({ error: 'date 格式应为 YYYY-MM-DD' }, { status: 400 });
      }

      await dbService.setScheduleOverride(user.id, body);
      const month = body.date.slice(0, 7);
      const data = await dbService.getMonthSchedule(user.id, month);

      return json({ success: true, data });
    } catch (error) {
      console.error('[fitnessPlan/schedule/overrides PUT]', error);
      return json({ error: '更新单日排期失败' }, { status: 500 });
    }
  }

}

