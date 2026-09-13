import type { ComfyPromptRouteConfig } from '../../shared';
import { createDb, ok, fail, requireAuthUser } from '../../shared';
import type { PromptGroupFormData } from '../../../domain/types';


export function createPutGroupsByIdHandler(config: ComfyPromptRouteConfig) {
  const dbService = createDb(config);
  return async (request: Request, { params }: { params: Promise<{ id: string }> }) => {
    const { user, response } = await requireAuthUser(config, request);
    if (response) return response;
    const id = Number((await params).id);
    if (!Number.isFinite(id)) return fail('无效 ID', 400);
    const body = (await request.json()) as Partial<PromptGroupFormData>;
    const data = await dbService.updateGroup(user!.id, id, body);
    if (!data) return fail('提示词分组不存在', 404);
    return ok(data);
  }


}

export function createDeleteGroupsByIdHandler(config: ComfyPromptRouteConfig) {
  const dbService = createDb(config);
  return async (request: Request, { params }: { params: Promise<{ id: string }> }) => {
    const { user, response } = await requireAuthUser(config, request);
    if (response) return response;
    const id = Number((await params).id);
    if (!Number.isFinite(id)) return fail('无效 ID', 400);
    const deleted = await dbService.deleteGroup(user!.id, id);
    if (!deleted) return fail('提示词分组不存在', 404);
    return ok({ deleted: true });
  }

}

