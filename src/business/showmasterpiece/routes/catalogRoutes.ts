/**
 * showmasterpiece — categories / tags / collections / artworks route factories（SMP1）
 */
import type {
  ArtworksDbService,
  CategoriesDbService,
  CollectionsDbService,
  TagsDbService,
} from '../server';

export type CatalogSessionUser = {
  id: string;
  role?: string | null;
};

export type CatalogRouteConfig = {
  collections: CollectionsDbService;
  categories: CategoriesDbService;
  tags: TagsDbService;
  artworks: ArtworksDbService;
  getSessionUser: (request: Request) => Promise<CatalogSessionUser | null>;
  isAdminUser: (user: CatalogSessionUser | null) => boolean;
  /** 可选：collections GET 缓存头（宿主注入） */
  applyCollectionsCacheHeaders?: (
    response: Response,
    options: { overview: boolean; nocache: boolean },
  ) => Response;
};

type IdRouteContext = { params: Promise<{ id: string }> };
type ArtworkRouteContext = {
  params: Promise<{ id: string; artworkId: string }>;
};

function json(data: unknown, status = 200) {
  return Response.json(data, { status });
}

function apiError(message: string, status: number) {
  return json({ error: message }, status);
}

async function requireAdmin(
  request: Request,
  config: CatalogRouteConfig,
): Promise<Response | null> {
  const user = await config.getSessionUser(request);
  if (!user) return apiError('未授权的访问', 401);
  if (!config.isAdminUser(user)) return apiError('需要管理员权限', 403);
  return null;
}

function bodyTooLarge(request: Request): Response | null {
  const contentLength = request.headers.get('content-length');
  if (contentLength && parseInt(contentLength, 10) > 10 * 1024 * 1024) {
    return apiError('请求数据太大，请压缩图片后重试', 413);
  }
  return null;
}

function orderConflictStatus(message: string): number {
  if (
    message.includes('已经在最前面') ||
    message.includes('已经在最后面') ||
    message.includes('已经在最顶部') ||
    message.includes('已经在最底部')
  ) {
    return 409;
  }
  if (message.includes('不存在') || message.includes('无效')) {
    return 404;
  }
  return 500;
}

// ─── categories ───

export function createListCategoriesHandler(config: CatalogRouteConfig) {
  return async () => {
    try {
      const categories = await config.categories.getCategories();
      return json({
        success: true,
        data: categories,
        total: categories.length,
      });
    } catch (error) {
      console.error('获取分类失败:', error);
      return apiError('获取分类失败', 500);
    }
  };
}

export function createCreateCategoryHandler(config: CatalogRouteConfig) {
  return async (request: Request) => {
    try {
      const denied = await requireAdmin(request, config);
      if (denied) return denied;

      const body = await request.json();
      const name = typeof body?.name === 'string' ? body.name.trim() : '';
      const description =
        typeof body?.description === 'string' ? body.description.trim() : '';

      if (!name) return apiError('分类名称不能为空', 400);
      if (!description) return apiError('分类展示文案不能为空', 400);

      await config.categories.createCategory(name, description);
      return json({ success: true });
    } catch (error) {
      console.error('创建分类失败:', error);
      return apiError('创建分类失败', 500);
    }
  };
}

// ─── tags ───

export function createListTagsHandler(config: CatalogRouteConfig) {
  return async () => {
    try {
      const tags = await config.tags.getTags();
      return json({
        success: true,
        data: tags,
        total: tags.length,
      });
    } catch (error) {
      console.error('获取标签失败:', error);
      return apiError('获取标签失败', 500);
    }
  };
}

// ─── collections list ───

export function createListCollectionsHandler(config: CatalogRouteConfig) {
  return async (request: Request) => {
    try {
      const { searchParams } = new URL(request.url);
      const overview = searchParams.get('overview') === 'true';
      const nocache = searchParams.get('nocache') === 'true';

      if (overview) {
        const collectionsOverview =
          await config.collections.getCollectionsOverview();
        const response = json({
          success: true,
          data: collectionsOverview,
          total: collectionsOverview.length,
        });
        return config.applyCollectionsCacheHeaders
          ? config.applyCollectionsCacheHeaders(response, { overview: true, nocache })
          : response;
      }

      const collections = await config.collections.getAllCollections(!nocache);
      const response = json({
        success: true,
        data: collections,
        total: collections.length,
      });
      return config.applyCollectionsCacheHeaders
        ? config.applyCollectionsCacheHeaders(response, { overview: false, nocache })
        : response;
    } catch (error) {
      console.error('获取画集列表失败:', error);
      return json({ success: false, error: '获取画集列表失败' }, 500);
    }
  };
}

