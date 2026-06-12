import { callChat } from './callChat';
import { requireAiConnectionConfig } from './resolveConfig';
import type { AiClientSettings } from './types';

export interface CallCompletionParams {
  systemPrompt?: string;
  userPrompt: string;
  model?: string;
  temperature?: number;
  maxTokens?: number;
  connection?: AiClientSettings;
}

export interface CallCompletionResult {
  content: string;
  model: string;
  raw?: unknown;
}

/**
 * 文本补全：连接信息与提示词均由调用方传入（或通过 connection 合并 env）。
 */
export async function callCompletion(
  params: CallCompletionParams,
  clientSettings?: AiClientSettings
): Promise<CallCompletionResult> {
  const config = requireAiConnectionConfig(params.connection, clientSettings);
  const model = params.model || config.textModel;

  const result = await callChat({
    baseUrl: config.baseUrl,
    apiKey: config.apiKey,
    model,
    systemPrompt: params.systemPrompt,
    userPrompt: params.userPrompt,
    temperature: params.temperature,
    maxTokens: params.maxTokens,
    timeoutMs: config.timeoutMs,
  });

  return {
    content: result.content,
    model: result.model || model,
    raw: result.raw,
  };
}
