import type { ComfyPromptRouteConfig } from '../../shared';
import { createDb, ok, fail, requireAuthUser } from '../../shared';
import { refreshJobFromComfy } from '../../../server/jobRefresh';


export function createGetJobsByIdHandler(config: ComfyPromptRouteConfig) {
  const dbService = createDb(config);
  return async (request: Request, { params }: { params: Promise<{ id: string }> }) => {
    const { user, response } = await requireAuthUser(config, request);
    if (response) return response;
    const id = Number((await params).id);
    if (!Number.isFinite(id)) return fail('无效 ID', 400);

    let job = await dbService.getJobById(user!.id, id);
    if (!job) return fail('任务不存在', 404);

    job = await refreshJobFromComfy(user!.id, job, dbService);
    return ok(job);
  }

}

