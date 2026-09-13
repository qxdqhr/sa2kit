import type { FitnessPlanRouteConfig } from '../../../shared';
import { createDb, json } from '../../../shared';
import type { PlanItemInput } from '../../../../types';


interface RouteParams {
  params: Promise<{ id: string }>;
}

export function createPutPlansByIdItemsHandler(config: FitnessPlanRouteConfig) {
  const dbService = createDb(config);
  return async (request: Request, { params }: RouteParams) => {
    try {
      const user = await config.getSessionUser(request);
      if (!user) return json({ error: '未授权访问' }, { status: 401 });

      const { id } = await params;
      const planId = Number(id);
      const body = (await request.json()) as { items: PlanItemInput[] };

      if (!Array.isArray(body.items)) {
        return json({ error: 'items 必须是数组' }, { status: 400 });
      }

      const data = await dbService.setPlanItems(user.id, planId, body.items);
      if (!data) return json({ error: '计划不存在' }, { status: 404 });

      return json({ success: true, data });
    } catch (error) {
      console.error('[fitnessPlan/plans/[id]/items PUT]', error);
      return json(
        { error: error instanceof Error ? error.message : '保存编排失败' },
        { status: 500 },
      );
    }
  }

}

