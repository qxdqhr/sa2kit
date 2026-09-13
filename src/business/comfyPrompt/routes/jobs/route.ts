import type { ComfyPromptRouteConfig } from '../shared';
import { createDb, ok, fail, requireAuthUser } from '../shared';
import { randomUUID } from 'crypto';
import { ComfyUiClient } from '../../server/comfyUiClient';
import { injectWorkflowPrompt } from '../../server/injectWorkflowPrompt';
import type { SubmitJobFormData } from '../../domain/types';


export function createGetJobsHandler(config: ComfyPromptRouteConfig) {
  const dbService = createDb(config);
  return async (request: Request) => {
    const { user, response } = await requireAuthUser(config, request);
    if (response) return response;
    const data = await dbService.getJobs(user!.id);
    return ok(data);
  }


}

export function createPostJobsHandler(config: ComfyPromptRouteConfig) {
  const dbService = createDb(config);
  return async (request: Request) => {
    const { user, response } = await requireAuthUser(config, request);
    if (response) return response;

    const body = (await request.json()) as SubmitJobFormData;
    if (!body.serverId) return fail('请选择 ComfyUI 服务器', 400);
    if (!body.workflowId) return fail('请选择工作流', 400);

    const server = await dbService.getServerById(user!.id, body.serverId);
    if (!server?.enabled) return fail('服务器不存在或已禁用', 404);

    const workflow = await dbService.getWorkflowById(user!.id, body.workflowId);
    if (!workflow) return fail('工作流不存在', 404);

    const clientId = randomUUID();
    let injectedWorkflow: Record<string, unknown>;

    try {
      injectedWorkflow = injectWorkflowPrompt(workflow.workflowJson, {
        positivePrompt: body.positivePrompt,
        negativePrompt: body.negativePrompt,
        positiveNodeId: workflow.positiveNodeId,
        negativeNodeId: workflow.negativeNodeId,
        seedNodeId: workflow.seedNodeId,
        latentNodeId: workflow.latentNodeId,
        seed: body.seed,
        width: body.width,
        height: body.height,
      });
    } catch (error) {
      return fail(error instanceof Error ? error.message : '工作流注入失败', 400);
    }

    const job = await dbService.createJob(user!.id, {
      serverId: server.id,
      workflowId: workflow.id,
      clientId,
      positivePrompt: body.positivePrompt,
      negativePrompt: body.negativePrompt,
      requestJson: { prompt: injectedWorkflow, client_id: clientId },
    });

    try {
      const client = new ComfyUiClient(server.baseUrl);
      const queued = await client.queuePrompt(injectedWorkflow, clientId);
      const updated = await dbService.updateJob(user!.id, job.id, {
        promptId: queued.prompt_id,
        status: 'queued',
        responseJson: queued as unknown as Record<string, unknown>,
      });
      return ok(updated ?? job);
    } catch (error) {
      const message = error instanceof Error ? error.message : '提交 ComfyUI 失败';
      const updated = await dbService.updateJob(user!.id, job.id, {
        status: 'failed',
        errorMessage: message,
        completedAt: new Date(),
      });
      return fail(message, 502);
    }
  }

}

