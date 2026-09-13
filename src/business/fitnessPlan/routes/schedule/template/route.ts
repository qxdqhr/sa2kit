import type { FitnessPlanRouteConfig } from '../../shared';
import { createDb, json } from '../../shared';
import type { ScheduleTemplateInput } from '../../../domain/types';


export function createGetScheduleTemplateHandler(config: FitnessPlanRouteConfig) {
  const dbService = createDb(config);
  return async (request: Request) => {
    try {
      const user = await config.getSessionUser(request);
      if (!user) return json({ error: '未授权访问' }, { status: 401 });

      const data = await dbService.getOrCreateActiveScheduleTemplate(user.id);
      return json({ success: true, data });
    } catch (error) {
      console.error('[fitnessPlan/schedule/template GET]', error);
      return json({ error: '获取循环模板失败' }, { status: 500 });
    }
  }


}

export function createPutScheduleTemplateHandler(config: FitnessPlanRouteConfig) {
  const dbService = createDb(config);
  return async (request: Request) => {
    try {
      const user = await config.getSessionUser(request);
      if (!user) return json({ error: '未授权访问' }, { status: 401 });

      const body = (await request.json()) as ScheduleTemplateInput;
      if (body.cycleWeeks != null && (body.cycleWeeks < 1 || body.cycleWeeks > 12)) {
        return json({ error: '循环周数需在 1–12 之间' }, { status: 400 });
      }

      const data = await dbService.updateScheduleTemplate(user.id, body);
      return json({ success: true, data });
    } catch (error) {
      console.error('[fitnessPlan/schedule/template PUT]', error);
      return json({ error: '更新循环模板失败' }, { status: 500 });
    }
  }

}

