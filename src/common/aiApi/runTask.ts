import { resolveAiConnectionConfig } from './resolveConfig';
import { getAiTask } from './taskRegistry';
import type { AiClientSettings, AiApiResponse, AiTaskContext } from './types';

function extractInputConnection(input: unknown): AiClientSettings | undefined {
  if (!input || typeof input !== 'object') return undefined;
  const connection = (input as { connection?: AiClientSettings }).connection;
  return connection && typeof connection === 'object' ? connection : undefined;
}

export async function runAiTask<TData = unknown>(
  taskId: string,
  input: unknown,
  ctx: AiTaskContext = {}
): Promise<AiApiResponse<TData>> {
  const started = Date.now();

  if (!resolveAiConnectionConfig(extractInputConnection(input), ctx.clientSettings)) {
    return {
      success: false,
      taskId,
      error: {
        code: 'AI_CONFIG_MISSING',
        message: '未配置 AI API Key，请传入 clientSettings.connection 或设置环境变量 AI_API_KEY',
      },
    };
  }

  const task = getAiTask(taskId);
  if (!task) {
    return {
      success: false,
      taskId,
      error: {
        code: 'TASK_NOT_FOUND',
        message: `未注册的任务: ${taskId}`,
      },
    };
  }

  try {
    const validated = task.validateInput(input);
    const result = await task.execute(validated, ctx);

    return {
      success: true,
      taskId,
      data: result.data as TData,
      meta: {
        model: result.meta?.model ?? 'unknown',
        latencyMs: Date.now() - started,
        provider: result.meta?.provider ?? 'openai-compatible',
        confidence: result.meta?.confidence,
        rawSummary: result.meta?.rawSummary,
      },
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'AI 任务执行失败';
    const code = classifyError(message);

    return {
      success: false,
      taskId,
      error: { code, message },
      meta: {
        model: 'unknown',
        latencyMs: Date.now() - started,
      },
    };
  }
}

function classifyError(message: string) {
  if (message.includes('未配置') || message.includes('AI_API_KEY') || message.includes('apiKey')) {
    return 'AI_CONFIG_MISSING' as const;
  }
  if (message.includes('图片') || message.includes('格式')) {
    return message.includes('过大') ? ('PAYLOAD_TOO_LARGE' as const) : ('UNSUPPORTED_MEDIA' as const);
  }
  if (message.includes('解析') || message.includes('JSON')) {
    return 'AI_PARSE_FAILED' as const;
  }
  if (message.includes('必填') || message.includes('无效')) {
    return 'INVALID_INPUT' as const;
  }
  return 'AI_REQUEST_FAILED' as const;
}
