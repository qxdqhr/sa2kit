import type { FitnessPlanRouteConfig } from '../../../shared';
import { createDb, json } from '../../../shared';


interface RouteParams {
  params: Promise<{ id: string }>;
}

export function createPostSessionsByIdExercisesHandler(config: FitnessPlanRouteConfig) {
  const dbService = createDb(config);
  return async (request: Request, { params }: RouteParams) => {
    try {
      const user = await config.getSessionUser(request);
      if (!user) return json({ error: '未授权访问' }, { status: 401 });

      const { id } = await params;
      const sessionId = Number(id);
      const body = (await request.json()) as { exerciseId?: number };

      if (!body.exerciseId) {
        return json({ error: '缺少 exerciseId' }, { status: 400 });
      }

      const data = await dbService.addSessionExercise(
        user.id,
        sessionId,
        body.exerciseId,
      );

      return json({ success: true, data });
    } catch (error) {
      console.error('[fitnessPlan/sessions/[id]/exercises POST]', error);
      return json(
        { error: error instanceof Error ? error.message : '添加动作失败' },
        { status: 400 },
      );
    }
  }

}

