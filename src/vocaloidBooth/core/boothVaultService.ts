import { randomUUID } from 'crypto';
import type {
  BoothUploadRecord,
  BoothVaultStore,
  CreateBoothUploadInput,
  CreateBoothUploadResult,
} from '../types';
import { generateMatchCode, normalizeMatchCode } from './code';

export interface BoothVaultServiceOptions {
  store: BoothVaultStore;
  codeLength?: number;
  defaultTtlHours?: number;
  baseDownloadPath?: string;
}

export class BoothVaultService {
  private readonly store: BoothVaultStore;
  private readonly codeLength: number;
  private readonly defaultTtlHours: number;
  private readonly baseDownloadPath: string;

  constructor(options: BoothVaultServiceOptions) {
    this.store = options.store;
    this.codeLength = options.codeLength ?? 6;
    this.defaultTtlHours = options.defaultTtlHours ?? 24 * 14;
    this.baseDownloadPath = options.baseDownloadPath ?? '/redeem';
  }

  async createUpload(input: CreateBoothUploadInput): Promise<CreateBoothUploadResult> {
    if (!input.files?.length) {
      throw new Error('At least one file is required');
    }

    const now = new Date();
    const ttlHours = Math.max(1, input.ttlHours ?? this.defaultTtlHours);
    const expiresAt = new Date(now.getTime() + ttlHours * 60 * 60 * 1000);

    const matchCode = await generateMatchCode({
      length: this.codeLength,
      exists: (code) => this.store.existsByMatchCode(code),
    });

    const record: BoothUploadRecord = {
      id: randomUUID(),
      boothId: input.boothId,
      matchCode,
      createdAt: now.toISOString(),
      expiresAt: expiresAt.toISOString(),
      files: input.files.map((file) => ({
        ...file,
        id: randomUUID(),
      })),
      metadata: input.metadata,
      status: 'active',
      downloadCount: 0,
    };

    await this.store.saveRecord(record);

    return {
      record,
      downloadUrlPath: `${this.baseDownloadPath}?code=${record.matchCode}`,
    };
  }

  async getByMatchCode(matchCode: string): Promise<BoothUploadRecord | null> {
    const normalized = normalizeMatchCode(matchCode);
    const record = await this.store.findByMatchCode(normalized);

    if (!record) {
      return null;
    }

    if (new Date(record.expiresAt).getTime() <= Date.now() && record.status === 'active') {
      return {
        ...record,
        status: 'expired',
      };
    }

    return record;
  }

  async markDownloaded(recordId: string): Promise<void> {
    await this.store.incrementDownloadCount(recordId);
  }

  async resolveDownloadFilesByCode(matchCode: string): Promise<BoothUploadRecord | null> {
    const record = await this.getByMatchCode(matchCode);
    if (!record || record.status !== 'active') {
      return record;
    }

    await this.markDownloaded(record.id);
    const reloaded = this.store.findByRecordId
      ? await this.store.findByRecordId(record.id)
      : await this.getByMatchCode(record.matchCode);

    return reloaded ?? record;
  }
}
