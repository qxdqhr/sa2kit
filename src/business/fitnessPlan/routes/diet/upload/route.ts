import type { FitnessPlanRouteConfig } from '../../shared';
import { createDb, json } from '../../shared';
import { DietUploadError } from '../../../server/dietUpload';


const ALLOWED_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp', 'image/gif']);
const MAX_SIZE = 10 * 1024 * 1024;

export function createPostDietUploadHandler(config: FitnessPlanRouteConfig) {
  const dbService = createDb(config);
  return async (request: Request) => {
    try {
      const user = await config.getSessionUser(request);
      if (!user) return json({ error: '未授权访问' }, { status: 401 });

      const formData = await request.formData();
      const file = formData.get('file');

      if (!(file instanceof File)) {
        return json({ error: '未提供图片文件' }, { status: 400 });
      }

      if (!ALLOWED_TYPES.has(file.type)) {
        return json({ error: '仅支持 JPG / PNG / WebP / GIF 图片' }, { status: 400 });
      }

      if (file.size > MAX_SIZE) {
        return json({ error: '图片大小不能超过 10MB' }, { status: 400 });
      }

      const result = await config.uploadDietImage!({
        file,
        userId: user.id,
      });

      return json({
        success: true,
        data: result,
      });
    } catch (error) {
      console.error('[fitnessPlan/diet/upload POST]', error);

      if (error instanceof DietUploadError) {
        const status = error.code === 'OSS_NOT_CONFIGURED' ? 503 : 500;
        return json({ error: error.message }, { status });
      }

      return json({ error: '图片上传失败' }, { status: 500 });
    }
  }

}

