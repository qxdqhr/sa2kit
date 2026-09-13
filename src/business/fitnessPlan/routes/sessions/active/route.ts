import type { FitnessPlanRouteConfig } from '../../shared';
import { createDb, json } from '../../shared';


export function createGetSessionsActiveHandler(config: FitnessPlanRouteConfig) {
  const dbService = createDb(config);
  return async (request: Request) => {
    try {
      const user = await config.getSessionUser(request);
      if (!user) return json({ error: '未授权访问' }, { status: 401 });

      const data = await dbService.getActiveSession(user.id);
      return json({ success: true, data });
    } catch (error) {
      console.error('[fitnessPlan/sessions/active GET]', error);
      return json({ error: '获取进行中训练失败' }, { status: 500 });
    }
  }

}

