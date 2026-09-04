/**
 * showmasterpiece — 站点配置（comic_universe_configs）route factories
 */
import { asc, eq } from 'drizzle-orm';
import {
  normalizeMiniappFloatingButtonsConfig,
} from '../domain';
import {
  comicUniverseCategories,
  comicUniverseConfigs,
} from '../server';
import type { CatalogSessionUser } from './catalogRoutes';

export type SiteConfigRouteConfig = {
  db: any;
  getSessionUser: (request: Request) => Promise<CatalogSessionUser | null>;
  isAdminUser: (user: CatalogSessionUser | null) => boolean;
};

type HomeTabItem = {
  name: string;
  description: string | null;
  category: string;
  visible: boolean;
  order: number;
};

type HomeTabItemInput = {
  name?: string;
  description?: string | null;
  category?: string;
  visible?: boolean;
  order?: number;
};

type MiniappFloatingButtonsInput = {
  showCart?: boolean;
  showHistory?: boolean;
  showAddToCart?: boolean;
};

type CategoryRow = {
  name: string;
  description: string | null;
  displayOrder: number | null;
  isActive: boolean;
};

function json(data: unknown, status = 200) {
  return Response.json(data, { status });
}

function apiError(message: string, status: number) {
  return json({ error: message }, status);
}

async function requireAdmin(
  request: Request,
  config: SiteConfigRouteConfig,
): Promise<Response | null> {
  const user = await config.getSessionUser(request);
  if (!user) return apiError('未授权的访问', 401);
  if (!config.isAdminUser(user)) return apiError('需要管理员权限', 403);
  return null;
}

const buildHomeTabsFromCategories = (categories: CategoryRow[]): HomeTabItem[] =>
  categories.map((item, index) => ({
    name: item.name,
    description: item.description ?? null,
    category: item.name,
    visible: item.isActive,
    order: index,
  }));

const toConfigResponse = (configRow: any, categories: CategoryRow[]) => ({
  ...configRow,
  miniappFloatingButtons: normalizeMiniappFloatingButtonsConfig(
    (configRow.miniappFloatingButtons as MiniappFloatingButtonsInput | undefined) ??
      undefined,
  ),
  homeTabConfig: buildHomeTabsFromCategories(categories),
});

async function loadCategories(db: any): Promise<CategoryRow[]> {
  return db
    .select({
      name: comicUniverseCategories.name,
      description: comicUniverseCategories.description,
      displayOrder: comicUniverseCategories.displayOrder,
      isActive: comicUniverseCategories.isActive,
    })
    .from(comicUniverseCategories)
    .orderBy(
      asc(comicUniverseCategories.displayOrder),
      asc(comicUniverseCategories.name),
    );
}

const buildDefaultConfig = (categories: CategoryRow[]) => ({
  siteName: '画集展览',
  siteDescription: '精美的艺术作品展览',
  heroTitle: '艺术画集展览',
  heroSubtitle: '探索精美的艺术作品，感受创作的魅力',
  maxCollectionsPerPage: 9,
  enableSearch: true,
  enableCategories: true,
  homeTabConfig: buildHomeTabsFromCategories(categories),
  miniappFloatingButtons: normalizeMiniappFloatingButtonsConfig(undefined),
  defaultCategory: 'all',
  theme: 'light',
  language: 'zh',
  updatedAt: new Date(),
});

export function createGetSiteConfigHandler(config: SiteConfigRouteConfig) {
  return async () => {
    try {
      const categories = await loadCategories(config.db);
      const existing = await config.db.select().from(comicUniverseConfigs).limit(1);

      if (existing.length === 0) {
        const created = await config.db
          .insert(comicUniverseConfigs)
          .values(buildDefaultConfig(categories))
          .returning();
        return json(toConfigResponse(created[0], categories));
      }

      return json(toConfigResponse(existing[0], categories));
    } catch (error) {
      console.error('获取配置失败:', error);
      return apiError('获取配置失败', 500);
    }
  };
}

