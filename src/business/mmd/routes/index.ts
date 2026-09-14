/**
 * MMD 资源 CRUD 路由工厂（Phase H∞ B 切片）
 * Web Request + Response.json，避免 sa2kit peer next 与宿主 NextRequest 双版本冲突。
 */
import {
  createMMDModelsDbService,
  type MmdResourceDrizzleDb,
  type ApiResponse,
  type MMDModel,
} from '../server';

export type MmdResourceSessionUser = { id: string; role?: string | null };

export type MmdResourceRouteConfig = {
  db: MmdResourceDrizzleDb;
  getSessionUser: (request: Request) => Promise<MmdResourceSessionUser | null>;
  isAdminRole?: (role?: string | null) => boolean;
};

type IdRouteContext = { params: Promise<{ id: string }> };

function json(data: unknown, status = 200) {
  return Response.json(data, { status });
}

function createModelsService(config: MmdResourceRouteConfig) {
  return createMMDModelsDbService(config.db);
}

function canMutateModel(
  config: MmdResourceRouteConfig,
  user: MmdResourceSessionUser,
  model: MMDModel,
): boolean {
  if (config.isAdminRole?.(user.role)) return true;
  if (model.userId == null) return true;
  return String(model.userId) === String(user.id);
}

export function createListModelsHandler(config: MmdResourceRouteConfig) {
  const service = createModelsService(config);
  return async (request: Request) => {
    try {
      const { searchParams } = new URL(request.url);
      const userId = searchParams.get('userId');
      const query = searchParams.get('query');

      if (userId) {
        const user = await config.getSessionUser(request);
        if (!user) {
          return json(
            { success: false, error: '未授权的访问' } satisfies ApiResponse,
            401,
          );
        }
        if (String(user.id) !== userId) {
          return json(
            { success: false, error: '无权查看该用户的模型' } satisfies ApiResponse,
            403,
          );
        }
      }

      let models: MMDModel[];
      if (query) {
        models = await service.searchModels(query, userId || undefined);
      } else if (userId) {
        models = await service.getUserModels(userId);
      } else {
        models = await service.getPublicModels();
      }

      return json({
        success: true,
        data: models,
        message: `成功获取 ${models.length} 个模型`,
      } satisfies ApiResponse<MMDModel[]>);
    } catch (error) {
      console.error('[mmd] list models failed:', error);
      return json(
        { success: false, error: '获取模型列表失败' } satisfies ApiResponse,
        500,
      );
    }
  };
}

export function createCreateModelHandler(config: MmdResourceRouteConfig) {
  const service = createModelsService(config);
  return async (request: Request) => {
    try {
      const user = await config.getSessionUser(request);
      if (!user) {
        return json(
          { success: false, error: '未授权的访问' } satisfies ApiResponse,
          401,
        );
      }

      const body = await request.json();
      const {
        name,
        description,
        filePath,
        thumbnailPath,
        fileSize,
        format,
        tags,
        isPublic,
      } = body;

      if (!name || !filePath || !fileSize || !format) {
        return json(
          {
            success: false,
            error: '缺少必填字段：name, filePath, fileSize, format',
          } satisfies ApiResponse,
          400,
        );
      }

      if (!['pmd', 'pmx'].includes(format)) {
        return json(
          {
            success: false,
            error: '不支持的模型格式，仅支持 pmd 和 pmx',
          } satisfies ApiResponse,
          400,
        );
      }

      const model = await service.createModel({
        name,
        description,
        filePath,
        thumbnailPath,
        fileSize: parseInt(String(fileSize), 10),
        format,
        userId: String(user.id),
        tags: Array.isArray(tags) ? tags : [],
        isPublic: Boolean(isPublic),
      });

      return json(
        {
          success: true,
          data: model,
          message: '模型创建成功',
        } satisfies ApiResponse<MMDModel>,
        201,
      );
    } catch (error) {
      console.error('[mmd] create model failed:', error);
      return json(
        { success: false, error: '创建模型失败' } satisfies ApiResponse,
        500,
      );
    }
  };
}

