import type { FitnessPlanRouteConfig } from '../shared';
import { createDb, json } from '../shared';
import type { PlanItemInput, WorkoutPlanFormData, WorkoutPlanStatus } from '../../domain/types';


export function createGetPlansHandler(config: FitnessPlanRouteConfig) {
  const dbService = createDb(config);
  return async (request: Request) => {
    try {
      const user = await config.getSessionUser(request);
      if (!user) return json({ error: '未授权访问' }, { status: 401 });

      const status = (new URL(request.url).searchParams.get('status') ?? 'active') as WorkoutPlanStatus;
      const data = await dbService.listPlans(user.id, status);

      return json({ success: true, data });
    } catch (error) {
      console.error('[fitnessPlan/plans GET]', error);
      return json({ error: '获取计划列表失败' }, { status: 500 });
    }
  }


}

export function createPostPlansHandler(config: FitnessPlanRouteConfig) {
  const dbService = createDb(config);
  return async (request: Request) => {
    try {
      const user = await config.getSessionUser(request);
      if (!user) return json({ error: '未授权访问' }, { status: 401 });

      const body = (await request.json()) as WorkoutPlanFormData & { items?: PlanItemInput[] };
      if (!body.name?.trim()) {
        return json({ error: '计划名称不能为空' }, { status: 400 });
      }

      const data = await dbService.createPlan(user.id, body, body.items ?? []);
      return json({ success: true, data });
    } catch (error) {
      console.error('[fitnessPlan/plans POST]', error);
      return json({ error: '创建计划失败' }, { status: 500 });
    }
  }

}

