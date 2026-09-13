import type { ComfyPromptRouteConfig } from '../../shared';
import { createDb, ok, fail, requireAuthUser } from '../../shared';
import { validateComfyBaseUrl } from '../../../server/validateComfyUrl';
import type { ServerFormData } from '../../../domain/types';


export function createPutServersByIdHandler(config: ComfyPromptRouteConfig) {
  const dbService = createDb(config);
  return async (request: Request, { params }: { params: Promise<{ id: string }> }) => {
    const { user, response } = await requireAuthUser(config, request);
    if (response) return response;
    const id = Number((await params).id);
    if (!Number.isFinite(id)) return fail('无效 ID', 400);

    const body = (await request.json()) as Partial<ServerFormData>;
    const patch: Partial<ServerFormData> = { ...body };

    if (body.baseUrl !== undefined) {
      try {
        patch.baseUrl = validateComfyBaseUrl(body.baseUrl);
      } catch (error) {
        return fail(error instanceof Error ? error.message : '无效地址', 400);
      }
    }

    const data = await dbService.updateServer(user!.id, id, patch);
    if (!data) return fail('服务器不存在', 404);
    return ok(data);
  }


}

export function createDeleteServersByIdHandler(config: ComfyPromptRouteConfig) {
  const dbService = createDb(config);
  return async (request: Request, { params }: { params: Promise<{ id: string }> }) => {
    const { user, response } = await requireAuthUser(config, request);
    if (response) return response;
    const id = Number((await params).id);
    if (!Number.isFinite(id)) return fail('无效 ID', 400);

    const deleted = await dbService.deleteServer(user!.id, id);
    if (!deleted) return fail('服务器不存在', 404);
    return ok({ deleted: true });
  }

}

