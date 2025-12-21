export interface BackgroundRemovalOptions {
  progress?: (status: string, progress: number) => void;
  model?: 'medium' | 'small';
  publicPath?: string;
  fetchArgs?: RequestInit;
}

export interface BackgroundRemovalState {
  isProcessing: boolean;
  progress: number;
  status: string;
  error: Error | null;
  resultBlob: Blob | null;
  resultUrl: string | null;
}
