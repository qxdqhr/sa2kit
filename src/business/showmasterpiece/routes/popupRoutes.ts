/**
 * showmasterpiece — popup-config route factories（SMP1）
 */
import {
  createPopupConfigService,
  type PopupConfigService,
} from '../server';
import type { CatalogSessionUser } from './catalogRoutes';

export type PopupRouteConfig = {
  db: unknown;
  getSessionUser: (request: Request) => Promise<CatalogSessionUser | null>;
  isAdminUser: (user: CatalogSessionUser | null) => boolean;
  /** 可选：注入已构造的 service（默认用 db 工厂） */
  popupConfigService?: PopupConfigService;
};

type IdRouteContext = { params: Promise<{ id: string }> };

function json(data: unknown, status = 200) {
  return Response.json(data, { status });
}

function apiError(message: string, status: number) {
  return json({ error: message }, status);
}

function apiFail(message: string, status: number, extra?: Record<string, unknown>) {
  return json({ success: false, error: message, ...extra }, status);
}

function apiOk(data: unknown, extra?: Record<string, unknown>) {
  return json({ success: true, data, ...extra });
}

function getService(config: PopupRouteConfig): PopupConfigService {
  return config.popupConfigService ?? createPopupConfigService(config.db);
}

async function requireAdmin(
  request: Request,
  config: PopupRouteConfig,
): Promise<Response | null> {
  const user = await config.getSessionUser(request);
  if (!user) return apiError('未授权的访问', 401);
  if (!config.isAdminUser(user)) return apiError('需要管理员权限', 403);
  return null;
}

export function createListPopupConfigsHandler(config: PopupRouteConfig) {
  const service = getService(config);
  return async (request: Request) => {
    try {
      const { searchParams } = new URL(request.url);
      const businessModule = searchParams.get('businessModule') || 'showmasterpiece';
      const businessScene = searchParams.get('businessScene') || undefined;
      const enabledOnly = searchParams.get('enabledOnly') === 'true';

      let configs;
      if (enabledOnly && businessScene) {
        configs = await service.getEnabledPopupConfigs(businessModule, businessScene);
      } else {
        const user = await config.getSessionUser(request);
        if (!config.isAdminUser(user)) {
          return apiError('需要管理员权限', 403);
        }
        configs = await service.getAllPopupConfigs();
      }

      return json({
        success: true,
        data: configs,
        count: configs.length,
      });
    } catch (error) {
      console.error('❌ [API] 获取弹窗配置失败:', error);
      return apiFail('获取弹窗配置失败', 500, { data: [], count: 0 });
    }
  };
}

export function createCreatePopupConfigHandler(config: PopupRouteConfig) {
  const service = getService(config);
  return async (request: Request) => {
    const denied = await requireAdmin(request, config);
    if (denied) return denied;

    try {
      const body = await request.json();
      if (!body.name || !body.triggerConfig || !body.contentConfig) {
        return apiFail('名称、触发配置和内容配置为必填项', 400);
      }

      const configData = {
        name: body.name,
        description: body.description,
        type: body.type || 'deadline',
        enabled: body.enabled ?? false,
        eventId: null,
        blockProcess: body.blockProcess ?? false,
        triggerConfig: body.triggerConfig,
        contentConfig: body.contentConfig,
        displayConfig: body.displayConfig,
        businessModule: body.businessModule || 'showmasterpiece',
        businessScene: body.businessScene || 'cart_checkout',
        sortOrder: body.sortOrder || '0',
      };

      const created = await service.createPopupConfig(configData);
      return json({
        success: true,
        data: created,
        message: '弹窗配置创建成功',
      });
    } catch (error) {
      console.error('❌ [API] 创建弹窗配置失败:', error);
      return apiFail('创建弹窗配置失败', 500);
    }
  };
}

export function createGetPopupConfigHandler(config: PopupRouteConfig) {
  const service = getService(config);
  return async (request: Request, context: IdRouteContext) => {
    const denied = await requireAdmin(request, config);
    if (denied) return denied;

    try {
      const { id } = await context.params;
      const found = await service.getPopupConfigById(id);
      if (!found) return apiFail('弹窗配置不存在', 404);
      return apiOk(found);
    } catch (error) {
      console.error('❌ [API] 获取弹窗配置失败:', error);
      return apiFail('获取弹窗配置失败', 500);
    }
  };
}

export function createUpdatePopupConfigHandler(config: PopupRouteConfig) {
  const service = getService(config);
  return async (request: Request, context: IdRouteContext) => {
    const denied = await requireAdmin(request, config);
    if (denied) return denied;

    try {
      const { id } = await context.params;
      const body = await request.json();
      const updateData: Record<string, unknown> = {};
      const fields = [
        'name',
        'description',
        'type',
        'enabled',
        'blockProcess',
        'triggerConfig',
        'contentConfig',
        'displayConfig',
        'businessModule',
        'businessScene',
        'sortOrder',
      ] as const;

      for (const key of fields) {
        if (key in body) updateData[key] = body[key];
      }

      if (Object.keys(updateData).length === 0) {
        return apiFail('没有提供要更新的字段', 400);
      }

      const updated = await service.updatePopupConfig(id, updateData);
      return json({
        success: true,
        data: updated,
        message: '弹窗配置更新成功',
      });
    } catch (error) {
      console.error('❌ [API] 更新弹窗配置失败:', error);
      return apiFail('更新弹窗配置失败', 500);
    }
  };
}

export function createDeletePopupConfigHandler(config: PopupRouteConfig) {
  const service = getService(config);
  return async (request: Request, context: IdRouteContext) => {
    const denied = await requireAdmin(request, config);
    if (denied) return denied;

    try {
      const { id } = await context.params;
      await service.deletePopupConfig(id);
      return json({
        success: true,
        message: '弹窗配置删除成功',
      });
    } catch (error) {
      console.error('❌ [API] 删除弹窗配置失败:', error);
      return apiFail('删除弹窗配置失败', 500);
    }
  };
}

export function createCheckPopupConfigHandler(config: PopupRouteConfig) {
  const service = getService(config);
  return async (request: Request) => {
    try {
      const body = await request.json();
      const {
        businessModule = 'showmasterpiece',
        businessScene = 'cart_checkout',
        currentTime,
      } = body;

      const checkTime = currentTime ? new Date(currentTime) : new Date();
      const triggeredConfigs = await service.shouldShowPopup(
        businessModule,
        businessScene,
        checkTime,
      );

      return apiOk(triggeredConfigs, {
        configs: triggeredConfigs,
        checkTime: checkTime.toISOString(),
        count: triggeredConfigs.length,
      });
    } catch (error) {
      console.error('❌ [API] 检查弹窗配置失败:', error);
      return apiFail('检查弹窗配置失败', 500, { configs: [], count: 0 });
    }
  };
}
