import type { FitnessPlanRouteConfig } from '../../shared';
import { createDb, json } from '../../shared';
import type { ExerciseFormData } from '../../../domain/types';


interface RouteParams {
  params: Promise<{ id: string }>;
}

export function createPutExercisesByIdHandler(config: FitnessPlanRouteConfig) {
  const dbService = createDb(config);
  return async (request: Request, { params }: RouteParams) => {
    try {
      const user = await config.getSessionUser(request);
      if (!user) return json({ error: '未授权访问' }, { status: 401 });

      const { id } = await params;
      const exerciseId = Number(id);
      if (!Number.isFinite(exerciseId)) {
        return json({ error: '无效的动作 ID' }, { status: 400 });
      }

      const body = (await request.json()) as ExerciseFormData;
      const data = await dbService.updateExercise(user.id, exerciseId, body);
      if (!data) return json({ error: '动作不存在或不可编辑' }, { status: 404 });

      return json({ success: true, data });
    } catch (error) {
      console.error('[fitnessPlan/exercises PUT]', error);
      return json({ error: '更新动作失败' }, { status: 500 });
    }
  }


}

export function createDeleteExercisesByIdHandler(config: FitnessPlanRouteConfig) {
  const dbService = createDb(config);
  return async (request: Request, { params }: RouteParams) => {
    try {
      const user = await config.getSessionUser(request);
      if (!user) return json({ error: '未授权访问' }, { status: 401 });

      const { id } = await params;
      const exerciseId = Number(id);
      const ok = await dbService.deleteExercise(user.id, exerciseId);
      if (!ok) return json({ error: '动作不存在或不可删除' }, { status: 404 });

      return json({ success: true });
    } catch (error) {
      console.error('[fitnessPlan/exercises DELETE]', error);
      return json({ error: '删除动作失败' }, { status: 500 });
    }
  }

}

