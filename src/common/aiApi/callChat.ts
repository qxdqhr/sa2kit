import type { RequestAdapter } from '../request';
import { requestJson } from './requestJson';

export const DEFAULT_OPENAI_BASE_URL = 'https://api.openai.com/v1';
export const DEFAULT_TEXT_MODEL = 'gpt-4o-mini';

export type ChatRole = 'system' | 'user' | 'assistant';

export interface ChatMessage {
  role: ChatRole;
  content: string;
}

export interface CallChatOptions {
  /** OpenAI 兼容 API Base URL */
  baseUrl: string;
  /** API Key */
  apiKey: string;
  model?: string;
  systemPrompt?: string;
  userPrompt?: string;
  messages?: ChatMessage[];
  temperature?: number;
  maxTokens?: number;
  topP?: number;
  stop?: string | string[];
  timeoutMs?: number;
  requestAdapter?: RequestAdapter;
}

export interface ChatUsage {
  promptTokens?: number;
  completionTokens?: number;
  totalTokens?: number;
}

export interface CallChatResult {
  content: string;
  model: string;
  usage?: ChatUsage;
  raw?: unknown;
}

type OpenAIChatResponse = {
  id?: string;
  model?: string;
  choices?: Array<{ message?: { content?: string | null } }>;
  usage?: {
    prompt_tokens?: number;
    completion_tokens?: number;
    total_tokens?: number;
  };
};

function joinUrl(base: string, path: string): string {
  return `${base.replace(/\/+$/, '')}/${path.replace(/^\/+/, '')}`;
}

function resolveMessages(input: {
  systemPrompt?: string;
  userPrompt?: string;
  messages?: ChatMessage[];
}): ChatMessage[] {
  if (input.messages?.length) {
    return input.messages;
  }

  const messages: ChatMessage[] = [];
  if (input.systemPrompt?.trim()) {
    messages.push({ role: 'system', content: input.systemPrompt.trim() });
  }
  if (input.userPrompt?.trim()) {
    messages.push({ role: 'user', content: input.userPrompt.trim() });
  }
  return messages;
}

/**
 * OpenAI 兼容文本对话：外部传入 URL、Key、提示词，返回模型生成内容。
 */
export async function callChat(options: CallChatOptions): Promise<CallChatResult> {
  const {
    baseUrl,
    apiKey,
    model,
    systemPrompt,
    userPrompt,
    messages,
    temperature,
    maxTokens,
    topP,
    stop,
    timeoutMs = 60_000,
    requestAdapter,
  } = options;

  if (!baseUrl?.trim()) {
    throw new Error('baseUrl 为必填');
  }
  if (!apiKey?.trim()) {
    throw new Error('apiKey 为必填');
  }

  const resolvedMessages = resolveMessages({ systemPrompt, userPrompt, messages });
  if (!resolvedMessages.length) {
    throw new Error('userPrompt 或 messages 至少提供一项');
  }

  const resolvedModel = model?.trim() || DEFAULT_TEXT_MODEL;
  const payload: Record<string, unknown> = {
    model: resolvedModel,
    messages: resolvedMessages,
  };

  if (temperature !== undefined) payload.temperature = temperature;
  if (maxTokens !== undefined) payload.max_tokens = maxTokens;
  if (topP !== undefined) payload.top_p = topP;
  if (stop !== undefined) payload.stop = stop;

  const raw = await requestJson<OpenAIChatResponse>({
    url: joinUrl(baseUrl.trim(), 'chat/completions'),
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey.trim()}`,
    },
    body: payload,
    timeoutMs,
    requestAdapter,
  });

  const content = raw.choices?.[0]?.message?.content ?? '';
  const usage = raw.usage
    ? {
        promptTokens: raw.usage.prompt_tokens,
        completionTokens: raw.usage.completion_tokens,
        totalTokens: raw.usage.total_tokens,
      }
    : undefined;

  return {
    content,
    model: raw.model ?? resolvedModel,
    usage,
    raw,
  };
}
