import type { RequestAdapter } from '../../request';
import type { PromptVariables } from './prompt/variables';
import type { AiProvider } from './providers/types';

export type AiRole = 'system' | 'user' | 'assistant' | 'tool';

export type AiToolChoice = {
  type: 'function';
  function: {
    name: string;
  };
};

export type AiToolDefinition = {
  type: 'function';
  function: {
    name: string;
    description?: string;
    parameters?: Record<string, any>;
  };
};

export type AiToolCall = {
  id: string;
  type: 'function';
  function: {
    name: string;
    arguments: string;
  };
};

export interface AiMessage {
  role: AiRole;
  content: string;
  name?: string;
  toolCallId?: string;
  toolCalls?: AiToolCall[];
}

export interface AiUsage {
  promptTokens?: number;
  completionTokens?: number;
  totalTokens?: number;
}

export interface AiChatRequestOptions {
  model?: string;
  temperature?: number;
  maxTokens?: number;
  topP?: number;
  stop?: string | string[];
  stream?: boolean;
  tools?: AiToolDefinition[];
  toolChoice?: 'auto' | 'none' | AiToolChoice;
}

export interface AiChatRequest extends AiChatRequestOptions {
  messages: AiMessage[];
}

export interface AiChatResponse {
  id: string;
  content: string;
  message?: AiMessage;
  usage?: AiUsage;
  raw?: unknown;
  toolCalls?: AiToolCall[];
}

export interface AiChatChunk {
  id: string;
  content?: string;
  delta?: string;
  toolCalls?: AiToolCall[];
  raw?: unknown;
}

export interface AiLogger {
  debug?: (message: string, data?: any) => void;
  info?: (message: string, data?: any) => void;
  warn?: (message: string, data?: any) => void;
  error?: (message: string, error?: any) => void;
}

export interface AiClientConfig {
  apiKey?: string;
  getApiKey?: () => Promise<string> | string;
  baseUrl?: string;
  model?: string;
  headers?: Record<string, string>;
  timeoutMs?: number;
  requestAdapter?: RequestAdapter;
  logger?: AiLogger;
  provider?: AiProvider;
}

export interface ResolvedAiClientConfig extends AiClientConfig {
  baseUrl: string;
  headers: Record<string, string>;
  timeoutMs: number;
}

export interface AiClient {
  sendChat(request: AiChatRequest): Promise<AiChatResponse>;
  sendMessage(
    content: string,
    options?: AiChatRequestOptions & { systemPrompt?: string }
  ): Promise<AiChatResponse>;
}

export type AiChatStatus = 'idle' | 'loading' | 'success' | 'error';

export interface AiChatInputOptions extends AiChatRequestOptions {
  template?: string;
  variables?: PromptVariables;
}

export interface AiChatSessionOptions {
  client: AiClient;
  systemPrompt?: string;
  template?: string;
  initialMessages?: AiMessage[];
}

export interface AiChatSession {
  getMessages(): AiMessage[];
  setSystemPrompt(prompt?: string): void;
  reset(): void;
  sendMessage(input: string, options?: AiChatInputOptions): Promise<AiChatResponse>;
}
