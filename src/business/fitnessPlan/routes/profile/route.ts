import type { FitnessPlanRouteConfig } from '../shared';
import { createDb, json } from '../shared';
import type { FitnessProfileFormData } from '../../domain/types';
import { parseProfileNumbers } from '../../domain/types';


export function createGetProfileHandler(config: FitnessPlanRouteConfig) {
  const dbService = createDb(config);
  return async (request: Request) => {
    try {
      const user = await config.getSessionUser(request);
      if (!user) {
        return json({ error: '未授权访问' }, { status: 401 });
      }

      const profile = await dbService.getOrCreateProfile(user.id);

      return json({
        success: true,
        data: parseProfileNumbers(profile),
      });
    } catch (error) {
      console.error('[fitnessPlan/profile GET]', error);
      return json({ error: '获取档案失败' }, { status: 500 });
    }
  }


}

export function createPutProfileHandler(config: FitnessPlanRouteConfig) {
  const dbService = createDb(config);
  return async (request: Request) => {
    try {
      const user = await config.getSessionUser(request);
      if (!user) {
        return json({ error: '未授权访问' }, { status: 401 });
      }

      const body = (await request.json()) as FitnessProfileFormData;

      if (
        body.dailyCalorieGoal != null &&
        (body.dailyCalorieGoal < 500 || body.dailyCalorieGoal > 10000)
      ) {
        return json({ error: '每日热量目标需在 500–10000 之间' }, { status: 400 });
      }

      if (
        body.currentWeight != null &&
        (body.currentWeight < 20 || body.currentWeight > 500)
      ) {
        return json({ error: '体重数值不合理' }, { status: 400 });
      }

      const profile = await dbService.updateProfile(user.id, body);

      return json({
        success: true,
        data: parseProfileNumbers(profile),
      });
    } catch (error) {
      console.error('[fitnessPlan/profile PUT]', error);
      return json({ error: '更新档案失败' }, { status: 500 });
    }
  }

}

