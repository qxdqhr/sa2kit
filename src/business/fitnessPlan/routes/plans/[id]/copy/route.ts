import type { FitnessPlanRouteConfig } from '../../../shared';
import { createDb, json } from '../../../shared';


interface RouteParams {
  params: Promise<{ id: string }>;
}

export function createPostPlansByIdCopyHandler(config: FitnessPlanRouteConfig) {
  const dbService = createDb(config);
  return async (_request: Request, { params }: RouteParams) => {
    try {
      const user = await config.getSessionUser(_request);
      if (!user) return json({ error: '未授权访问' }, { status: 401 });

      const { id } = await params;
      const planId = Number(id);
      const data = await dbService.copyPlan(user.id, planId);
      if (!data) return json({ error: '计划不存在' }, { status: 404 });

      return json({ success: true, data });
    } catch (error) {
      console.error('[fitnessPlan/plans/[id]/copy POST]', error);
      return json({ error: '复制计划失败' }, { status: 500 });
    }
  }

}

