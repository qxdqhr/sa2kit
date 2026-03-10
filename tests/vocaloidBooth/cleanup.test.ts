import { describe, it, expect } from 'vitest';
import { InMemoryBoothVaultStore, expireBoothRecords } from '../../src/vocaloidBooth/server';
import type { BoothUploadRecord } from '../../src/vocaloidBooth/types';

const makeRecord = (id: string, expiresAt: string): BoothUploadRecord => ({
  id,
  matchCode: `CODE${id}`,
  boothId: 'booth-a',
  createdAt: new Date(0).toISOString(),
  expiresAt,
  status: 'active',
  downloadCount: 0,
  files: [],
});

describe('vocaloidBooth cleanup', () => {
  it('expires active records older than now', async () => {
    const store = new InMemoryBoothVaultStore();
    await store.saveRecord(makeRecord('1', new Date(0).toISOString()));
    await store.saveRecord(makeRecord('2', new Date(Date.now() + 60_000).toISOString()));

    const result = await expireBoothRecords(store, Date.now());
    expect(result.scanned).toBe(2);
    expect(result.expired).toBe(1);

    const oldRecord = await store.findByRecordId?.('1');
    expect(oldRecord?.status).toBe('expired');
  });
});
