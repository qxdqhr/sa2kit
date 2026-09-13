import type { ComfyPromptRouteConfig } from '../../shared';
import { createDb, ok, fail, requireAuthUser } from '../../shared';
import type { PromptSetFormData } from '../../../domain/types';


export function createGetSetsByIdHandler(config: ComfyPromptRouteConfig) {
  const dbService = createDb(config);
  return async (request: Request, { params }: { params: Promise<{ id: string }> }) => {
    const { user, response } = await requireAuthUser(config, request);
    if (response) return response;
    const id = Number((await params).id);
    if (!Number.isFinite(id)) return fail('无效 ID', 400);
    const data = await dbService.getSetById(user!.id, id);
    if (!data) return fail('提示词模板不存在', 404);
    return ok(data);
  }


}

export function createPutSetsByIdHandler(config: ComfyPromptRouteConfig) {
  const dbService = createDb(config);
  return async (request: Request, { params }: { params: Promise<{ id: string }> }) => {
    const { user, response } = await requireAuthUser(config, request);
    if (response) return response;
    const id = Number((await params).id);
    if (!Number.isFinite(id)) return fail('无效 ID', 400);
    const body = (await request.json()) as Partial<PromptSetFormData>;
    const data = await dbService.updateSet(user!.id, id, body);
    if (!data) return fail('提示词模板不存在', 404);
    return ok(data);
  }


}

export function createDeleteSetsByIdHandler(config: ComfyPromptRouteConfig) {
  const dbService = createDb(config);
  return async (request: Request, { params }: { params: Promise<{ id: string }> }) => {
    const { user, response } = await requireAuthUser(config, request);
    if (response) return response;
    const id = Number((await params).id);
    if (!Number.isFinite(id)) return fail('无效 ID', 400);
    const deleted = await dbService.deleteSet(user!.id, id);
    if (!deleted) return fail('提示词模板不存在', 404);
    return ok({ deleted: true });
  }

}

