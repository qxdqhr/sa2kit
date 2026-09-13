import type { ComfyPromptRouteConfig } from '../shared';
import { createDb, ok, fail, requireAuthUser } from '../shared';
import type { PromptGroupFormData } from '../../domain/types';


export function createGetGroupsHandler(config: ComfyPromptRouteConfig) {
  const dbService = createDb(config);
  return async (request: Request) => {
    const { user, response } = await requireAuthUser(config, request);
    if (response) return response;
    const data = await dbService.getGroups(user!.id);
    return ok(data);
  }


}

export function createPostGroupsHandler(config: ComfyPromptRouteConfig) {
  const dbService = createDb(config);
  return async (request: Request) => {
    const { user, response } = await requireAuthUser(config, request);
    if (response) return response;
    const body = (await request.json()) as PromptGroupFormData;
    if (!body.name?.trim()) return fail('提示词分组名称不能为空', 400);
    const data = await dbService.createGroup(user!.id, body);
    return ok(data);
  }

}

