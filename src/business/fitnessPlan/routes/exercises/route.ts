import type { FitnessPlanRouteConfig } from '../shared';
import { createDb, json } from '../shared';
import type { ExerciseFormData } from '../../domain/types';


export function createGetExercisesHandler(config: FitnessPlanRouteConfig) {
  const dbService = createDb(config);
  return async (request: Request) => {
    try {
      const user = await config.getSessionUser(request);
      if (!user) return json({ error: '未授权访问' }, { status: 401 });

      const search = new URL(request.url).searchParams.get('search') ?? undefined;
      const type = new URL(request.url).searchParams.get('type') ?? undefined;
      const bodyPart = new URL(request.url).searchParams.get('bodyPart') ?? undefined;

      const data = await dbService.listExercises(user.id, {
        search,
        type,
        bodyPart,
      });

      return json({ success: true, data });
    } catch (error) {
      console.error('[fitnessPlan/exercises GET]', error);
      return json({ error: '获取动作列表失败' }, { status: 500 });
    }
  }


}

export function createPostExercisesHandler(config: FitnessPlanRouteConfig) {
  const dbService = createDb(config);
  return async (request: Request) => {
    try {
      const user = await config.getSessionUser(request);
      if (!user) return json({ error: '未授权访问' }, { status: 401 });

      const body = (await request.json()) as ExerciseFormData;
      if (!body.name?.trim()) {
        return json({ error: '动作名称不能为空' }, { status: 400 });
      }
      if (body.type !== 'strength' && body.type !== 'cardio') {
        return json({ error: '动作类型无效' }, { status: 400 });
      }

      const data = await dbService.createExercise(user.id, body);
      return json({ success: true, data });
    } catch (error) {
      console.error('[fitnessPlan/exercises POST]', error);
      return json({ error: '创建动作失败' }, { status: 500 });
    }
  }

}

