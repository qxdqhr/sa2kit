import type { FitnessPlanRouteConfig } from '../../../shared';
import { createDb, json } from '../../../shared';
import type { CompleteWorkoutInput } from '../../../../domain/types';


interface RouteParams {
  params: Promise<{ id: string }>;
}

export function createPostSessionsByIdCompleteHandler(config: FitnessPlanRouteConfig) {
  const dbService = createDb(config);
  return async (request: Request, { params }: RouteParams) => {
    try {
      const user = await config.getSessionUser(request);
      if (!user) return json({ error: '未授权访问' }, { status: 401 });

      const { id } = await params;
      const sessionId = Number(id);
      const body = (await request.json()) as CompleteWorkoutInput;

      if (body.status !== 'completed' && body.status !== 'abandoned') {
        return json({ error: 'status 无效' }, { status: 400 });
      }

      const data = await dbService.completeSession(user.id, sessionId, body);
      return json({ success: true, data });
    } catch (error) {
      console.error('[fitnessPlan/sessions/[id]/complete POST]', error);
      return json(
        { error: error instanceof Error ? error.message : '结束训练失败' },
        { status: 400 },
      );
    }
  }

}