export function createCreateCollectionHandler(config: CatalogRouteConfig) {
  return async (request: Request) => {
    try {
      const denied = await requireAdmin(request, config);
      if (denied) return denied;

      const tooLarge = bodyTooLarge(request);
      if (tooLarge) return tooLarge;

      const collectionData = await request.json();
      const newCollection =
        await config.collections.createCollection(collectionData);
      return json(newCollection);
    } catch (error) {
      console.error('创建画集失败:', error);
      if (error instanceof Error && error.message.includes('body')) {
        return apiError('请求数据太大，请压缩图片后重试', 413);
      }
      return apiError('创建画集失败', 500);
    }
  };
}

export function createPatchCollectionsHandler(config: CatalogRouteConfig) {
  return async (request: Request) => {
    try {
      const denied = await requireAdmin(request, config);
      if (denied) return denied;

      const { searchParams } = new URL(request.url);
      const action = searchParams.get('action');

      if (action === 'reorder') {
        const { collectionOrders } = await request.json();
        if (
          !Array.isArray(collectionOrders) ||
          !collectionOrders.every(
            (item: { id?: unknown; displayOrder?: unknown }) =>
              typeof item.id === 'number' && typeof item.displayOrder === 'number',
          )
        ) {
          return apiError('无效的排序数据格式', 400);
        }
        await config.collections.updateCollectionOrder(collectionOrders);
        return json({ success: true, message: '画集顺序已更新' });
      }

      if (action === 'move') {
        const { collectionId, targetOrder } = await request.json();
        if (typeof collectionId !== 'number' || typeof targetOrder !== 'number') {
          return apiError('无效的移动参数', 400);
        }
        await config.collections.moveCollection(collectionId, targetOrder);
        return json({ success: true, message: '画集位置已更新' });
      }

      if (action === 'up') {
        const { collectionId } = await request.json();
        if (typeof collectionId !== 'number') {
          return apiError('无效的画集ID', 400);
        }
        await config.collections.moveCollectionUp(collectionId);
        return json({ success: true, message: '画集已上移' });
      }

      if (action === 'down') {
        const { collectionId } = await request.json();
        if (typeof collectionId !== 'number') {
          return apiError('无效的画集ID', 400);
        }
        await config.collections.moveCollectionDown(collectionId);
        return json({ success: true, message: '画集已下移' });
      }

      return apiError('不支持的操作类型', 400);
    } catch (error) {
      console.error('画集排序操作失败:', error);
      const errorMessage = error instanceof Error ? error.message : '操作失败';
      return apiError(errorMessage, orderConflictStatus(errorMessage));
    }
  };
}

// ─── collection by id ───

export function createUpdateCollectionHandler(config: CatalogRouteConfig) {
  return async (request: Request, context: IdRouteContext) => {
    try {
      const denied = await requireAdmin(request, config);
      if (denied) return denied;

      const tooLarge = bodyTooLarge(request);
      if (tooLarge) return tooLarge;

      const { id } = await context.params;
      const collectionId = parseInt(id, 10);
      const collectionData = await request.json();
      const updated = await config.collections.updateCollection(
        collectionId,
        collectionData,
      );
      return json(updated);
    } catch (error) {
      console.error('更新画集失败:', error);
      if (error instanceof Error && error.message.includes('body')) {
        return apiError('请求数据太大，请压缩图片后重试', 413);
      }
      return apiError('更新画集失败', 500);
    }
  };
}

export function createDeleteCollectionHandler(config: CatalogRouteConfig) {
  return async (request: Request, context: IdRouteContext) => {
    try {
      const denied = await requireAdmin(request, config);
      if (denied) return denied;

      const { id } = await context.params;
      const collectionId = parseInt(id, 10);
      await config.collections.deleteCollection(collectionId);
      return json({ success: true });
    } catch (error) {
      console.error('删除画集失败:', error);
      return apiError('删除画集失败', 500);
    }
  };
}

// ─── artworks ───

export function createListArtworksHandler(config: CatalogRouteConfig) {
  return async (request: Request, context: IdRouteContext) => {
    try {
      const denied = await requireAdmin(request, config);
      if (denied) return denied;

      const { id } = await context.params;
      const collectionId = parseInt(id, 10);
      if (Number.isNaN(collectionId)) {
        return apiError('无效的画集ID', 400);
      }

      const artworks = await config.artworks.getArtworksByCollection(collectionId);
      const response = json(artworks);
      response.headers.set(
        'Cache-Control',
        'no-store, no-cache, must-revalidate, proxy-revalidate',
      );
      response.headers.set('Pragma', 'no-cache');
      response.headers.set('Expires', '0');
      return response;
    } catch (error) {
      console.error('获取作品列表失败:', error);
      return apiError('获取作品列表失败', 500);
    }
  };
}

