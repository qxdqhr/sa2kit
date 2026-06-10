import { applyPromptTemplate } from '../prompt/template';
import type { AiChatInputOptions, AiChatResponse, AiChatSession, AiChatSessionOptions, AiMessage } from '../types';

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

export const createChatSession = (options: AiChatSessionOptions): AiChatSession => {
  let systemPrompt = options.systemPrompt;
  let messages = buildBaseMessages(systemPrompt, options.initialMessages);

  const reset = () => {
    messages = buildBaseMessages(systemPrompt, options.initialMessages);
  };

  const setSystemPrompt = (prompt?: string) => {
    systemPrompt = prompt;
    reset();
  };

  const sendMessage = async (
    input: string,
    requestOptions: AiChatInputOptions = {}
  ): Promise<AiChatResponse> => {
    const { template, variables, ...chatOptions } = requestOptions;
    const activeTemplate = template ?? options.template;
    const mergedVariables = { input, ...(variables ?? {}) };
    const content = activeTemplate ? applyPromptTemplate(activeTemplate, mergedVariables) : input;

    const userMessage: AiMessage = { role: 'user', content };
    const nextMessages = [...messages, userMessage];

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

    messages = [...nextMessages, assistantMessage];

    return response;
  };

  return {
    getMessages: () => messages,
    setSystemPrompt,
    reset,
    sendMessage,
  };
};
