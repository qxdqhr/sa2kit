import type { FitnessPlanRouteConfig } from '../../shared';
import { createDb, json } from '../../shared';


export function createGetCheckinsHeatmapHandler(config: FitnessPlanRouteConfig) {
  const dbService = createDb(config);
  return async (request: Request) => {
    try {
      const user = await config.getSessionUser(request);
      if (!user) return json({ error: '未授权访问' }, { status: 401 });

      const weeks = Number(new URL(request.url).searchParams.get('weeks') ?? 12);
      const safeWeeks = Number.isFinite(weeks) ? Math.min(Math.max(weeks, 4), 26) : 12;
      const data = await dbService.getCheckinHeatmap(user.id, safeWeeks);
      return json({ success: true, data });
    } catch (error) {
      console.error('[fitnessPlan/checkins/heatmap GET]', error);
      return json({ error: '获取打卡热力图失败' }, { status: 500 });
    }
  }

}

