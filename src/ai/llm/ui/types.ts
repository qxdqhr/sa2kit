import type {
  AiChatInputOptions,
  AiChatResponse,
  AiClient,
  AiMessage,
} from '../types';
import type { PromptVariables } from '../prompt/variables';

export interface AiChatDialogBaseProps {
  client: AiClient;
  title?: string;
  placeholder?: string;
  systemPrompt?: string;
  template?: string;
  templateVariables?: PromptVariables;
  initialMessages?: AiMessage[];
  requestOptions?: Omit<AiChatInputOptions, 'template' | 'variables'>;
  onResponse?: (response: AiChatResponse) => void;
  onError?: (error: Error) => void;
}

export interface AiChatDialogProps extends AiChatDialogBaseProps {
  open: boolean;
  onOpenChange?: (open: boolean) => void;
}

export interface AiUiConfig {
  apiKey: string;
  baseUrl: string;
  model: string;
  systemPrompt: string;
  template: string;
  temperature: number;
  topP: number;
  maxTokens: number;
}

export interface AiConfigPageProps {
  storageKey?: string;
  initialConfig?: Partial<AiUiConfig>;
  title?: string;
  description?: string;
  onSave?: (config: AiUiConfig) => void;
  onChange?: (config: AiUiConfig) => void;
}
