/**
 * ideaList 路由工厂（Phase H1a）
 * Web Request + Response.json，避免 sa2kit peer next 与宿主 NextRequest 双版本冲突。
 */
import {
  createIdeaListDbService,
  type IdeaListDrizzleDb,
} from '../server';
import type {
  ConvertToListInput,
  IdeaItemFormData,
  IdeaListFormData,
} from '../domain/types';

export type IdeaListSessionUser = { id: string };

export type IdeaListRouteConfig = {
  db: IdeaListDrizzleDb;
  getSessionUser: (request: Request) => Promise<IdeaListSessionUser | null>;
};

type IdRouteContext = { params: Promise<{ id: string }> };

function json(data: unknown, status = 200) {
  return Response.json(data, { status });
}

function ok<T>(data: T) {
  return json({ success: true, data });
}

function fail(message: string, status = 500) {
  return json({ success: false, message }, status);
}

function unauthorized() {
  return fail('未授权访问', 401);
}

function createService(config: IdeaListRouteConfig) {
  return createIdeaListDbService(config.db);
}

async function requireUser(config: IdeaListRouteConfig, request: Request) {
  const user = await config.getSessionUser(request);
  if (!user) return { user: null as null, response: unauthorized() };
  return { user, response: null as null };
}

export function createListIdeaListsHandler(config: IdeaListRouteConfig) {
  const service = createService(config);
  return async (request: Request) => {
    const { user, response } = await requireUser(config, request);
    if (response) return response;
    const lists = await service.getUserIdeaLists(String(user!.id));
    return ok(lists);
  };
}

export function createCreateIdeaListHandler(config: IdeaListRouteConfig) {
  const service = createService(config);
  return async (request: Request) => {
    const { user, response } = await requireUser(config, request);
    if (response) return response;

    const body = (await request.json()) as IdeaListFormData;
    if (!body.name?.trim()) return fail('清单名称不能为空', 400);
    if (body.name.trim().length > 100) return fail('清单名称不能超过100个字符', 400);

    const newList = await service.createIdeaList({
      userId: String(user!.id),
      name: body.name.trim(),
      description: body.description?.trim() || null,
      color: body.color || 'blue',
    });
    return ok(newList);
  };
}

export function createUpdateIdeaListHandler(config: IdeaListRouteConfig) {
  const service = createService(config);
  return async (request: Request, context: IdRouteContext) => {
    const { user, response } = await requireUser(config, request);
    if (response) return response;

    const { id } = await context.params;
    const listId = parseInt(id, 10);
    if (Number.isNaN(listId)) return fail('无效的清单ID', 400);

    const existing = await service.getIdeaListById(listId);
    if (!existing) return fail('清单不存在', 404);
    if (existing.userId !== user!.id) return fail('无权限操作此清单', 403);

    const body = (await request.json()) as Partial<IdeaListFormData>;
    if (body.name !== undefined) {
      if (!body.name.trim()) return fail('清单名称不能为空', 400);
      if (body.name.trim().length > 100) return fail('清单名称不能超过100个字符', 400);
    }

    const updated = await service.updateIdeaList(listId, {
      ...(body.name !== undefined && { name: body.name.trim() }),
      ...(body.description !== undefined && {
        description: body.description?.trim() || null,
      }),
      ...(body.color !== undefined && { color: body.color }),
    });
    if (!updated) return fail('更新清单失败', 500);
    return ok(updated);
  };
}

export function createDeleteIdeaListHandler(config: IdeaListRouteConfig) {
  const service = createService(config);
  return async (request: Request, context: IdRouteContext) => {
    const { user, response } = await requireUser(config, request);
    if (response) return response;

    const { id } = await context.params;
    const listId = parseInt(id, 10);
    if (Number.isNaN(listId)) return fail('无效的清单ID', 400);

    const existing = await service.getIdeaListById(listId);
    if (!existing) return fail('清单不存在', 404);
    if (existing.userId !== user!.id) return fail('无权限操作此清单', 403);

    const success = await service.deleteIdeaList(listId);
    if (!success) return fail('删除清单失败', 500);
    return json({ success: true, message: '清单删除成功' });
  };
}

export function createListIdeaItemsHandler(config: IdeaListRouteConfig) {
  const service = createService(config);
  return async (request: Request) => {
    const { user, response } = await requireUser(config, request);
    if (response) return response;

    const listIdParam = new URL(request.url).searchParams.get('listId');
    if (!listIdParam) return fail('缺少清单ID参数', 400);
    const listId = parseInt(listIdParam, 10);
    if (Number.isNaN(listId)) return fail('无效的清单ID', 400);

    const list = await service.getIdeaListById(listId);
    if (!list) return fail('清单不存在', 404);
    if (list.userId !== user!.id) return fail('无权限访问此清单', 403);

    const items = await service.getIdeaItemsByListId(listId);
    return ok(items);
  };
}

