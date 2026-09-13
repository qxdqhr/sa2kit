import type { FitnessPlanRouteConfig } from '../../../../shared';
import { createDb, json } from '../../../../shared';


interface RouteParams {
  params: Promise<{ itemId: string }>;
}

export function createPostSessionsItemsByItemidSetsHandler(config: FitnessPlanRouteConfig) {
  const dbService = createDb(config);
  return async (_request: Request, { params }: RouteParams) => {
    try {
      const user = await config.getSessionUser(_request);
      if (!user) return json({ error: '未授权访问' }, { status: 401 });

      const { itemId } = await params;
      const sessionItemId = Number(itemId);
      const data = await dbService.addWorkoutSet(user.id, sessionItemId);

      return json({ success: true, data });
    } catch (error) {
      console.error('[fitnessPlan/sessions/items/[itemId]/sets POST]', error);
      return json(
        { error: error instanceof Error ? error.message : '添加组失败' },
        { status: 400 },
      );
    }
  }

}

