import type {
  AiTaskDefinition,
  StructuredMultimodalInput,
  StructuredMultimodalOutput,
} from '../types';
import { callMultimodalChat } from '../callMultimodalChat';
import { extractJsonObject } from '../jsonUtils';
import { assertValidMultimodalMedia } from '../mediaUtils';
import { resolveAiConnectionConfig } from '../resolveConfig';
import { CORE_STRUCTURED_MULTIMODAL_TASK_ID } from '../types';

function isStructuredMultimodalInput(input: unknown): input is StructuredMultimodalInput {
  if (!input || typeof input !== 'object') return false;
  const value = input as StructuredMultimodalInput;
  return typeof value.systemPrompt === 'string' && typeof value.userPrompt === 'string';
}

export const coreStructuredMultimodalTask: AiTaskDefinition<
  StructuredMultimodalInput,
  StructuredMultimodalOutput
> = {
  id: CORE_STRUCTURED_MULTIMODAL_TASK_ID,
  description: '通用结构化多模态任务：文本 + 可选图片/语音 → JSON',
  validateInput(input) {
    if (!isStructuredMultimodalInput(input)) {
      throw new Error('systemPrompt 与 userPrompt 为必填');
    }
    const config = resolveAiConnectionConfig(input.connection);
    assertValidMultimodalMedia(input.media, {
      maxImageBytes: config?.maxImageBytes ?? 5 * 1024 * 1024,
      maxAudioBytes: config?.maxAudioBytes ?? 25 * 1024 * 1024,
    });
    return input;
  },
  async execute(input, ctx) {
    const schemaHint = input.jsonSchemaHint
      ? `\n\n请严格输出 JSON 对象，结构参考：\n${input.jsonSchemaHint}`
      : '\n\n请严格输出 JSON 对象，不要包含 Markdown 代码块。';

    const result = await callMultimodalChat(
      {
        systemPrompt: input.systemPrompt,
        userPrompt: `${input.userPrompt}${schemaHint}`,
        media: input.media,
        model: input.model,
        temperature: input.temperature ?? 0.2,
        maxTokens: input.maxTokens,
        jsonMode: true,
        audioStrategy: input.audioStrategy,
        connection: input.connection,
      },
      ctx.clientSettings
    );

    const json = extractJsonObject(result.content);

    return {
      data: {
        json,
        rawText: result.content,
      },
      meta: {
        model: result.model,
        provider: 'openai-compatible',
        rawSummary: result.audioHandling
          ? `audio=${result.audioHandling}`
          : undefined,
      },
    };
  },
};
