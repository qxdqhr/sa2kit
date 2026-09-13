import type { ComfyPromptRouteConfig } from '../shared';
import { createDb, ok, fail, requireAuthUser } from '../shared';
import type { PromptSetFormData } from '../../domain/types';


export function createGetSetsHandler(config: ComfyPromptRouteConfig) {
  const dbService = createDb(config);
  return async (request: Request) => {
    const { user, response } = await requireAuthUser(config, request);
    if (response) return response;
    const data = await dbService.getSets(user!.id);
    return ok(data);
  }


}

export function createPostSetsHandler(config: ComfyPromptRouteConfig) {
  const dbService = createDb(config);
  return async (request: Request) => {
    const { user, response } = await requireAuthUser(config, request);
    if (response) return response;
    const body = (await request.json()) as PromptSetFormData;
    if (!body.name?.trim()) return fail('提示词模板名称不能为空', 400);
    const data = await dbService.createSet(user!.id, body);
    return ok(data);
  }

}

