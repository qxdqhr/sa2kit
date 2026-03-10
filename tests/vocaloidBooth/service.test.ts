import { describe, it, expect } from 'vitest';
import { BoothVaultService } from '../../src/vocaloidBooth/core';
import { InMemoryBoothVaultStore } from '../../src/vocaloidBooth/server';

describe('BoothVaultService', () => {
  it('creates upload record and retrieves by match code', async () => {
    const store = new InMemoryBoothVaultStore();
    const service = new BoothVaultService({ store });

    const created = await service.createUpload({
      boothId: 'booth-a',
      files: [
        {
          fileName: 'demo.vsqx',
          size: 1234,
          objectKey: 'demo.vsqx',
          mimeType: 'application/octet-stream',
          kind: 'project',
        },
      ],
    });

    expect(created.record.matchCode).toHaveLength(6);
    expect(created.downloadUrlPath).toContain(created.record.matchCode);

    const queried = await service.getByMatchCode(created.record.matchCode.toLowerCase());
    expect(queried?.id).toBe(created.record.id);
    expect(queried?.status).toBe('active');

    await service.markDownloaded(created.record.id);
    const queried2 = await service.getByMatchCode(created.record.matchCode);
    expect(queried2?.downloadCount).toBe(1);

    const resolved = await service.resolveDownloadFilesByCode(created.record.matchCode);
    expect(resolved?.downloadCount).toBe(2);
  });
});
