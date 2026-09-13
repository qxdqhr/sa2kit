import type { ComfyPromptRouteConfig } from '../shared';
import { createDb, ok, fail, requireAuthUser } from '../shared';
import { validateComfyBaseUrl } from '../../server/validateComfyUrl';
import type { ServerFormData } from '../../domain/types';


export function createGetServersHandler(config: ComfyPromptRouteConfig) {
  const dbService = createDb(config);
  return async (request: Request) => {
    const { user, response } = await requireAuthUser(config, request);
    if (response) return response;
    const data = await dbService.getServers(user!.id);
    return ok(data);
  }


}

export function createPostServersHandler(config: ComfyPromptRouteConfig) {
  const dbService = createDb(config);
  return async (request: Request) => {
    const { user, response } = await requireAuthUser(config, request);
    if (response) return response;

    const body = (await request.json()) as ServerFormData;
    if (!body.name?.trim()) return fail('请填写服务器名称', 400);
    if (!body.baseUrl?.trim()) return fail('请填写 ComfyUI 地址', 400);

    try {
      const baseUrl = validateComfyBaseUrl(body.baseUrl);
      const data = await dbService.createServer(user!.id, {
        ...body,
        baseUrl,
      });
      return ok(data);
    } catch (error) {
      return fail(error instanceof Error ? error.message : '无效地址', 400);
    }
  }

}

