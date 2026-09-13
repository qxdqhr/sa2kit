import type { ComfyPromptDbService } from './comfyPromptDbService';
import type { ComfyJob } from '../domain/types';
import {
  ComfyUiClient,
  extractOutputImages,
  resolveHistoryStatus,
} from './comfyUiClient';

export async function refreshJobFromComfy(
  userId: string,
  job: ComfyJob,
  comfyPromptDbService: ComfyPromptDbService,
): Promise<ComfyJob> {
  if (!job.promptId || job.status === 'success' || job.status === 'failed' || job.status === 'cancelled') {
    return job;
  }

  const server = await comfyPromptDbService.getServerById(userId, job.serverId);
  if (!server?.enabled) return job;

  try {
    const client = new ComfyUiClient(server.baseUrl);
    const history = await client.getHistory(job.promptId);
    const status = resolveHistoryStatus(history, job.promptId);
    const outputImages = extractOutputImages(history, job.promptId);

    const updated = await comfyPromptDbService.updateJob(userId, job.id, {
      status,
      outputImages,
      responseJson: history[job.promptId] as Record<string, unknown> | null,
      errorMessage: status === 'failed' ? 'ComfyUI 执行失败' : null,
      completedAt: status === 'success' || status === 'failed' ? new Date() : null,
    });

    return updated ?? job;
  } catch (error) {
    const message = error instanceof Error ? error.message : '刷新任务状态失败';
    const updated = await comfyPromptDbService.updateJob(userId, job.id, {
      errorMessage: message,
    });
    return updated ?? job;
  }
}
