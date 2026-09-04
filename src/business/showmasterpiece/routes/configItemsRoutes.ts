/**
 * showmasterpiece — 配置项（showmaster_config_*）route factories
 */
import {
  createShowmasterConfigService,
  type ShowmasterConfigService,
} from '../server';
import type { CatalogSessionUser } from './catalogRoutes';

export type ConfigEnvironment = 'development' | 'production';

export type ConfigItemsRouteConfig = {
  db: unknown;
  getSessionUser: (request: Request) => Promise<CatalogSessionUser | null>;
  isAdminUser: (user: CatalogSessionUser | null) => boolean;
  showmasterConfigService?: ShowmasterConfigService;
  /** 解析 environment query/body；宿主可注入 NODE_ENV 默认值 */
  resolveEnvironment: (
    value?: string | null,
    fallback?: ConfigEnvironment,
  ) => ConfigEnvironment;
  defaultEnvironment: () => ConfigEnvironment;
};

type IdRouteContext = { params: Promise<{ id: string }> };

function json(data: unknown, status = 200) {
  return Response.json(data, { status });
}

function apiFail(message: string, status: number, extra?: Record<string, unknown>) {
  return json({ success: false, error: message, ...extra }, status);
}

function getService(config: ConfigItemsRouteConfig): ShowmasterConfigService {
  return (
    config.showmasterConfigService ??
    createShowmasterConfigService(config.db)
  );
}

async function requireAdmin(
  request: Request,
  config: ConfigItemsRouteConfig,
): Promise<Response | null> {
  const user = await config.getSessionUser(request);
  if (!user) return json({ error: '未授权的访问' }, 401);
  if (!config.isAdminUser(user)) {
    return json({ error: '需要管理员权限' }, 403);
  }
  return null;
}

export function createListConfigItemsHandler(config: ConfigItemsRouteConfig) {
  const service = getService(config);
  return async (request: Request) => {
    const denied = await requireAdmin(request, config);
    if (denied) return denied;

    try {
      const { searchParams } = new URL(request.url);
      const search = searchParams.get('search');
      const type = searchParams.get('type') as
        | 'string'
        | 'number'
        | 'boolean'
        | 'json'
        | 'password'
        | null;
      const isActive = searchParams.get('isActive') !== 'false';
      const page = parseInt(searchParams.get('page') || '1', 10);
      const pageSize = parseInt(searchParams.get('pageSize') || '50', 10);
      const environment = config.resolveEnvironment(
        searchParams.get('environment'),
      );
      const keys = searchParams.get('keys');

      if (keys) {
        const keyList = keys.split(',').map((k) => k.trim());
        const items = await Promise.all(
          keyList.map((key) => service.getConfigItemByKey(key, environment)),
        );
        const validItems = items.filter((item) => item !== null);
        return json({
          success: true,
          items: validItems,
          total: validItems.length,
          page: 1,
          pageSize: validItems.length,
          totalPages: 1,
          environment,
          module: 'showmasterpiece',
        });
      }

      const result = await service.getConfigItems({
        search: search || undefined,
        type: type || undefined,
        environment,
        isActive,
        page,
        pageSize,
      });

      return json({
        success: true,
        items: result.items,
        total: result.total,
        page: result.page,
        pageSize: result.pageSize,
        totalPages: result.totalPages,
        environment,
        module: 'showmasterpiece',
      });
    } catch (error) {
      console.error('❌ [ShowMasterpiece Config] 获取配置项失败:', error);
      return apiFail('获取配置项失败', 500, { items: [], total: 0 });
    }
  };
}

