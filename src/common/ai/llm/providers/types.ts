import type { AiChatChunk, AiChatRequest, AiChatResponse, ResolvedAiClientConfig } from '../types';

export interface AiProvider {
  id?: string;
  sendChat(request: AiChatRequest, config: ResolvedAiClientConfig): Promise<AiChatResponse>;
  streamChat?(
    request: AiChatRequest,
    config: ResolvedAiClientConfig
  ): AsyncIterable<AiChatChunk>;
}