export function createUpdateSiteConfigHandler(config: SiteConfigRouteConfig) {
  return async (request: Request) => {
    try {
      const denied = await requireAdmin(request, config);
      if (denied) return denied;

      const configData = await request.json();
      const categories = await loadCategories(config.db);
      const existing = await config.db.select().from(comicUniverseConfigs).limit(1);

      const updateData: Record<string, unknown> = {
        updatedAt: new Date(),
      };

      if (configData.siteName !== undefined) updateData.siteName = configData.siteName;
      if (configData.siteDescription !== undefined) {
        updateData.siteDescription = configData.siteDescription;
      }
      if (configData.heroTitle !== undefined) updateData.heroTitle = configData.heroTitle;
      if (configData.heroSubtitle !== undefined) {
        updateData.heroSubtitle = configData.heroSubtitle;
      }
      if (configData.maxCollectionsPerPage !== undefined) {
        updateData.maxCollectionsPerPage = configData.maxCollectionsPerPage;
      }
      if (configData.enableSearch !== undefined) {
        updateData.enableSearch = configData.enableSearch;
      }
      if (configData.enableCategories !== undefined) {
        updateData.enableCategories = configData.enableCategories;
      }
      if (configData.miniappFloatingButtons !== undefined) {
        updateData.miniappFloatingButtons = normalizeMiniappFloatingButtonsConfig(
          configData.miniappFloatingButtons as MiniappFloatingButtonsInput,
        );
      }
      if (configData.defaultCategory !== undefined) {
        updateData.defaultCategory = configData.defaultCategory;
      }
      if (configData.theme !== undefined) updateData.theme = configData.theme;
      if (configData.language !== undefined) updateData.language = configData.language;

      if (Array.isArray(configData.homeTabConfig)) {
        const items = configData.homeTabConfig
          .filter((item: HomeTabItemInput) => {
            if (!item) return false;
            const rawName = typeof item.name === 'string' ? item.name : item.category;
            return typeof rawName === 'string' && rawName.trim().length > 0;
          })
          .map((item: HomeTabItemInput) => {
            const rawName = typeof item.name === 'string' ? item.name : item.category;
            const name = rawName ? rawName.trim() : '';
            const description =
              typeof item.description === 'string' ? item.description.trim() : '';
            return {
              name,
              category: name,
              description: description.length > 0 ? description : null,
              visible: item.visible ?? true,
              order: Number.isFinite(item.order) ? Number(item.order) : 0,
            };
          })
          .sort((a: HomeTabItem, b: HomeTabItem) => a.order - b.order)
          .map((item: HomeTabItem, index: number) => ({ ...item, order: index }));

        const current = await loadCategories(config.db);
        const currentMap = new Map(current.map((cat) => [cat.name, cat]));

        const missingDescription = items.find((item: HomeTabItem) => {
          if (item.description && item.description.trim().length > 0) return false;
          return !currentMap.has(item.name);
        });

        if (missingDescription) {
          return apiError('新增分类时，分类名称和展示文案均不能为空', 400);
        }

        const incomingSet = new Set(items.map((item: HomeTabItem) => item.name));

        await Promise.all(
          items.map(async (item: HomeTabItem) => {
            const existingCategory = currentMap.get(item.name);
            const description =
              item.description ?? existingCategory?.description ?? null;

            if (existingCategory) {
              await config.db
                .update(comicUniverseCategories)
                .set({
                  isActive: item.visible,
                  displayOrder: item.order,
                  description,
                  updatedAt: new Date(),
                })
                .where(eq(comicUniverseCategories.name, item.name));
            } else {
              await config.db.insert(comicUniverseCategories).values({
                name: item.name,
                description,
                isActive: item.visible,
                displayOrder: item.order,
              });
            }
          }),
        );

        const toDisable = current.filter((cat) => !incomingSet.has(cat.name));
        if (toDisable.length > 0) {
          await Promise.all(
            toDisable.map((cat) =>
              config.db
                .update(comicUniverseCategories)
                .set({ isActive: false, updatedAt: new Date() })
                .where(eq(comicUniverseCategories.name, cat.name)),
            ),
          );
        }

        updateData.homeTabConfig = items;
      } else if (existing.length > 0) {
        updateData.homeTabConfig = existing[0].homeTabConfig;
      }

      if (existing.length === 0) {
        const created = await config.db
          .insert(comicUniverseConfigs)
          .values({ ...buildDefaultConfig(categories), ...updateData })
          .returning();
        return json(toConfigResponse(created[0], await loadCategories(config.db)));
      }

      const updated = await config.db
        .update(comicUniverseConfigs)
        .set(updateData)
        .where(eq(comicUniverseConfigs.id, existing[0].id))
        .returning();

      return json(toConfigResponse(updated[0], await loadCategories(config.db)));
    } catch (error) {
      console.error('更新配置失败:', error);
      return apiError('更新配置失败', 500);
    }
  };
}

export function createResetSiteConfigHandler(config: SiteConfigRouteConfig) {
  return async (request: Request) => {
    try {
      const denied = await requireAdmin(request, config);
      if (denied) return denied;

      const categories = await loadCategories(config.db);
      await config.db.delete(comicUniverseConfigs);
      const created = await config.db
        .insert(comicUniverseConfigs)
        .values(buildDefaultConfig(categories))
        .returning();
      return json(toConfigResponse(created[0], categories));
    } catch (error) {
      console.error('重置配置失败:', error);
      return apiError('重置配置失败', 500);
    }
  };
}
