import type { BoothFileItem, BoothUploadRecord, BoothVaultStore } from '../types';

export interface BoothVaultRecordRepository {
  create(record: BoothUploadRecord): Promise<void>;
  findByMatchCode(matchCode: string): Promise<BoothUploadRecord | null>;
  findByRecordId?(recordId: string): Promise<BoothUploadRecord | null>;
  updateDownloadCount(recordId: string, downloadCount: number): Promise<void>;
  existsByMatchCode(matchCode: string): Promise<boolean>;
}

export interface BoothObjectStorageProvider {
  save(file: File | Blob | Buffer, objectKey: string, contentType?: string): Promise<string>;
  getSignedDownloadUrl(objectKey: string, expiresInSeconds?: number): Promise<string>;
  delete(objectKey: string): Promise<void>;
}

export class RepositoryBoothVaultStore implements BoothVaultStore {
  constructor(private readonly repository: BoothVaultRecordRepository) {}

  saveRecord(record: BoothUploadRecord): Promise<void> {
    return this.repository.create(record);
  }

  findByMatchCode(matchCode: string): Promise<BoothUploadRecord | null> {
    return this.repository.findByMatchCode(matchCode);
  }

  async incrementDownloadCount(recordId: string): Promise<void> {
    const record = await this.findByRecordId(recordId);
    if (!record) return;
    return this.repository.updateDownloadCount(recordId, record.downloadCount + 1);
  }

  existsByMatchCode(matchCode: string): Promise<boolean> {
    return this.repository.existsByMatchCode(matchCode);
  }

  async findByRecordId(recordId: string): Promise<BoothUploadRecord | null> {
    if (this.repository.findByRecordId) {
      return this.repository.findByRecordId(recordId);
    }
    return null;
  }
}

export interface BoothSignedFile extends BoothFileItem {
  signedDownloadUrl: string;
}

export const signRecordFiles = async (
  record: BoothUploadRecord,
  storage: BoothObjectStorageProvider,
  expiresInSeconds = 60 * 30
): Promise<BoothSignedFile[]> => {
  const signed = await Promise.all(
    record.files.map(async (file) => ({
      ...file,
      signedDownloadUrl: await storage.getSignedDownloadUrl(file.objectKey, expiresInSeconds),
    }))
  );

  return signed;
};
