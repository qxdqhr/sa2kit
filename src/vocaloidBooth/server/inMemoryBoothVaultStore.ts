import type { BoothUploadRecord, BoothVaultStore } from '../types';

export class InMemoryBoothVaultStore implements BoothVaultStore {
  private readonly recordsById = new Map<string, BoothUploadRecord>();
  private readonly idByCode = new Map<string, string>();

  async saveRecord(record: BoothUploadRecord): Promise<void> {
    this.recordsById.set(record.id, record);
    this.idByCode.set(record.matchCode, record.id);
  }

  async findByMatchCode(matchCode: string): Promise<BoothUploadRecord | null> {
    const id = this.idByCode.get(matchCode);
    if (!id) {
      return null;
    }
    return this.recordsById.get(id) ?? null;
  }

  async incrementDownloadCount(recordId: string): Promise<void> {
    const record = this.recordsById.get(recordId);
    if (!record) {
      return;
    }

    this.recordsById.set(recordId, {
      ...record,
      downloadCount: record.downloadCount + 1,
    });
  }

  async existsByMatchCode(matchCode: string): Promise<boolean> {
    return this.idByCode.has(matchCode);
  }
}
