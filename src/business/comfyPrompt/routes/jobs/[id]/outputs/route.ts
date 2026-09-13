import type { ComfyPromptRouteConfig } from '../../../shared';
import { createDb, ok, fail, requireAuthUser } from '../../../shared';


export function createDeleteJobsByIdOutputsHandler(config: ComfyPromptRouteConfig) {
  const dbService = createDb(config);
  return async (request: Request,
  { params }: { params: Promise<{ id: string }> },) => {
    const { user, response } = await requireAuthUser(config, request);
    if (response) return response;

    const id = Number((await params).id);
    if (!Number.isFinite(id)) return fail('无效 ID', 400);

    const body = (await request.json()) as { indices?: number[] };
    const indices = body.indices;
    if (!Array.isArray(indices) || !indices.length) {
      return fail('请指定要删除的图片索引', 400);
    }

    const updated = await dbService.removeJobOutputs(user!.id, id, indices);
    if (!updated) return fail('任务不存在', 404);

    return ok(updated);
  }

}

