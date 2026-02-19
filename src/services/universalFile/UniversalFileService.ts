interface UniversalFileRuntimeConfig {
  resolveFileUrl?: (fileId: string) => Promise<string | null | undefined>;
}

export class UniversalFileService {
  constructor(private readonly config: UniversalFileRuntimeConfig = {}) {}

  async initialize(): Promise<void> {
    return;
  }

  async getFileUrl(fileId: string): Promise<string> {
    if (this.config.resolveFileUrl) {
      const url = await this.config.resolveFileUrl(fileId);
      if (url) return url;
    }

    const fallbackResolver = (globalThis as any).__sa2kitShowmasterpieceResolveFileUrl as
      | ((id: string) => Promise<string | null | undefined>)
      | undefined;
    if (fallbackResolver) {
      const fallbackUrl = await fallbackResolver(fileId);
      if (fallbackUrl) return fallbackUrl;
    }

    throw new Error(`No file URL resolver configured for fileId: ${fileId}`);
  }
}