export function createCreateConfigItemHandler(config: ConfigItemsRouteConfig) {
  const service = getService(config);
  return async (request: Request) => {
    const denied = await requireAdmin(request, config);
    if (denied) return denied;

    try {
      const body = await request.json();
      const {
        key,
        displayName,
        description,
        value,
        defaultValue,
        type,
        isRequired,
        isSensitive,
        validation,
        sortOrder,
        environment: environmentInput,
      } = body;

      if (!key || !displayName || !type) {
        return apiFail('配置键、显示名称和类型不能为空', 400);
      }

      const prefixedKey = key.startsWith('SHOWMASTER_')
        ? key
        : `SHOWMASTER_${key}`;

      let categoryId: string | undefined;
      try {
        const categories = await service.getAllCategories();
        const generalCategory = categories.find(
          (cat: { name: string }) => cat.name === 'general',
        );

        if (generalCategory) {
          categoryId = generalCategory.id;
        } else {
          await service.initializeDefaultCategories();
          const updatedCategories = await service.getAllCategories();
          const newGeneralCategory = updatedCategories.find(
            (cat: { name: string }) => cat.name === 'general',
          );
          categoryId = newGeneralCategory?.id;
        }
      } catch (catError) {
        console.warn(
          '⚠️ [ShowMasterpiece Config] 处理分类时出错，使用undefined:',
          catError,
        );
      }

      const configItem = await service.createConfigItem({
        categoryId,
        key: prefixedKey,
        displayName: `[ShowMaster] ${displayName}`,
        description: description
          ? `ShowMasterpiece模块: ${description}`
          : null,
        value: value || null,
        defaultValue: defaultValue || null,
        type,
        isRequired: isRequired || false,
        isSensitive: isSensitive || false,
        validation: validation ? JSON.stringify(validation) : null,
        sortOrder: sortOrder || 0,
        environment: config.resolveEnvironment(
          typeof environmentInput === 'string' ? environmentInput : undefined,
          config.defaultEnvironment(),
        ),
        isActive: true,
      });

      return json({
        success: true,
        data: configItem,
        message: '配置项创建成功',
      });
    } catch (error) {
      console.error('❌ [ShowMasterpiece Config] 创建配置项失败:', error);
      return apiFail('创建配置项失败', 500);
    }
  };
}

export function createGetConfigItemHandler(config: ConfigItemsRouteConfig) {
  const service = getService(config);
  return async (request: Request, context: IdRouteContext) => {
    const denied = await requireAdmin(request, config);
    if (denied) return denied;

    try {
      const { id } = await context.params;
      const configItem = await service.getConfigItemById(id);
      if (!configItem) {
        return apiFail('配置项不存在', 404);
      }
      return json({ success: true, data: configItem });
    } catch (error) {
      console.error('❌ [ShowMasterpiece Config] 获取配置项失败:', error);
      return apiFail('获取配置项失败', 500);
    }
  };
}

export function createUpdateConfigItemHandler(config: ConfigItemsRouteConfig) {
  const service = getService(config);
  return async (request: Request, context: IdRouteContext) => {
    const denied = await requireAdmin(request, config);
    if (denied) return denied;

    try {
      const { id } = await context.params;
      const body = await request.json();
      const { value } = body;

      const existingItem = await service.getConfigItemById(id);
      if (!existingItem) {
        return apiFail('配置项不存在', 404);
      }

      if (existingItem.type === 'number' && value && isNaN(Number(value))) {
        return apiFail('请输入有效的数字', 400);
      }

      if (
        existingItem.type === 'boolean' &&
        value &&
        !['true', 'false'].includes(String(value).toLowerCase())
      ) {
        return apiFail('布尔值只能是 true 或 false', 400);
      }

      const updatedItem = await service.updateConfigItem(
        id,
        { value },
        'api-user',
      );

      return json({
        success: true,
        data: updatedItem,
        message: '配置项更新成功',
      });
    } catch (error) {
      console.error('❌ [ShowMasterpiece Config] 更新配置项失败:', error);
      return apiFail('更新配置项失败', 500);
    }
  };
}

export function createDeleteConfigItemHandler(config: ConfigItemsRouteConfig) {
  const service = getService(config);
  return async (request: Request, context: IdRouteContext) => {
    const denied = await requireAdmin(request, config);
    if (denied) return denied;

    try {
      const { id } = await context.params;
      const existingItem = await service.getConfigItemById(id);
      if (!existingItem) {
        return apiFail('配置项不存在', 404);
      }

      if (existingItem.isRequired) {
        return apiFail('不能删除必需的配置项', 400);
      }

      await service.deleteConfigItem(id, 'api-user');
      return json({
        success: true,
        message: '配置项删除成功',
      });
    } catch (error) {
      console.error('❌ [ShowMasterpiece Config] 删除配置项失败:', error);
      return apiFail('删除配置项失败', 500);
    }
  };
}
