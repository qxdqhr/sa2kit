import { mimeToAudioFormat } from './audioUtils';
import type { AiMediaInput } from './types';
import {
  assertVisionCapableModel,
  detectVisionMessageFormat,
  type VisionMessageFormat,
} from './visionMessageFormats';

export type { VisionMessageFormat };

export function buildMultimodalMessages(options: {
  systemPrompt: string;
  userPrompt: string;
  images: AiMediaInput[];
  nativeAudios: AiMediaInput[];
  format: VisionMessageFormat;
}): Array<Record<string, unknown>> {
  const { systemPrompt, userPrompt, images, nativeAudios, format } = options;
  const hasImages = images.length > 0;
  const hasNativeAudio = nativeAudios.length > 0;

  if (format === 'ollama' && hasImages) {
    return [
      { role: 'system', content: systemPrompt },
      {
        role: 'user',
        content: userPrompt,
        images: images.map((image) => image.base64),
      },
    ];
  }

  const userContent: Array<Record<string, unknown>> = [{ type: 'text', text: userPrompt }];

  for (const image of images) {
    userContent.push({
      type: 'image_url',
      image_url: {
        url: `data:${image.mimeType};base64,${image.base64}`,
      },
    });
  }

  for (const audio of nativeAudios) {
    userContent.push({
      type: 'input_audio',
      input_audio: {
        data: audio.base64,
        format: mimeToAudioFormat(audio.mimeType),
      },
    });
  }

  const useStructuredContent = hasImages || hasNativeAudio;

  return [
    { role: 'system', content: systemPrompt },
    { role: 'user', content: useStructuredContent ? userContent : userPrompt },
  ];
}

export function assertMultimodalCapableModel(
  modelId: string,
  options: { baseUrl?: string; hasImages?: boolean; hasNativeAudio?: boolean }
): void {
  assertVisionCapableModel(modelId, {
    baseUrl: options.baseUrl,
    hasImages: options.hasImages,
  });

  if (!options.hasNativeAudio) return;

  const format = options.baseUrl ? detectVisionMessageFormat(options.baseUrl) : 'openai';
  if (format === 'ollama') {
    throw new Error('当前 Ollama 连接不支持 chat 内嵌音频，请改用 audioStrategy: "stt" 或 "auto"');
  }
}

export {
  detectVisionMessageFormat,
  assertVisionCapableModel,
  isImageUrlVariantError,
  toVisionApiErrorMessage,
} from './visionMessageFormats';

export { isLikelyNativeAudioChatModel, isLikelyVisionModel } from './modelHeuristics';