export function createCreateArtworkHandler(config: CatalogRouteConfig) {
  return async (request: Request, context: IdRouteContext) => {
    try {
      const denied = await requireAdmin(request, config);
      if (denied) return denied;

      const tooLarge = bodyTooLarge(request);
      if (tooLarge) return tooLarge;

      const { id } = await context.params;
      const collectionId = parseInt(id, 10);

      const collections = await config.collections.getAllCollections(false);
      const target = collections.find((c: { id: number }) => c.id === collectionId);
      if (!target) {
        return apiError(`画集不存在 (ID: ${collectionId})，请刷新页面后重试`, 404);
      }

      const artworkData = await request.json();
      if (!artworkData.fileId) {
        return apiError('必须使用文件服务上传图片，不支持Base64图片', 400);
      }

      const artwork = await config.artworks.addArtworkToCollection(
        collectionId,
        artworkData,
      );
      return json(artwork);
    } catch (error) {
      console.error('添加作品失败:', error);
      if (error instanceof Error && error.message.includes('foreign key constraint')) {
        return apiError('画集不存在或已被删除，请刷新页面后重试', 409);
      }
      if (error instanceof Error && error.message.includes('body')) {
        return apiError('请求数据太大，请压缩图片后重试', 413);
      }
      return apiError('添加作品失败', 500);
    }
  };
}

export function createPatchArtworksHandler(config: CatalogRouteConfig) {
  return async (request: Request, context: IdRouteContext) => {
    try {
      const denied = await requireAdmin(request, config);
      if (denied) return denied;

      const { id } = await context.params;
      const collectionId = parseInt(id, 10);
      const { searchParams } = new URL(request.url);
      const action = searchParams.get('action');

      if (action === 'reorder') {
        const { artworkOrders } = await request.json();
        if (
          !Array.isArray(artworkOrders) ||
          !artworkOrders.every(
            (item: { id?: unknown; pageOrder?: unknown }) =>
              typeof item.id === 'number' && typeof item.pageOrder === 'number',
          )
        ) {
          return apiError('无效的排序数据格式', 400);
        }
        await config.artworks.updateArtworkOrder(collectionId, artworkOrders);
        return json({ success: true, message: '作品顺序已更新' });
      }

      if (action === 'move') {
        const { artworkId, targetOrder } = await request.json();
        if (typeof artworkId !== 'number' || typeof targetOrder !== 'number') {
          return apiError('无效的移动参数', 400);
        }
        await config.artworks.moveArtwork(collectionId, artworkId, targetOrder);
        return json({ success: true, message: '作品位置已更新' });
      }

      if (action === 'up') {
        const { artworkId } = await request.json();
        if (typeof artworkId !== 'number') {
          return apiError('无效的作品ID', 400);
        }
        await config.artworks.moveArtworkUp(collectionId, artworkId);
        return json({ success: true, message: '作品已上移' });
      }

      if (action === 'down') {
        const { artworkId } = await request.json();
        if (typeof artworkId !== 'number') {
          return apiError('无效的作品ID', 400);
        }
        await config.artworks.moveArtworkDown(collectionId, artworkId);
        return json({ success: true, message: '作品已下移' });
      }

      return apiError('不支持的操作类型', 400);
    } catch (error) {
      console.error('作品排序操作失败:', error);
      const errorMessage = error instanceof Error ? error.message : '操作失败';
      return apiError(errorMessage, orderConflictStatus(errorMessage));
    }
  };
}

export function createUpdateArtworkHandler(config: CatalogRouteConfig) {
  return async (request: Request, context: ArtworkRouteContext) => {
    try {
      const denied = await requireAdmin(request, config);
      if (denied) return denied;

      const tooLarge = bodyTooLarge(request);
      if (tooLarge) return tooLarge;

      const { id, artworkId } = await context.params;
      const collectionId = parseInt(id, 10);
      const artworkIdNum = parseInt(artworkId, 10);
      const artworkData = await request.json();
      const updated = await config.artworks.updateArtwork(
        collectionId,
        artworkIdNum,
        artworkData,
      );
      return json(updated);
    } catch (error) {
      console.error('更新作品失败:', error);
      if (error instanceof Error && error.message.includes('body')) {
        return apiError('请求数据太大，请压缩图片后重试', 413);
      }
      return apiError('更新作品失败', 500);
    }
  };
}

export function createDeleteArtworkHandler(config: CatalogRouteConfig) {
  return async (request: Request, context: ArtworkRouteContext) => {
    try {
      const denied = await requireAdmin(request, config);
      if (denied) return denied;

      const { id, artworkId } = await context.params;
      await config.artworks.deleteArtwork(
        parseInt(id, 10),
        parseInt(artworkId, 10),
      );
      return json({ success: true });
    } catch (error) {
      console.error('删除作品失败:', error);
      return apiError('删除作品失败', 500);
    }
  };
}
