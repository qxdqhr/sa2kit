import { requestJson } from './requestJson';
import { resolveAiConnectionConfig } from './resolveConfig';
import type { AiClientSettings } from './types';
import {
  filterChatModels,
  filterVisionModels,
  pickDefaultVisionModel,
} from './modelHeuristics';

function joinUrl(baseUrl: string, path: string): string {
  return `${baseUrl.replace(/\/+$/, '')}/${path.replace(/^\/+/, '')}`;
}

interface OpenAiModelListResponse {
  data?: Array<{ id?: string }>;
  models?: Array<{ id?: string } | string>;
  error?: { message?: string };
}

function parseModelIds(raw: OpenAiModelListResponse): string[] {
  if (Array.isArray(raw.data)) {
    return raw.data.map((item) => item.id).filter((id): id is string => Boolean(id));
  }
  if (Array.isArray(raw.models)) {
    return raw.models
      .map((item) => (typeof item === 'string' ? item : item.id))
      .filter((id): id is string => Boolean(id));
  }
  return [];
}

export interface ListModelsResult {
  models: string[];
  visionModels: string[];
  suggestedVisionModel?: string;
}

export async function listOpenAiCompatibleModels(
  clientSettings?: AiClientSettings,
  currentVisionModel?: string
): Promise<ListModelsResult> {
  const config = resolveAiConnectionConfig(clientSettings);
  if (!config) {
    throw new Error('未配置 AI API Key，请在设置中填写或配置服务端环境变量');
  }

  const raw = await requestJson<OpenAiModelListResponse>({
    url: joinUrl(config.baseUrl, 'models'),
    method: 'GET',
    headers: {
      Authorization: `Bearer ${config.apiKey}`,
    },
    timeoutMs: config.timeoutMs,
  });

  const modelIds = parseModelIds(raw);
  if (modelIds.length === 0) {
    throw new Error('接口未返回可用模型');
  }

  const models = filterChatModels(modelIds);
  const visionModels = filterVisionModels(modelIds);
  const suggestedVisionModel = pickDefaultVisionModel(modelIds, currentVisionModel);

  return { models, visionModels, suggestedVisionModel };
}
