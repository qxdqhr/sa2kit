'use client';

import { useCallback } from 'react';
import {
  CORE_STRUCTURED_MULTIMODAL_TASK_ID,
  type StructuredMultimodalInput,
  type StructuredMultimodalOutput,
} from 'sa2kit/common/aiApi';
import { useAiTask } from 'sa2kit/common/aiApi/client';
import { useAiApiSettings } from 'sa2kit/common/aiApi/client';
import { toServerClientSettings } from 'sa2kit/common/aiApi/client';
import {
  buildEventFromImagePrompt,
  parseEventFromImageOutput,
} from '../ai/eventFromImagePrompt';
import type { CalendarEventFromImageInput, CalendarEventFromImageOutput } from '../ai/eventFromImageTask.types';

export function useCalendarEventFromImage() {
  const { settings } = useAiApiSettings();
  const { execute, loading, error, reset } = useAiTask<
    StructuredMultimodalInput,
    StructuredMultimodalOutput
  >(CORE_STRUCTURED_MULTIMODAL_TASK_ID);

  const analyzeFromImage = useCallback(
    async (
      input: CalendarEventFromImageInput
    ): Promise<CalendarEventFromImageOutput> => {
      const { systemPrompt, userPrompt, jsonSchemaHint } = buildEventFromImagePrompt(input);
      const clientSettings = toServerClientSettings(settings);

      const response = await execute(
        {
          systemPrompt,
          userPrompt,
          jsonSchemaHint,
          media: [{ kind: 'image', base64: input.imageBase64, mimeType: input.mimeType }],
          temperature: 0.1,
        },
        { clientSettings: clientSettings }
      );

      if (!response.success || !response.data) {
        throw new Error(response.error?.message ?? '识图失败，请重试');
      }

      return parseEventFromImageOutput(response.data.json);
    },
    [execute, settings]
  );

  return { analyzeFromImage, loading, error, reset };
}
