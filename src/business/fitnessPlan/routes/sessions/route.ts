import type { FitnessPlanRouteConfig } from '../shared';
import { createDb, json } from '../shared';
import type { StartWorkoutInput } from '../../domain/types';


export function createGetSessionsHandler(config: FitnessPlanRouteConfig) {
  const dbService = createDb(config);
  return async (request: Request) => {
    try {
      const user = await config.getSessionUser(request);
      if (!user) return json({ error: '未授权访问' }, { status: 401 });

      const data = await dbService.listSessions(user.id);
      return json({ success: true, data });
    } catch (error) {
      console.error('[fitnessPlan/sessions GET]', error);
      return json({ error: '获取训练记录失败' }, { status: 500 });
    }
  }


}

export function createPostSessionsHandler(config: FitnessPlanRouteConfig) {
  const dbService = createDb(config);
  return async (request: Request) => {
    try {
      const user = await config.getSessionUser(request);
      if (!user) return json({ error: '未授权访问' }, { status: 401 });

      const body = (await request.json()) as StartWorkoutInput;
      const data = await dbService.startSession(user.id, body);
      return json({ success: true, data });
    } catch (error) {
      console.error('[fitnessPlan/sessions POST]', error);
      return json(
        { error: error instanceof Error ? error.message : '开始训练失败' },
        { status: 400 },
      );
    }
  }

}

