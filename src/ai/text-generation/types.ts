export interface TextGenerationOptions {
  model?: string;
  max_new_tokens?: number;
  temperature?: number;
  top_p?: number;
}

export interface TextGenerationState {
  isProcessing: boolean;
  status: string;
  error: Error | null;
  result: string | null;
}







