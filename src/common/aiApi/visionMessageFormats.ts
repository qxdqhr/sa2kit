import { isKnownTextOnlyModel, isLikelyVisionModel } from './modelHeuristics';

export type VisionMessageFormat = 'openai' | 'ollama';

export function detectVisionMessageFormat(baseUrl: string): VisionMessageFormat {
  const normalized = baseUrl.toLowerCase();
  if (
    normalized.includes('ollama') ||
    normalized.includes(':11434') ||
    normalized.includes('11434/')
  ) {
    return 'ollama';
  }
  return 'openai';
}

export function assertVisionCapableModel(
  modelId: string,
  options?: { baseUrl?: string; hasImages?: boolean }
): void {
  if (!options?.hasImages) return;

  const model = modelId.trim();
  if (!model) {
    throw new Error('识图需要选择视觉模型，请在 AI 设置中配置');
  }

  const format = options.baseUrl ? detectVisionMessageFormat(options.baseUrl) : 'openai';

  if (format === 'ollama') return;

  if (isKnownTextOnlyModel(model)) {
    throw new Error(
      `当前模型「${model}」不支持图片输入。请改用视觉模型，例如 gpt-4o-mini、qwen-vl-max、gemini-1.5-flash、deepseek-vl 等（DeepSeek 文本模型无法识图）。`
    );
  }

  if (!isLikelyVisionModel(model)) {
    throw new Error(
      `模型「${model}」可能不支持图片识图。请在 AI 设置中选择名称含 vl、vision、gpt-4o、gemini 等标识的视觉模型。`
    );
  }
}

export function isImageUrlVariantError(message: string): boolean {
  return (
    /unknown variant [`']?image_url[`']?/i.test(message) ||
    /expected [`']?text[`']?/i.test(message) ||
    /does not support.*image/i.test(message)
  );
}

export function toVisionApiErrorMessage(rawMessage: string, modelId: string): string {
  if (isImageUrlVariantError(rawMessage)) {
    return `当前模型「${modelId}」不接受图片请求（${rawMessage}）。请更换为支持识图的视觉模型。`;
  }
  return rawMessage;
}

export { isKnownTextOnlyModel, isLikelyVisionModel } from './modelHeuristics';
