import type { AiClientSettings, AudioStrategy } from '../types';

export interface AiApiSettings {
  apiKey: string;
  baseUrl: string;
  visionModel: string;
  textModel?: string;
  audioModel?: string;
  audioStrategy?: AudioStrategy;
}

export const DEFAULT_AI_API_SETTINGS: AiApiSettings = {
  apiKey: '',
  baseUrl: 'https://api.openai.com/v1',
  visionModel: 'gpt-4o-mini',
  textModel: 'gpt-4o-mini',
  audioModel: 'whisper-1',
  audioStrategy: 'auto',
};

export const AI_API_SETTINGS_STORAGE_KEY = 'ai-api-settings';

export function loadAiApiSettings(
  storageKey = AI_API_SETTINGS_STORAGE_KEY,
  defaults: AiApiSettings = DEFAULT_AI_API_SETTINGS
): AiApiSettings {
  if (typeof window === 'undefined') return defaults;
  try {
    const raw = localStorage.getItem(storageKey);
    if (!raw) return defaults;
    return { ...defaults, ...JSON.parse(raw) };
  } catch {
    return defaults;
  }
}

export function saveAiApiSettings(
  settings: AiApiSettings,
  storageKey = AI_API_SETTINGS_STORAGE_KEY
): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(storageKey, JSON.stringify(settings));
}

export function toClientSettings(settings: AiApiSettings): AiClientSettings | undefined {
  const client: AiClientSettings = {};
  if (settings.apiKey.trim()) client.apiKey = settings.apiKey.trim();
  if (settings.baseUrl.trim()) client.baseUrl = settings.baseUrl.trim();
  const visionModel = settings.visionModel.trim();
  const textModel = settings.textModel?.trim() || visionModel;
  const audioModel = settings.audioModel?.trim();
  if (visionModel) client.visionModel = visionModel;
  if (textModel) client.textModel = textModel;
  if (audioModel) client.audioModel = audioModel;
  if (settings.audioStrategy) client.audioStrategy = settings.audioStrategy;
  return Object.keys(client).length > 0 ? client : undefined;
}

/**
 * 浏览器未填写 API Key 时，完全依赖服务端环境变量（AI_API_KEY 等），
 * 避免 localStorage 中的 baseUrl/model 覆盖宿主 YAML 配置。
 */
export function toServerClientSettings(settings: AiApiSettings): AiClientSettings | undefined {
  if (!settings.apiKey.trim()) {
    return undefined;
  }
  return toClientSettings(settings);
}

/** 仅当浏览器填写了 API Key 时才向服务端传递 clientSettings */
export function pickClientSettingsFromStorage(
  storageKey = AI_API_SETTINGS_STORAGE_KEY,
  defaults: AiApiSettings = DEFAULT_AI_API_SETTINGS
): AiClientSettings | undefined {
  return toServerClientSettings(loadAiApiSettings(storageKey, defaults));
}
