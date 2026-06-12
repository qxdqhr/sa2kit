import { appendTranscriptionsToPrompt, isAudioInputError, resolveAudioHandling } from './audioStrategy';
import {
  assertMultimodalCapableModel,
  buildMultimodalMessages,
  detectVisionMessageFormat,
  toVisionApiErrorMessage,
} from './multimodalMessageFormats';
import { assertValidMultimodalMedia, splitMediaByKind } from './mediaUtils';
import { requireAiConnectionConfig } from './resolveConfig';
import { requestJson } from './requestJson';
import { transcribeAudios } from './transcribeAudio';
import type {
  AiAudioInput,
  AiClientSettings,
  AiMediaInput,
  MultimodalChatParams,
  MultimodalChatResult,
} from './types';

function joinUrl(baseUrl: string, path: string): string {
  return `${baseUrl.replace(/\/+$/, '')}/${path.replace(/^\/+/, '')}`;
}

type OpenAiChatResponse = {
  model?: string;
  choices?: Array<{ message?: { content?: string } }>;
  error?: { message?: string };
};

async function requestMultimodalChat(options: {
  config: ReturnType<typeof requireAiConnectionConfig>;
  model: string;
  messages: Array<Record<string, unknown>>;
  temperature?: number;
  maxTokens?: number;
  jsonMode?: boolean;
}): Promise<{ content: string; model: string; raw: unknown }> {
  const payload: Record<string, unknown> = {
    model: options.model,
    messages: options.messages,
    temperature: options.temperature ?? 0.2,
  };

  if (options.maxTokens !== undefined) {
    payload.max_tokens = options.maxTokens;
  }
  if (options.jsonMode) {
    payload.response_format = { type: 'json_object' };
  }

  const raw = await requestJson<OpenAiChatResponse>({
    url: joinUrl(options.config.baseUrl, 'chat/completions'),
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${options.config.apiKey}`,
    },
    body: payload,
    timeoutMs: options.config.timeoutMs,
  });

  return {
    content: raw.choices?.[0]?.message?.content ?? '',
    model: raw.model ?? options.model,
    raw,
  };
}

function toAudioInputs(audios: AiMediaInput[]): AiAudioInput[] {
  return audios.map((audio) => ({ base64: audio.base64, mimeType: audio.mimeType }));
}

/**
 * OpenAI 兼容多模态对话：文本 + 可选图片/语音。
 * audioStrategy=auto 时：优先 chat 内嵌音频（native），失败或未支持则 STT 转写后走文本 chat。
 */
export async function callMultimodalChat(
  params: MultimodalChatParams,
  clientSettings?: AiClientSettings
): Promise<MultimodalChatResult> {
  const config = requireAiConnectionConfig(params.connection, clientSettings);
  const media = assertValidMultimodalMedia(params.media, {
    maxImageBytes: config.maxImageBytes,
    maxAudioBytes: config.maxAudioBytes,
  });
  const { images, audios } = splitMediaByKind(media);
  const hasImages = images.length > 0;
  const hasAudio = audios.length > 0;

  const model =
    params.model ||
    (hasImages ? config.visionModel : hasAudio ? config.visionModel : config.textModel);
  const strategy = params.audioStrategy ?? config.audioStrategy;
  const format = detectVisionMessageFormat(config.baseUrl);
  let audioHandling = resolveAudioHandling({
    hasAudio,
    strategy,
    model,
    baseUrl: config.baseUrl,
  });

  let userPrompt = params.userPrompt;
  let transcriptions: string[] | undefined;
  let nativeAudios: AiMediaInput[] = [];

  if (audioHandling === 'stt' && hasAudio) {
    transcriptions = await transcribeAudios(toAudioInputs(audios), config);
    userPrompt = appendTranscriptionsToPrompt(userPrompt, transcriptions);
  } else if (audioHandling === 'native' && hasAudio) {
    nativeAudios = audios;
  }

  assertMultimodalCapableModel(model, {
    baseUrl: config.baseUrl,
    hasImages,
    hasNativeAudio: nativeAudios.length > 0,
  });

  const messages = buildMultimodalMessages({
    systemPrompt: params.systemPrompt,
    userPrompt,
    images,
    nativeAudios,
    format,
  });

  try {
    const result = await requestMultimodalChat({
      config,
      model,
      messages,
      temperature: params.temperature,
      maxTokens: params.maxTokens,
      jsonMode: params.jsonMode,
    });

    return {
      ...result,
      audioHandling,
      transcriptions,
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'AI 请求失败';

    if (
      audioHandling === 'native' &&
      hasAudio &&
      strategy === 'auto' &&
      isAudioInputError(message)
    ) {
      transcriptions = await transcribeAudios(toAudioInputs(audios), config);
      userPrompt = appendTranscriptionsToPrompt(params.userPrompt, transcriptions);
      audioHandling = 'stt';

      const fallbackMessages = buildMultimodalMessages({
        systemPrompt: params.systemPrompt,
        userPrompt,
        images,
        nativeAudios: [],
        format,
      });

      const result = await requestMultimodalChat({
        config,
        model,
        messages: fallbackMessages,
        temperature: params.temperature,
        maxTokens: params.maxTokens,
        jsonMode: params.jsonMode,
      });

      return {
        ...result,
        audioHandling,
        transcriptions,
      };
    }

    throw new Error(toVisionApiErrorMessage(message, model));
  }
}
