import type { AiClientSettings, AiConnectionConfig, AudioStrategy } from './types';

const DEFAULT_BASE_URL = 'https://api.openai.com/v1';
const DEFAULT_TEXT_MODEL = 'gpt-4o-mini';
const DEFAULT_VISION_MODEL = 'gpt-4o-mini';
const DEFAULT_AUDIO_MODEL = 'whisper-1';
const DEFAULT_AUDIO_STRATEGY: AudioStrategy = 'auto';
const DEFAULT_TIMEOUT_MS = 60_000;
const DEFAULT_MAX_IMAGE_BYTES = 5 * 1024 * 1024;
const DEFAULT_MAX_AUDIO_BYTES = 25 * 1024 * 1024;

function readEnv(name: string): string {
  if (typeof process === 'undefined' || !process.env) {
    return '';
  }
  return process.env[name]?.trim() ?? '';
}

/**
 * 合并连接配置：显式 connection > clientSettings > 环境变量。
 * 缺少 apiKey 时返回 null。
 */
export function resolveAiConnectionConfig(
  ...sources: Array<AiClientSettings | undefined>
): AiConnectionConfig | null {
  const merged: AiClientSettings = {};
  for (const source of sources) {
    if (!source) continue;
    Object.assign(merged, source);
  }

  const envApiKey = readEnv('AI_API_KEY') || readEnv('OPENAI_API_KEY');
  const apiKey = merged.apiKey?.trim() || envApiKey;
  if (!apiKey) {
    return null;
  }

  const baseUrl =
    merged.baseUrl?.trim() || readEnv('AI_BASE_URL') || DEFAULT_BASE_URL;
  const visionModel =
    merged.visionModel?.trim() ||
    readEnv('AI_VISION_MODEL') ||
    merged.model?.trim() ||
    DEFAULT_VISION_MODEL;
  const textModel =
    merged.textModel?.trim() ||
    readEnv('AI_TEXT_MODEL') ||
    merged.model?.trim() ||
    visionModel ||
    DEFAULT_TEXT_MODEL;

  const audioModel =
    merged.audioModel?.trim() || readEnv('AI_AUDIO_MODEL') || DEFAULT_AUDIO_MODEL;
  const envAudioStrategy = readEnv('AI_AUDIO_STRATEGY') as AudioStrategy | '';
  const audioStrategy: AudioStrategy =
    merged.audioStrategy ?? (envAudioStrategy || DEFAULT_AUDIO_STRATEGY);

  return {
    apiKey,
    baseUrl,
    model: merged.model?.trim() || textModel,
    textModel,
    visionModel,
    audioModel,
    audioStrategy,
    timeoutMs: merged.timeoutMs ?? Number(readEnv('AI_TIMEOUT_MS') || DEFAULT_TIMEOUT_MS),
    maxImageBytes:
      merged.maxImageBytes ?? Number(readEnv('AI_MAX_IMAGE_BYTES') || DEFAULT_MAX_IMAGE_BYTES),
    maxAudioBytes:
      merged.maxAudioBytes ?? Number(readEnv('AI_MAX_AUDIO_BYTES') || DEFAULT_MAX_AUDIO_BYTES),
  };
}

export function requireAiConnectionConfig(
  ...sources: Array<AiClientSettings | undefined>
): AiConnectionConfig {
  const config = resolveAiConnectionConfig(...sources);
  if (!config) {
    throw new Error('未配置 AI API Key，请传入 connection / clientSettings 或设置环境变量 AI_API_KEY');
  }
  return config;
}
