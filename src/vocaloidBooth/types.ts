export type BoothFileKind = 'project' | 'output' | 'asset' | 'other';

export interface BoothFileItem {
  id: string;
  fileName: string;
  size: number;
  mimeType?: string;
  objectKey: string;
  checksum?: string;
  kind?: BoothFileKind;
}

export interface BoothUploadRecord {
  id: string;
  matchCode: string;
  boothId: string;
  createdAt: string;
  expiresAt: string;
  files: BoothFileItem[];
  metadata?: {
    nickname?: string;
    contactTail?: string;
    note?: string;
  };
  status: 'active' | 'expired' | 'deleted';
  downloadCount: number;
}

export interface CreateBoothUploadInput {
  boothId: string;
  ttlHours?: number;
  metadata?: BoothUploadRecord['metadata'];
  files: Omit<BoothFileItem, 'id'>[];
}

export interface CreateBoothUploadResult {
  record: BoothUploadRecord;
  downloadUrlPath: string;
}

export interface BoothVaultStore {
  saveRecord(record: BoothUploadRecord): Promise<void>;
  findByMatchCode(matchCode: string): Promise<BoothUploadRecord | null>;
  findByRecordId?(recordId: string): Promise<BoothUploadRecord | null>;
  incrementDownloadCount(recordId: string): Promise<void>;
  existsByMatchCode(matchCode: string): Promise<boolean>;
}
