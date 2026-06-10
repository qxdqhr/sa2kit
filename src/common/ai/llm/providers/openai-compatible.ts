import type {
  AiChatRequest,
  AiChatResponse,
  AiMessage,
  AiToolCall,
  AiUsage,
  ResolvedAiClientConfig,
} from '../types';
import type { AiProvider } from './types';
import { requestJson } from '../client/request';

export const DEFAULT_OPENAI_BASE_URL = 'https://api.openai.com/v1';
export const DEFAULT_OPENAI_MODEL = 'gpt-3.5-turbo';

type OpenAIToolCall = {
  id?: string;
  type?: string;
  function?: {
    name?: string;
    arguments?: string;
  };
};

type OpenAIMessage = {
  role?: string;
  content?: string | null;
  tool_calls?: OpenAIToolCall[];
};

type OpenAIChatResponse = {
  id: string;
  choices?: Array<{
    message?: OpenAIMessage;
  }>;
  usage?: {
    prompt_tokens?: number;
    completion_tokens?: number;
    total_tokens?: number;
  };
};

const joinUrl = (base: string, path: string): string => {
  const trimmedBase = base.replace(/\/+$/, '');
  const trimmedPath = path.replace(/^\/+/, '');
  return `${trimmedBase}/${trimmedPath}`;
};

const normalizeToolCalls = (toolCalls?: OpenAIToolCall[]): AiToolCall[] | undefined => {
  if (!toolCalls || !toolCalls.length) {
    return undefined;
  }

  return toolCalls.map((call, index) => ({
    id: call?.id ?? String(index),
    type: 'function',
    function: {
      name: call?.function?.name ?? '',
      arguments: call?.function?.arguments ?? '',
    },
  }));
};

const normalizeUsage = (usage?: OpenAIChatResponse['usage']): AiUsage | undefined => {
  if (!usage) {
    return undefined;
  }

  return {
    promptTokens: usage.prompt_tokens,
    completionTokens: usage.completion_tokens,
    totalTokens: usage.total_tokens,
  };
};

const mapMessage = (message: AiMessage): Record<string, any> => {
  const mapped: Record<string, any> = {
    role: message.role,
    content: message.content,
  };

  if (message.name) {
    mapped.name = message.name;
  }
  if (message.toolCallId) {
    mapped.tool_call_id = message.toolCallId;
  }
  if (message.toolCalls?.length) {
    mapped.tool_calls = message.toolCalls.map((call) => ({
      id: call.id,
      type: call.type,
      function: {
        name: call.function.name,
        arguments: call.function.arguments,
      },
    }));
  }

  return mapped;
};

export const createOpenAICompatibleProvider = (): AiProvider => {
  return {
    id: 'openai-compatible',
    sendChat: async (request: AiChatRequest, config: ResolvedAiClientConfig): Promise<AiChatResponse> => {
      if (request.stream) {
        throw new Error('Streaming is not supported in sendChat. Use streamChat when available.');
      }

      const model = request.model ?? config.model ?? DEFAULT_OPENAI_MODEL;
      if (!model) {
        throw new Error('Model is required for chat completion requests.');
      }

      const payload: Record<string, any> = {
        model,
        messages: request.messages.map(mapMessage),
      };

      if (request.temperature !== undefined) {
        payload.temperature = request.temperature;
      }
      if (request.maxTokens !== undefined) {
        payload.max_tokens = request.maxTokens;
      }
      if (request.topP !== undefined) {
        payload.top_p = request.topP;
      }
      if (request.stop !== undefined) {
        payload.stop = request.stop;
      }
      if (request.tools) {
        payload.tools = request.tools;
      }
      if (request.toolChoice) {
        payload.tool_choice = request.toolChoice;
      }

      const url = joinUrl(config.baseUrl || DEFAULT_OPENAI_BASE_URL, 'chat/completions');
      const response = await requestJson<OpenAIChatResponse>({
        url,
        method: 'POST',
        headers: config.headers,
        body: payload,
        timeoutMs: config.timeoutMs,
        requestAdapter: config.requestAdapter,
      });

      const firstMessage = response.choices?.[0]?.message;
      const toolCalls = normalizeToolCalls(firstMessage?.tool_calls);
      const content = firstMessage?.content ?? '';
      const assistantMessage: AiMessage = {
        role: 'assistant',
        content,
        toolCalls,
      };

      return {
        id: response.id ?? '',
        content,
        message: assistantMessage,
        usage: normalizeUsage(response.usage),
        toolCalls,
        raw: response,
      };
    },
  };
};