export function createGetModelHandler(config: MmdResourceRouteConfig) {
  const service = createModelsService(config);
  return async (request: Request, context: IdRouteContext) => {
    try {
      const { id } = await context.params;
      const modelId = parseInt(id, 10);
      if (Number.isNaN(modelId)) {
        return json(
          { success: false, error: '无效的模型ID' } satisfies ApiResponse,
          400,
        );
      }

      const model = await service.getModelById(modelId);
      if (!model) {
        return json(
          { success: false, error: '模型不存在' } satisfies ApiResponse,
          404,
        );
      }

      if (!model.isPublic) {
        const user = await config.getSessionUser(request);
        if (!user || !canMutateModel(config, user, model)) {
          return json(
            { success: false, error: '未授权的访问' } satisfies ApiResponse,
            401,
          );
        }
      }

      return json({ success: true, data: model } satisfies ApiResponse<MMDModel>);
    } catch (error) {
      console.error('[mmd] get model failed:', error);
      return json(
        { success: false, error: '获取模型详情失败' } satisfies ApiResponse,
        500,
      );
    }
  };
}

export function createUpdateModelHandler(config: MmdResourceRouteConfig) {
  const service = createModelsService(config);
  return async (request: Request, context: IdRouteContext) => {
    try {
      const user = await config.getSessionUser(request);
      if (!user) {
        return json(
          { success: false, error: '未授权的访问' } satisfies ApiResponse,
          401,
        );
      }

      const { id } = await context.params;
      const modelId = parseInt(id, 10);
      if (Number.isNaN(modelId)) {
        return json(
          { success: false, error: '无效的模型ID' } satisfies ApiResponse,
          400,
        );
      }

      const existing = await service.getModelById(modelId);
      if (!existing) {
        return json(
          { success: false, error: '模型不存在' } satisfies ApiResponse,
          404,
        );
      }
      if (!canMutateModel(config, user, existing)) {
        return json(
          { success: false, error: '无权修改该模型' } satisfies ApiResponse,
          403,
        );
      }

      const body = await request.json();
      const updateData = { ...body };
      delete updateData.id;
      delete updateData.uploadTime;
      delete updateData.downloadCount;
      delete updateData.userId;

      const model = await service.updateModel(modelId, updateData);
      if (!model) {
        return json(
          { success: false, error: '模型不存在' } satisfies ApiResponse,
          404,
        );
      }

      return json({
        success: true,
        data: model,
        message: '模型更新成功',
      } satisfies ApiResponse<MMDModel>);
    } catch (error) {
      console.error('[mmd] update model failed:', error);
      return json(
        { success: false, error: '更新模型失败' } satisfies ApiResponse,
        500,
      );
    }
  };
}

export function createDeleteModelHandler(config: MmdResourceRouteConfig) {
  const service = createModelsService(config);
  return async (request: Request, context: IdRouteContext) => {
    try {
      const user = await config.getSessionUser(request);
      if (!user) {
        return json(
          { success: false, error: '未授权的访问' } satisfies ApiResponse,
          401,
        );
      }

      const { id } = await context.params;
      const modelId = parseInt(id, 10);
      if (Number.isNaN(modelId)) {
        return json(
          { success: false, error: '无效的模型ID' } satisfies ApiResponse,
          400,
        );
      }

      const existing = await service.getModelById(modelId);
      if (!existing) {
        return json(
          { success: false, error: '模型不存在' } satisfies ApiResponse,
          404,
        );
      }
      if (!canMutateModel(config, user, existing)) {
        return json(
          { success: false, error: '无权删除该模型' } satisfies ApiResponse,
          403,
        );
      }

      const success = await service.deleteModel(modelId);
      if (!success) {
        return json(
          { success: false, error: '模型不存在' } satisfies ApiResponse,
          404,
        );
      }

      return json({
        success: true,
        message: '模型删除成功',
      } satisfies ApiResponse);
    } catch (error) {
      console.error('[mmd] delete model failed:', error);
      return json(
        { success: false, error: '删除模型失败' } satisfies ApiResponse,
        500,
      );
    }
  };
}
