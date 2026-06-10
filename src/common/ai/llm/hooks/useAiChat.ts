import { useCallback, useRef, useState } from 'react';
import { applyPromptTemplate } from '../prompt/template';
import type {
  AiChatInputOptions,
  AiChatResponse,
  AiChatStatus,
  AiClient,
  AiMessage,
} from '../types';

export interface UseAiChatOptions {
  client: AiClient;
  systemPrompt?: string;
  template?: string;
  initialMessages?: AiMessage[];
}

const buildBaseMessages = (systemPrompt?: string, initialMessages?: AiMessage[]): AiMessage[] => {
  const baseMessages: AiMessage[] = [];
  if (systemPrompt) {
    baseMessages.push({ role: 'system', content: systemPrompt });
  }
  if (initialMessages?.length) {
    baseMessages.push(...initialMessages);
  }
  return baseMessages;
};

export const useAiChat = (options: UseAiChatOptions) => {
  const systemPromptRef = useRef(options.systemPrompt);
  const templateRef = useRef(options.template);
  const [messages, setMessages] = useState<AiMessage[]>(() =>
    buildBaseMessages(systemPromptRef.current, options.initialMessages)
  );
  const messagesRef = useRef(messages);
  const [status, setStatus] = useState<AiChatStatus>('idle');
  const [error, setError] = useState<Error | null>(null);
  const [lastResponse, setLastResponse] = useState<AiChatResponse | null>(null);

  const syncMessages = (nextMessages: AiMessage[]) => {
    messagesRef.current = nextMessages;
    setMessages(nextMessages);
  };

  const reset = useCallback(() => {
    syncMessages(buildBaseMessages(systemPromptRef.current, options.initialMessages));
    setStatus('idle');
    setError(null);
    setLastResponse(null);
  }, [options.initialMessages]);

  const setSystemPrompt = useCallback(
    (prompt?: string) => {
      systemPromptRef.current = prompt;
      reset();
    },
    [reset]
  );

  const sendMessage = useCallback(
    async (input: string, requestOptions: AiChatInputOptions = {}) => {
      const { template, variables, ...chatOptions } = requestOptions;
      const activeTemplate = template ?? templateRef.current;
      const mergedVariables = { input, ...(variables ?? {}) };
      const content = activeTemplate ? applyPromptTemplate(activeTemplate, mergedVariables) : input;

      const userMessage: AiMessage = { role: 'user', content };
      const nextMessages = [...messagesRef.current, userMessage];
      syncMessages(nextMessages);
      setStatus('loading');
      setError(null);

      try {
        const response = await options.client.sendChat({
          messages: nextMessages,
          ...chatOptions,
        });

        const assistantMessage: AiMessage =
          response.message ?? {
            role: 'assistant',
            content: response.content,
            toolCalls: response.toolCalls,
          };
        const updatedMessages = [...nextMessages, assistantMessage];
        syncMessages(updatedMessages);
        setStatus('success');
        setLastResponse(response);
        return response;
      } catch (err) {
        const nextError = err instanceof Error ? err : new Error(String(err));
        setStatus('error');
        setError(nextError);
        throw nextError;
      }
    },
    [options.client]
  );

  return {
    status,
    isLoading: status === 'loading',
    error,
    messages,
    lastResponse,
    sendMessage,
    reset,
    setSystemPrompt,
  };
};
