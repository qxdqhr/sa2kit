import type { AiTaskDefinition, TextCompletionInput, TextCompletionOutput } from '../types';
import { callCompletion } from '../callCompletion';
import { CORE_LLM_COMPLETION_TASK_ID } from '../types';

function isTextCompletionInput(input: unknown): input is TextCompletionInput {
  if (!input || typeof input !== 'object') return false;
  const value = input as TextCompletionInput;
  return typeof value.userPrompt === 'string' && value.userPrompt.trim().length > 0;
}

export const coreLlmCompletionTask: AiTaskDefinition<TextCompletionInput, TextCompletionOutput> = {
  id: CORE_LLM_COMPLETION_TASK_ID,
  description: '通用文本补全：system/user 提示词 → 模型文本',
  validateInput(input) {
    if (!isTextCompletionInput(input)) {
      throw new Error('userPrompt 为必填');
    }
    return input;
  },
  async execute(input, ctx) {
    const result = await callCompletion(
      {
        systemPrompt: input.systemPrompt,
        userPrompt: input.userPrompt,
        model: input.model,
        temperature: input.temperature,
        maxTokens: input.maxTokens,
        connection: input.connection,
      },
      ctx.clientSettings
    );

    return {
      data: {
        content: result.content,
        rawText: result.content,
      },
      meta: {
        model: result.model,
        provider: 'openai-compatible',
      },
    };
  },
};
