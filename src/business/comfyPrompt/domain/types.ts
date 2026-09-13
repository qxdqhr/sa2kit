export type PromptKind = 'positive' | 'negative';

export interface ComfyPromptGroup {
  id: number;
  userId: string;
  name: string;
  description: string | null;
  color: string | null;
  kind: PromptKind;
  order: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface ComfyPrompt {
  id: number;
  userId: string;
  groupId: number | null;
  title: string;
  content: string;
  kind: PromptKind;
  tags: string[];
  weight: string | null;
  order: number;
  notes: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface ComfyPromptSetItem {
  id: number;
  setId: number;
  promptId: number;
  order: number;
  enabled: boolean;
  customPrefix: string | null;
  customSuffix: string | null;
  prompt?: ComfyPrompt;
}

export interface ComfyPromptSet {
  id: number;
  userId: string;
  name: string;
  description: string | null;
  kind: PromptKind;
  separator: string;
  tags: string[];
  createdAt: Date;
  updatedAt: Date;
  items?: ComfyPromptSetItem[];
}

export interface ComfyWorkflow {
  id: number;
  userId: string;
  name: string;
  description: string | null;
  workflowJson: Record<string, unknown>;
  positiveNodeId: string | null;
  negativeNodeId: string | null;
  seedNodeId: string | null;
  latentNodeId: string | null;
  tags: string[];
  notes: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export type ComfyJobStatus =
  | 'pending'
  | 'queued'
  | 'running'
  | 'success'
  | 'failed'
  | 'cancelled';

export interface ComfyJobOutputImage {
  filename: string;
  subfolder: string;
  type: string;
}

export interface ComfyServer {
  id: number;
  userId: string;
  name: string;
  baseUrl: string;
  isDefault: boolean;
  enabled: boolean;
  lastCheckAt: Date | null;
  lastCheckOk: boolean | null;
  lastError: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface ComfyJob {
  id: number;
  userId: string;
  serverId: number;
  workflowId: number | null;
  clientId: string;
  promptId: string | null;
  status: ComfyJobStatus;
  positivePrompt: string | null;
  negativePrompt: string | null;
  requestJson: Record<string, unknown> | null;
  responseJson: Record<string, unknown> | null;
  outputImages: ComfyJobOutputImage[];
  errorMessage: string | null;
  createdAt: Date;
  updatedAt: Date;
  completedAt: Date | null;
}

export interface PromptGroupFormData {
  name: string;
  description?: string;
  color?: string;
  kind?: PromptKind;
}

export interface PromptFormData {
  title: string;
  content: string;
  kind?: PromptKind;
  groupId?: number | null;
  tags?: string[];
  weight?: number | null;
  notes?: string;
}

export interface PromptSetFormData {
  name: string;
  description?: string;
  kind?: PromptKind;
  separator?: string;
  tags?: string[];
  promptIds?: number[];
}

export interface WorkflowFormData {
  name: string;
  description?: string;
  workflowJson: Record<string, unknown>;
  positiveNodeId?: string | null;
  negativeNodeId?: string | null;
  seedNodeId?: string | null;
  latentNodeId?: string | null;
  tags?: string[];
  notes?: string;
}

export interface ServerFormData {
  name: string;
  baseUrl: string;
  isDefault?: boolean;
  enabled?: boolean;
}

export interface SubmitJobFormData {
  serverId: number;
  workflowId: number;
  positivePrompt?: string;
  negativePrompt?: string;
  seed?: number;
  width?: number;
  height?: number;
}

export type JobOutputKey = `${number}:${number}`;

export const COMFY_RUN_DRAFT_KEY = 'comfyPrompt:runDraft';

export interface ComfyRunDraft {
  positivePrompt?: string;
  negativePrompt?: string;
  workflowId?: number;
}

export interface BuildPromptOptions {
  separator?: string;
  wrapWeight?: boolean;
}
