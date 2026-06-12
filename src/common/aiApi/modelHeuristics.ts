/** 非对话类模型 ID 片段（embedding、语音等） */
const NON_CHAT_PATTERNS = [
  /embed/i,
  /whisper/i,
  /tts/i,
  /dall-e/i,
  /moderation/i,
  /realtime/i,
  /audio/i,
  /transcrib/i,
  /sora/i,
];

/** 常见支持视觉输入的模型 ID 特征 */
const VISION_HINT_PATTERNS = [
  /^gpt-4o/i,
  /^gpt-4-turbo/i,
  /^gpt-4-vision/i,
  /^gpt-4\.1/i,
  /claude-3/i,
  /gemini.*(pro|flash|vision)/i,
  /qwen.*vl/i,
  /vision/i,
  /-vl/i,
  /llava/i,
  /doubao.*vision/i,
  /glm-4v/i,
  /internvl/i,
  /pixtral/i,
  /deepseek-vl/i,
];

/** 自动选择视觉模型时的优先级（精确或前缀匹配） */
const PREFERRED_VISION_MODELS = [
  'gpt-4o-mini',
  'gpt-4o',
  'gpt-4-turbo',
  'gpt-4-vision-preview',
  'gpt-4.1-mini',
  'gpt-4.1',
  'claude-3-5-sonnet-latest',
  'claude-3-5-haiku-latest',
  'gemini-2.0-flash',
  'gemini-1.5-flash',
  'gemini-1.5-pro',
  'qwen-vl-max',
  'qwen2-vl-72b-instruct',
];

function isChatModel(id: string): boolean {
  return !NON_CHAT_PATTERNS.some((pattern) => pattern.test(id));
}

/** 常见支持 chat 内嵌音频输入的模型 ID 特征（OpenAI 兼容） */
const NATIVE_AUDIO_CHAT_PATTERNS = [
  /^gpt-4o/i,
  /^gpt-4-turbo/i,
  /^gpt-4\.1/i,
  /gemini-2\.0/i,
  /gemini-1\.5/i,
];

/** STT 模型 ID 特征 */
const STT_MODEL_PATTERNS = [/whisper/i, /transcrib/i, /sensevoice/i, /paraformer/i];

export function isLikelyNativeAudioChatModel(id: string): boolean {
  const trimmed = id.trim();
  if (!trimmed) return false;
  if (STT_MODEL_PATTERNS.some((pattern) => pattern.test(trimmed))) return false;
  return NATIVE_AUDIO_CHAT_PATTERNS.some((pattern) => pattern.test(trimmed));
}

export function isLikelySttModel(id: string): boolean {
  return STT_MODEL_PATTERNS.some((pattern) => pattern.test(id.trim()));
}

export function filterSttModels(modelIds: string[]): string[] {
  return modelIds.filter(isLikelySttModel).sort((a, b) => a.localeCompare(b));
}

const PREFERRED_STT_MODELS = ['whisper-1', 'whisper-large-v3', 'whisper-large-v3-turbo'];

export function pickDefaultSttModel(modelIds: string[], current?: string): string | undefined {
  const sttModels = filterSttModels(modelIds);
  if (sttModels.length === 0) return undefined;

  const trimmedCurrent = current?.trim();
  if (trimmedCurrent && sttModels.includes(trimmedCurrent)) {
    return trimmedCurrent;
  }

  for (const preferred of PREFERRED_STT_MODELS) {
    const match = sttModels.find((id) => id === preferred || id.startsWith(`${preferred}-`));
    if (match) return match;
  }

  return sttModels[0];
}

export function isLikelyVisionModel(id: string): boolean {
  return VISION_HINT_PATTERNS.some((pattern) => pattern.test(id));
}

/** 明确不支持图片的对话模型 */
const TEXT_ONLY_MODEL_PATTERNS = [
  /^deepseek-chat/i,
  /^deepseek-reasoner/i,
  /^deepseek-r1/i,
  /^deepseek-v[34](?!.*vl)/i,
  /^gpt-3\.5/i,
  /^o1-mini/i,
  /^o3-mini/i,
];

export function isKnownTextOnlyModel(id: string): boolean {
  const trimmed = id.trim();
  if (!trimmed) return false;
  return TEXT_ONLY_MODEL_PATTERNS.some((pattern) => pattern.test(trimmed));
}

export function filterChatModels(modelIds: string[]): string[] {
  return modelIds.filter(isChatModel).sort((a, b) => a.localeCompare(b));
}

export function filterVisionModels(modelIds: string[]): string[] {
  return filterChatModels(modelIds)
    .filter((id) => isLikelyVisionModel(id) && !isKnownTextOnlyModel(id))
    .sort((a, b) => a.localeCompare(b));
}

function matchesPreferred(modelId: string, preferred: string): boolean {
  return modelId === preferred || modelId.startsWith(`${preferred}-`);
}

/** 从可用模型中挑选默认视觉模型 */
export function pickDefaultVisionModel(
  modelIds: string[],
  current?: string
): string | undefined {
  const visionModels = filterVisionModels(modelIds);
  if (visionModels.length === 0) return undefined;

  const trimmedCurrent = current?.trim();
  if (trimmedCurrent && visionModels.includes(trimmedCurrent)) {
    return trimmedCurrent;
  }

  for (const preferred of PREFERRED_VISION_MODELS) {
    const match = visionModels.find((id) => matchesPreferred(id, preferred));
    if (match) return match;
  }

  return visionModels[0];
}
