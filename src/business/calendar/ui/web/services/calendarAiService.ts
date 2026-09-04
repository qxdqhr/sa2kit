import {
  CORE_STRUCTURED_MULTIMODAL_TASK_ID,
  type AiClientSettings,
  type StructuredMultimodalInput,
  type StructuredMultimodalOutput,
} from 'sa2kit/common/aiApi';
import { fileToAiImageInput } from 'sa2kit/common/aiApi';
import { createAiTaskRunner } from 'sa2kit/common/aiApi/client';
import {
  buildEventFromImagePrompt,
  parseEventFromImageOutput,
} from '../ai/eventFromImagePrompt';
import type {
  CalendarEventFromImageInput,
  CalendarEventFromImageOutput,
} from '../ai/eventFromImageTask.types';

const runStructuredMultimodal = createAiTaskRunner<
  StructuredMultimodalInput,
  StructuredMultimodalOutput
>(CORE_STRUCTURED_MULTIMODAL_TASK_ID);

export async function analyzeCalendarEventFromImage(
  input: CalendarEventFromImageInput,
  options?: { signal?: AbortSignal; clientSettings?: AiClientSettings }
): Promise<CalendarEventFromImageOutput> {
  const { systemPrompt, userPrompt, jsonSchemaHint } = buildEventFromImagePrompt(input);

  const result = await runStructuredMultimodal(
    {
      systemPrompt,
      userPrompt,
      jsonSchemaHint,
      media: [{ kind: 'image', base64: input.imageBase64, mimeType: input.mimeType }],
      temperature: 0.1,
    },
    options
  );

  return parseEventFromImageOutput(result.json);
}

/** 将上传图片转为识图任务输入 */
export async function buildCalendarImageInput(
  file: File
): Promise<Pick<CalendarEventFromImageInput, 'imageBase64' | 'mimeType'>> {
  const image = await fileToAiImageInput(file);
  return { imageBase64: image.base64, mimeType: image.mimeType };
}

export type { CalendarEventFromImageInput, CalendarEventFromImageOutput };
