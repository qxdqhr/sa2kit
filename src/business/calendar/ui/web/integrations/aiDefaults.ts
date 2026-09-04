import type { AiApiSettings } from 'sa2kit/common/aiApi/client';

/** profile-v1 日历默认 AI 配置（与 web aiApi 模块一致） */
export const DEFAULT_CALENDAR_AI_API_SETTINGS: AiApiSettings = {
  apiKey: '',
  baseUrl: 'https://api.xiaomimimo.com/v1',
  visionModel: 'mimo-v2.5',
  textModel: 'mimo-v2.5',
  audioModel: 'whisper-1',
  audioStrategy: 'auto',
};
