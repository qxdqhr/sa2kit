import type { FitnessPlanRouteConfig } from '../../shared';
import { createDb, json } from '../../shared';
import type { WorkoutPlanFormData, WorkoutPlanStatus } from '../../../domain/types';


interface RouteParams {
  params: Promise<{ id: string }>;
}

export function createGetPlansByIdHandler(config: FitnessPlanRouteConfig) {
  const dbService = createDb(config);
  return async (_request: Request, { params }: RouteParams) => {
    try {
      const user = await config.getSessionUser(_request);
      if (!user) return json({ error: '未授权访问' }, { status: 401 });

      const { id } = await params;
      const planId = Number(id);
      const data = await dbService.getPlanDetail(user.id, planId);
      if (!data) return json({ error: '计划不存在' }, { status: 404 });

      return json({ success: true, data });
    } catch (error) {
      console.error('[fitnessPlan/plans/[id] GET]', error);
      return json({ error: '获取计划详情失败' }, { status: 500 });
    }
  }


}

export function createPutPlansByIdHandler(config: FitnessPlanRouteConfig) {
  const dbService = createDb(config);
  return async (request: Request, { params }: RouteParams) => {
    try {
      const user = await config.getSessionUser(request);
      if (!user) return json({ error: '未授权访问' }, { status: 401 });

      const { id } = await params;
      const planId = Number(id);
      const body = (await request.json()) as Partial<WorkoutPlanFormData> & {
        status?: WorkoutPlanStatus;
      };

      const data = await dbService.updatePlan(user.id, planId, body);
      if (!data) return json({ error: '计划不存在' }, { status: 404 });

      return json({ success: true, data });
    } catch (error) {
      console.error('[fitnessPlan/plans/[id] PUT]', error);
      return json({ error: '更新计划失败' }, { status: 500 });
    }
  }


}

export function createDeletePlansByIdHandler(config: FitnessPlanRouteConfig) {
  const dbService = createDb(config);
  return async (_request: Request, { params }: RouteParams) => {
    try {
      const user = await config.getSessionUser(_request);
      if (!user) return json({ error: '未授权访问' }, { status: 401 });

      const { id } = await params;
      const planId = Number(id);
      const ok = await dbService.deletePlan(user.id, planId);
      if (!ok) return json({ error: '计划不存在' }, { status: 404 });

      return json({ success: true });
    } catch (error) {
      console.error('[fitnessPlan/plans/[id] DELETE]', error);
      return json({ error: '删除计划失败' }, { status: 500 });
    }
  }

}

