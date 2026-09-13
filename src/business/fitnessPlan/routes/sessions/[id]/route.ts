import type { FitnessPlanRouteConfig } from '../../shared';
import { createDb, json } from '../../shared';


interface RouteParams {
  params: Promise<{ id: string }>;
}

export function createGetSessionsByIdHandler(config: FitnessPlanRouteConfig) {
  const dbService = createDb(config);
  return async (_request: Request, { params }: RouteParams) => {
    try {
      const user = await config.getSessionUser(_request);
      if (!user) return json({ error: '未授权访问' }, { status: 401 });

      const { id } = await params;
      const sessionId = Number(id);
      const data = await dbService.getSessionDetail(user.id, sessionId);
      if (!data) return json({ error: '训练不存在' }, { status: 404 });

      return json({ success: true, data });
    } catch (error) {
      console.error('[fitnessPlan/sessions/[id] GET]', error);
      return json({ error: '获取训练详情失败' }, { status: 500 });
    }
  }


}

export function createPutSessionsByIdHandler(config: FitnessPlanRouteConfig) {
  const dbService = createDb(config);
  return async (request: Request, { params }: RouteParams) => {
    try {
      const user = await config.getSessionUser(request);
      if (!user) return json({ error: '未授权访问' }, { status: 401 });

      const { id } = await params;
      const sessionId = Number(id);
      const body = (await request.json()) as { notes?: string | null };

      const data = await dbService.updateSessionNotes(
        user.id,
        sessionId,
        body.notes ?? null,
      );

      return json({ success: true, data });
    } catch (error) {
      console.error('[fitnessPlan/sessions/[id] PUT]', error);
      return json(
        { error: error instanceof Error ? error.message : '更新失败' },
        { status: 400 },
      );
    }
  }

}