export function createCreateIdeaItemHandler(config: IdeaListRouteConfig) {
  const service = createService(config);
  return async (request: Request) => {
    const { user, response } = await requireUser(config, request);
    if (response) return response;

    const body = (await request.json()) as { listId: number } & IdeaItemFormData;
    const { listId, ...itemData } = body;
    if (!listId || Number.isNaN(Number(listId))) return fail('无效的清单ID', 400);
    if (!itemData.title?.trim()) return fail('想法标题不能为空', 400);
    if (itemData.title.trim().length > 200) return fail('想法标题不能超过200个字符', 400);

    const list = await service.getIdeaListById(listId);
    if (!list) return fail('清单不存在', 404);
    if (list.userId !== user!.id) return fail('无权限操作此清单', 403);

    const validPriorities = ['high', 'medium', 'low'];
    if (itemData.priority && !validPriorities.includes(itemData.priority)) {
      return fail('无效的优先级', 400);
    }

    const newItem = await service.createIdeaItem({
      listId,
      title: itemData.title.trim(),
      description: itemData.description?.trim() || null,
      priority: itemData.priority || 'medium',
      tags: itemData.tags || [],
    });
    return ok(newItem);
  };
}

export function createUpdateIdeaItemHandler(config: IdeaListRouteConfig) {
  const service = createService(config);
  return async (request: Request, context: IdRouteContext) => {
    const { user, response } = await requireUser(config, request);
    if (response) return response;

    const { id } = await context.params;
    const itemId = parseInt(id, 10);
    if (Number.isNaN(itemId)) return fail('无效的项目ID', 400);

    const existing = await service.getIdeaItemById(itemId);
    if (!existing) return fail('项目不存在', 404);
    const list = await service.getIdeaListById(existing.listId);
    if (!list || list.userId !== user!.id) return fail('无权限操作此项目', 403);

    const body = (await request.json()) as Partial<IdeaItemFormData>;
    if (body.title !== undefined) {
      if (!body.title.trim()) return fail('想法标题不能为空', 400);
      if (body.title.trim().length > 200) return fail('想法标题不能超过200个字符', 400);
    }
    if (body.priority !== undefined) {
      const validPriorities = ['high', 'medium', 'low'];
      if (!validPriorities.includes(body.priority)) return fail('无效的优先级', 400);
    }

    const updated = await service.updateIdeaItem(itemId, {
      ...(body.title !== undefined && { title: body.title.trim() }),
      ...(body.description !== undefined && {
        description: body.description?.trim() || null,
      }),
      ...(body.priority !== undefined && { priority: body.priority }),
      ...(body.tags !== undefined && { tags: body.tags }),
    });
    if (!updated) return fail('更新项目失败', 500);
    return ok(updated);
  };
}

export function createDeleteIdeaItemHandler(config: IdeaListRouteConfig) {
  const service = createService(config);
  return async (request: Request, context: IdRouteContext) => {
    const { user, response } = await requireUser(config, request);
    if (response) return response;

    const { id } = await context.params;
    const itemId = parseInt(id, 10);
    if (Number.isNaN(itemId)) return fail('无效的项目ID', 400);

    const existing = await service.getIdeaItemById(itemId);
    if (!existing) return fail('项目不存在', 404);
    const list = await service.getIdeaListById(existing.listId);
    if (!list || list.userId !== user!.id) return fail('无权限操作此项目', 403);

    const success = await service.deleteIdeaItem(itemId);
    if (!success) return fail('删除项目失败', 500);
    return json({ success: true, message: '项目删除成功' });
  };
}

export function createToggleIdeaItemHandler(config: IdeaListRouteConfig) {
  const service = createService(config);
  return async (request: Request, context: IdRouteContext) => {
    const { user, response } = await requireUser(config, request);
    if (response) return response;

    const { id } = await context.params;
    const itemId = parseInt(id, 10);
    if (Number.isNaN(itemId)) return fail('无效的项目ID', 400);

    const existing = await service.getIdeaItemById(itemId);
    if (!existing) return fail('项目不存在', 404);
    const list = await service.getIdeaListById(existing.listId);
    if (!list || list.userId !== user!.id) return fail('无权限操作此项目', 403);

    const updated = await service.toggleIdeaItemComplete(itemId);
    if (!updated) return fail('切换状态失败', 500);
    return ok(updated);
  };
}

export function createConvertIdeaItemToListHandler(config: IdeaListRouteConfig) {
  const service = createService(config);
  return async (request: Request, context: IdRouteContext) => {
    const { user, response } = await requireUser(config, request);
    if (response) return response;

    const { id } = await context.params;
    const itemId = parseInt(id, 10);
    if (Number.isNaN(itemId)) return fail('无效的项目ID', 400);

    const body = (await request.json()) as ConvertToListInput & { itemId?: number };
    if (!body.name?.trim()) return fail('清单名称不能为空', 400);

    const newList = await service.convertItemToList(itemId, String(user!.id), {
      name: body.name.trim(),
      description: body.description,
      color: body.color,
      deleteOriginal: Boolean(body.deleteOriginal),
    });
    if (!newList) return fail('转换失败或无权限', 404);
    return ok(newList);
  };
}
