import type { FitnessPlanRouteConfig } from '../shared';
import { createDb, json } from '../shared';
import type { ManualCheckinInput } from '../../domain/types';


export function createPostCheckinsHandler(config: FitnessPlanRouteConfig) {
  const dbService = createDb(config);
  return async (request: Request) => {
    try {
      const user = await config.getSessionUser(request);
      if (!user) return json({ error: '未授权访问' }, { status: 401 });

      const body = (await request.json()) as ManualCheckinInput;
      if (body.type !== 'daily' && body.type !== 'weight') {
        return json({ error: '打卡类型无效' }, { status: 400 });
      }

      const data = await dbService.createManualCheckin(user.id, body);
      return json({ success: true, data });
    } catch (error) {
      console.error('[fitnessPlan/checkins POST]', error);
      const message = error instanceof Error ? error.message : '打卡失败';
      return json({ error: message }, { status: 500 });
    }
  }


}

export function createDeleteCheckinsHandler(config: FitnessPlanRouteConfig) {
  const dbService = createDb(config);
  return async (request: Request) => {
    try {
      const user = await config.getSessionUser(request);
      if (!user) return json({ error: '未授权访问' }, { status: 401 });

      const date = new URL(request.url).searchParams.get('date') ?? formatDateKey(new Date());
      const type = new URL(request.url).searchParams.get('type');
      if (type !== 'daily' && type !== 'weight') {
        return json({ error: '仅可撤销综合日或体重打卡' }, { status: 400 });
      }

      const data = await dbService.removeManualCheckin(user.id, date, type);
      return json({ success: true, data });
    } catch (error) {
      console.error('[fitnessPlan/checkins DELETE]', error);
      return json({ error: '撤销打卡失败' }, { status: 500 });
    }
  }

}

