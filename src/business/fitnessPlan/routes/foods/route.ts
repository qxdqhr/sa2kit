import type { FitnessPlanRouteConfig } from '../shared';
import { createDb, json } from '../shared';
import type { FoodItemFormData } from '../../domain/types';


export function createGetFoodsHandler(config: FitnessPlanRouteConfig) {
  const dbService = createDb(config);
  return async (request: Request) => {
    try {
      const user = await config.getSessionUser(request);
      if (!user) return json({ error: '未授权访问' }, { status: 401 });

      const search = new URL(request.url).searchParams.get('search') ?? undefined;
      const data = await dbService.listFoodItems(user.id, { search });
      return json({ success: true, data });
    } catch (error) {
      console.error('[fitnessPlan/foods GET]', error);
      return json({ error: '获取食物列表失败' }, { status: 500 });
    }
  }


}

export function createPostFoodsHandler(config: FitnessPlanRouteConfig) {
  const dbService = createDb(config);
  return async (request: Request) => {
    try {
      const user = await config.getSessionUser(request);
      if (!user) return json({ error: '未授权访问' }, { status: 401 });

      const body = (await request.json()) as FoodItemFormData;
      if (!body.name?.trim()) {
        return json({ error: '食物名称不能为空' }, { status: 400 });
      }
      if (!Number.isFinite(body.calories) || body.calories < 0) {
        return json({ error: '热量无效' }, { status: 400 });
      }

      const data = await dbService.createFoodItem(user.id, body);
      return json({ success: true, data });
    } catch (error) {
      console.error('[fitnessPlan/foods POST]', error);
      return json({ error: '创建食物失败' }, { status: 500 });
    }
  }

}

