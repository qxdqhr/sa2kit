import type { ComfyPromptRouteConfig } from '../shared';
import { createDb, ok, fail, requireAuthUser } from '../shared';
import type { WorkflowFormData } from '../../domain/types';


export function createGetWorkflowsHandler(config: ComfyPromptRouteConfig) {
  const dbService = createDb(config);
  return async (request: Request) => {
    const { user, response } = await requireAuthUser(config, request);
    if (response) return response;
    const data = await dbService.getWorkflows(user!.id);
    return ok(data);
  }


}

export function createPostWorkflowsHandler(config: ComfyPromptRouteConfig) {
  const dbService = createDb(config);
  return async (request: Request) => {
    const { user, response } = await requireAuthUser(config, request);
    if (response) return response;
    const body = (await request.json()) as WorkflowFormData;
    if (!body.name?.trim()) return fail('工作流名称不能为空', 400);
    if (!body.workflowJson || typeof body.workflowJson !== 'object') {
      return fail('工作流 JSON 无效', 400);
    }
    const data = await dbService.createWorkflow(user!.id, body);
    return ok(data);
  }

}

