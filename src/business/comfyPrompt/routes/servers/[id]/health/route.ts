import type { ComfyPromptRouteConfig } from '../../../shared';
import { createDb, ok, fail, requireAuthUser } from '../../../shared';
import { ComfyUiClient } from '../../../../server/comfyUiClient';


export function createPostServersByIdHealthHandler(config: ComfyPromptRouteConfig) {
  const dbService = createDb(config);
  return async (request: Request, { params }: { params: Promise<{ id: string }> }) => {
    const { user, response } = await requireAuthUser(config, request);
    if (response) return response;
    const id = Number((await params).id);
    if (!Number.isFinite(id)) return fail('无效 ID', 400);

    const server = await dbService.getServerById(user!.id, id);
    if (!server) return fail('服务器不存在', 404);

    const client = new ComfyUiClient(server.baseUrl);
    const result = await client.healthCheck();
    const now = new Date();

    await dbService.updateServer(user!.id, id, {
      lastCheckAt: now,
      lastCheckOk: result.ok,
      lastError: result.ok ? null : result.error ?? '连接失败',
    });

    return ok({
      ok: result.ok,
      error: result.error,
      checkedAt: now.toISOString(),
    });
  }

}

