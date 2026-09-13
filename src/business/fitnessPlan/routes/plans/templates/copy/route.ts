import type { FitnessPlanRouteConfig } from '../../../shared';
import { createDb, json } from '../../../shared';


export function createPostPlansTemplatesCopyHandler(config: FitnessPlanRouteConfig) {
  const dbService = createDb(config);
  return async (request: Request) => {
    try {
      const user = await config.getSessionUser(request);
      if (!user) return json({ error: '未授权访问' }, { status: 401 });

      const body = (await request.json()) as { templateId?: string; groupId?: string };

      if (body.groupId) {
        const data = await dbService.copyTemplateGroup(user.id, body.groupId);
        return json({ success: true, data });
      }

      if (!body.templateId) {
        return json({ error: '缺少 templateId 或 groupId' }, { status: 400 });
      }

      const data = await dbService.copyFromTemplate(user.id, body.templateId);
      if (!data) return json({ error: '模板不存在' }, { status: 404 });

      return json({ success: true, data });
    } catch (error) {
      console.error('[fitnessPlan/plans/templates/copy POST]', error);
      return json({ error: '复制模板失败' }, { status: 500 });
    }
  }

}

