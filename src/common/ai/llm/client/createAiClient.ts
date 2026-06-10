import type {
  AiChatRequest,
  AiChatRequestOptions,
  AiChatResponse,
  AiClient,
  AiClientConfig,
  AiMessage,
  ResolvedAiClientConfig,
} from '../types';
import type { AiProvider } from '../providers/types';
import { createOpenAICompatibleProvider } from '../providers/openai-compatible';

const DEFAULT_TIMEOUT_MS = 60_000;

const resolveApiKey = async (config: AiClientConfig): Promise<string | undefined> => {
  if (config.apiKey) {
    return config.apiKey;
  }
  if (config.getApiKey) {
    return await config.getApiKey();
  }
  return undefined;
};

const hasAuthorizationHeader = (headers: Record<string, string>): boolean => {
  return Object.keys(headers).some((key) => key.toLowerCase() === 'authorization');
};

const resolveHeaders = async (config: AiClientConfig): Promise<Record<string, string>> => {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(config.headers ?? {}),
  };

  if (!hasAuthorizationHeader(headers)) {
    const apiKey = await resolveApiKey(config);
    if (apiKey) {
      headers.Authorization = `Bearer ${apiKey}`;
    }
  }

  return headers;
};

const resolveClientConfig = async (config: AiClientConfig): Promise<ResolvedAiClientConfig> => {
  const headers = await resolveHeaders(config);

  return {
    ...config,
    baseUrl: config.baseUrl ?? 'https://api.openai.com/v1',
    headers,
    timeoutMs: config.timeoutMs ?? DEFAULT_TIMEOUT_MS,
  };
};

const resolveProvider = (provider?: AiProvider): AiProvider => {
  return provider ?? createOpenAICompatibleProvider();
};

export const createAiClient = (config: AiClientConfig): AiClient => {
  const provider = resolveProvider(config.provider);

  const sendChat = async (request: AiChatRequest): Promise<AiChatResponse> => {
    const resolvedConfig = await resolveClientConfig(config);
    config.logger?.debug?.('ai.sendChat', {
      model: request.model ?? resolvedConfig.model,
      messageCount: request.messages.length,
    });
    try {
      return await provider.sendChat(request, resolvedConfig);
    } catch (error) {
      config.logger?.error?.('ai.sendChat.error', error);
      throw error;
    }
  };

  type SendMessageOptions = AiChatRequestOptions & { systemPrompt?: string };

  const sendMessage = async (
    content: string,
    options?: SendMessageOptions
  ): Promise<AiChatResponse> => {
    const resolvedOptions: SendMessageOptions = options ?? {};
    const { systemPrompt, ...requestOptions } = resolvedOptions;

    const messages: AiMessage[] = [];
    if (systemPrompt) {
      messages.push({ role: 'system', content: systemPrompt });
    }
    messages.push({ role: 'user', content });

    return sendChat({
      messages,
      ...requestOptions,
    });
  };

  return {
    sendChat,
    sendMessage,
  };
};
