/** 音频处理策略：native=chat 内嵌音频，stt=先转写再 chat，auto=按模型能力自动选择（失败时 STT 回退） */
export type AudioStrategy = 'native' | 'stt' | 'auto';

/** 连接配置（调用方可显式传入，或与 env 合并） */
export interface AiConnectionSettings {
  apiKey: string;
  baseUrl: string;
  model?: string;
  textModel?: string;
  visionModel?: string;
  audioModel?: string;
  audioStrategy?: AudioStrategy;
  timeoutMs?: number;
  maxImageBytes?: number;
  maxAudioBytes?: number;
}

/** 客户端/请求可携带的 AI 连接配置（字段均可选，用于覆盖环境变量） */
export type AiClientSettings = Partial<AiConnectionSettings>;

/** 解析后的完整连接配置 */
export interface AiConnectionConfig extends AiConnectionSettings {
  textModel: string;
  visionModel: string;
  audioModel: string;
  audioStrategy: AudioStrategy;
  timeoutMs: number;
  maxImageBytes: number;
  maxAudioBytes: number;
}

/** 统一 AI 任务请求 */
export interface AiApiRunRequest<TInput = unknown> {
  taskId: string;
  input: TInput;
  options?: AiTaskRunOptions;
  clientSettings?: AiClientSettings;
}

export interface AiTaskRunOptions {
  model?: string;
  temperature?: number;
  maxTokens?: number;
}

/** 统一 AI 任务响应 */
export interface AiApiResponse<TData = unknown> {
  success: boolean;
  taskId: string;
  data?: TData;
  error?: AiApiErrorBody;
  meta?: AiApiResponseMeta;
}

export interface AiApiErrorBody {
  code: AiApiErrorCode;
  message: string;
  details?: unknown;
}

export type AiApiErrorCode =
  | 'UNAUTHORIZED'
  | 'INVALID_INPUT'
  | 'TASK_NOT_FOUND'
  | 'AI_CONFIG_MISSING'
  | 'AI_REQUEST_FAILED'
  | 'AI_PARSE_FAILED'
  | 'PAYLOAD_TOO_LARGE'
  | 'UNSUPPORTED_MEDIA';

export interface AiApiResponseMeta {
  model: string;
  latencyMs: number;
  provider?: string;
  confidence?: number;
  rawSummary?: string;
}

/** 多模态图片输入（base64） */
export interface AiImageInput {
  base64: string;
  mimeType: string;
}

/** 多模态音频输入（base64） */
export interface AiAudioInput {
  base64: string;
  mimeType: string;
}

export type AiMediaKind = 'image' | 'audio';

export interface AiImageMediaInput extends AiImageInput {
  kind: 'image';
}

export interface AiAudioMediaInput extends AiAudioInput {
  kind: 'audio';
}

export type AiMediaInput = AiImageMediaInput | AiAudioMediaInput;

/** 通用文本补全任务输入 */
export interface TextCompletionInput {
  systemPrompt?: string;
  userPrompt: string;
  model?: string;
  temperature?: number;
  maxTokens?: number;
  /** 显式连接配置，优先级高于 clientSettings / 环境变量 */
  connection?: AiClientSettings;
}

/** 通用文本补全任务输出 */
export interface TextCompletionOutput {
  content: string;
  rawText: string;
}

/** 通用结构化多模态任务输入 */
export interface StructuredMultimodalInput {
  systemPrompt: string;
  userPrompt: string;
  media?: AiMediaInput[];
  jsonSchemaHint?: string;
  model?: string;
  temperature?: number;
  maxTokens?: number;
  audioStrategy?: AudioStrategy;
  connection?: AiClientSettings;
}

/** 通用结构化多模态任务输出 */
export interface StructuredMultimodalOutput {
  json: Record<string, unknown>;
  rawText: string;
}

export const CORE_LLM_COMPLETION_TASK_ID = 'core.llmCompletion';
export const CORE_STRUCTURED_MULTIMODAL_TASK_ID = 'core.structuredMultimodal';
export const CORE_CONNECTIVITY_TEST_TASK_ID = 'core.connectivityTest';

export interface ConnectivityTestOutput {
  ok: boolean;
  reply: string;
}

/** GET /api/ai/config 响应（宿主实现，不暴露 apiKey） */
export interface AiServerConfigStatus {
  serverConfigured: boolean;
  baseUrl?: string;
  visionModel?: string;
  textModel?: string;
  error?: string;
}

export interface AiModelsListRequest {
  clientSettings?: AiClientSettings;
}

export interface AiModelsListResponse {
  success: boolean;
  models: string[];
  visionModels: string[];
  suggestedVisionModel?: string;
  error?: {
    code: string;
    message: string;
  };
}

export interface AiTaskContext {
  requestId?: string;
  userId?: string | number;
  clientSettings?: AiClientSettings;
}

export interface AiTaskDefinition<TInput = unknown, TOutput = unknown> {
  id: string;
  description?: string;
  validateInput: (input: unknown) => TInput;
  execute: (
    input: TInput,
    ctx: AiTaskContext
  ) => Promise<{
    data: TOutput;
    meta?: Partial<AiApiResponseMeta>;
  }>;
}

export interface MultimodalChatParams {
  systemPrompt: string;
  userPrompt: string;
  media?: AiMediaInput[];
  model?: string;
  temperature?: number;
  maxTokens?: number;
  jsonMode?: boolean;
  audioStrategy?: AudioStrategy;
  connection?: AiClientSettings;
}

export interface MultimodalChatResult {
  content: string;
  model: string;
  raw: unknown;
  /** auto/native/stt 实际采用的音频处理方式 */
  audioHandling?: 'none' | 'native' | 'stt';
  /** STT 或 native 失败回退时的转写文本 */
  transcriptions?: string[];
}
