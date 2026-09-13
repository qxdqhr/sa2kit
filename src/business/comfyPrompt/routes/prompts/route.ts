import type { ComfyPromptRouteConfig } from '../shared';
import { createDb, ok, fail, requireAuthUser } from '../shared';
import type { PromptFormData, PromptKind } from '../../domain/types';


export function createGetPromptsHandler(config: ComfyPromptRouteConfig) {
  const dbService = createDb(config);
  return async (request: Request) => {
    const { user, response } = await requireAuthUser(config, request);
    if (response) return response;
    const { searchParams } = new URL(request.url);
    const kind = searchParams.get('kind') as PromptKind | null;
    const data = await dbService.getPrompts(user!.id, kind || undefined);
    return ok(data);
  }


}

export function createPostPromptsHandler(config: ComfyPromptRouteConfig) {
  const dbService = createDb(config);
  return async (request: Request) => {
    const { user, response } = await requireAuthUser(config, request);
    if (response) return response;
    const body = (await request.json()) as PromptFormData;
    if (!body.title?.trim()) return fail('标题不能为空', 400);
    if (!body.content?.trim()) return fail('提示词内容不能为空', 400);
    const data = await dbService.createPrompt(user!.id, body);
    return ok(data);
  }

}

