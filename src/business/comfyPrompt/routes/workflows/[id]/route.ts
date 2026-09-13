import type { ComfyPromptRouteConfig } from '../../shared';
import { createDb, ok, fail, requireAuthUser } from '../../shared';
import type { WorkflowFormData } from '../../../domain/types';


export function createGetWorkflowsByIdHandler(config: ComfyPromptRouteConfig) {
  const dbService = createDb(config);
  return async (request: Request, { params }: { params: Promise<{ id: string }> }) => {
    const { user, response } = await requireAuthUser(config, request);
    if (response) return response;
    const id = Number((await params).id);
    if (!Number.isFinite(id)) return fail('无效 ID', 400);
    const data = await dbService.getWorkflowById(user!.id, id);
    if (!data) return fail('工作流不存在', 404);
    return ok(data);
  }


}

export function createPutWorkflowsByIdHandler(config: ComfyPromptRouteConfig) {
  const dbService = createDb(config);
  return async (request: Request, { params }: { params: Promise<{ id: string }> }) => {
    const { user, response } = await requireAuthUser(config, request);
    if (response) return response;
    const id = Number((await params).id);
    if (!Number.isFinite(id)) return fail('无效 ID', 400);
    const body = (await request.json()) as Partial<WorkflowFormData>;
    const data = await dbService.updateWorkflow(user!.id, id, body);
    if (!data) return fail('工作流不存在', 404);
    return ok(data);
  }


}

export function createDeleteWorkflowsByIdHandler(config: ComfyPromptRouteConfig) {
  const dbService = createDb(config);
  return async (request: Request, { params }: { params: Promise<{ id: string }> }) => {
    const { user, response } = await requireAuthUser(config, request);
    if (response) return response;
    const id = Number((await params).id);
    if (!Number.isFinite(id)) return fail('无效 ID', 400);
    const deleted = await dbService.deleteWorkflow(user!.id, id);
    if (!deleted) return fail('工作流不存在', 404);
    return ok({ deleted: true });
  }

}

