import type { BoothUploadRecord, BoothVaultStore } from '../types';

export interface BoothExpiryStore extends BoothVaultStore {
  listActiveRecords?(): Promise<BoothUploadRecord[]>;
  updateStatus?(recordId: string, status: BoothUploadRecord['status']): Promise<void>;
}

export interface ExpireResult {
  scanned: number;
  expired: number;
}

export const expireBoothRecords = async (
  store: BoothExpiryStore,
  now = Date.now(),
  onExpired?: (record: BoothUploadRecord) => void
): Promise<ExpireResult> => {
  const records = store.listActiveRecords ? await store.listActiveRecords() : [];

  let expired = 0;
  for (const record of records) {
    if (record.status !== 'active') continue;
    if (new Date(record.expiresAt).getTime() <= now) {
      expired += 1;
      if (store.updateStatus) {
        // eslint-disable-next-line no-await-in-loop
        await store.updateStatus(record.id, 'expired');
      }
      onExpired?.(record);
    }
  }

  return {
    scanned: records.length,
    expired,
  };
};
