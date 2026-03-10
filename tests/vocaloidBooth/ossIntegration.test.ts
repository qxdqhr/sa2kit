import { describe, expect, it } from 'vitest';
import { BoothVaultService } from '../../src/vocaloidBooth/core';
import { InMemoryBoothVaultStore, uploadToOSSAndCreateBoothRecord } from '../../src/vocaloidBooth/server';

describe('vocaloidBooth oss integration', () => {
  it('uploads via fileService and creates booth record', async () => {
    const store = new InMemoryBoothVaultStore();
    const vaultService = new BoothVaultService({ store });

    const result = await uploadToOSSAndCreateBoothRecord(
      {
        boothId: 'cp-03',
        files: [
          {
            file: { name: 'demo.vsqx', size: 1234, type: 'application/xml' } as File,
            kind: 'project',
          },
        ],
      },
      {
        fileService: {
          uploadFile: async () => ({
            id: 'f1',
            originalName: 'demo.vsqx',
            storageName: 'demo.vsqx',
            size: 1234,
            mimeType: 'application/xml',
            extension: 'vsqx',
            uploadTime: new Date(),
            permission: 'private',
            uploaderId: 'u1',
            moduleId: 'vocaloid-booth',
            storageProvider: 'aliyun-oss',
            storagePath: 'booth/cp-03/demo.vsqx',
            accessCount: 0,
          }),
        } as any,
        vaultService,
      }
    );

    expect(result.record.matchCode).toHaveLength(6);
    expect(result.record.files[0]?.objectKey).toContain('booth/cp-03');
  });
});
