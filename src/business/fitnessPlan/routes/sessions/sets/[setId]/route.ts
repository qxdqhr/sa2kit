import type { FitnessPlanRouteConfig } from '../../../shared';
import { createDb, json } from '../../../shared';
import type { UpdateWorkoutSetInput } from '../../../../domain/types';


interface RouteParams {
  params: Promise<{ setId: string }>;
}

export function createPutSessionsSetsBySetidHandler(config: FitnessPlanRouteConfig) {
  const dbService = createDb(config);
  return async (request: Request, { params }: RouteParams) => {
    try {
      const user = await config.getSessionUser(request);
      if (!user) return json({ error: '未授权访问' }, { status: 401 });

      const { setId } = await params;
      const body = (await request.json()) as UpdateWorkoutSetInput;
      const data = await dbService.updateWorkoutSet(user.id, Number(setId), body);

      return json({ success: true, data });
    } catch (error) {
      console.error('[fitnessPlan/sessions/sets/[setId] PUT]', error);
      return json(
        { error: error instanceof Error ? error.message : '更新组记录失败' },
        { status: 400 },
      );
    }
  }

}

