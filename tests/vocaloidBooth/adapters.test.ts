import { describe, it, expect } from 'vitest';
import type { BoothUploadRecord } from '../../src/vocaloidBooth/types';
import { RepositoryBoothVaultStore, signRecordFiles } from '../../src/vocaloidBooth/server';

const mockRecord: BoothUploadRecord = {
  id: 'r1',
  matchCode: 'ABC123',
  boothId: 'booth-a',
  createdAt: new Date().toISOString(),
  expiresAt: new Date(Date.now() + 1000 * 60 * 60).toISOString(),
  status: 'active',
  downloadCount: 0,
  files: [
    {
      id: 'f1',
      fileName: 'song.vsqx',
      size: 123,
      objectKey: 'files/song.vsqx',
    },
  ],
};

describe('vocaloidBooth server adapters', () => {
  it('signRecordFiles appends signed url', async () => {
    const files = await signRecordFiles(mockRecord, {
      save: async () => '',
      getSignedDownloadUrl: async (key) => `https://download.local/${key}`,
      delete: async () => {},
    });

    expect(files[0]?.signedDownloadUrl).toContain('files/song.vsqx');
  });

  it('RepositoryBoothVaultStore increments count with repository findByRecordId', async () => {
    let count = 0;
    const store = new RepositoryBoothVaultStore({
      create: async () => {},
      findByMatchCode: async () => mockRecord,
      findByRecordId: async () => ({ ...mockRecord, downloadCount: count }),
      updateDownloadCount: async (_id, next) => {
        count = next;
      },
      existsByMatchCode: async () => false,
    });

    await store.incrementDownloadCount(mockRecord.id);
    expect(count).toBe(1);
  });
});
