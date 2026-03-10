import { describe, expect, it } from 'vitest';
import { BoothVaultService, generateMatchCode } from '../../src/vocaloidBooth/core';
import { InMemoryBoothVaultStore } from '../../src/vocaloidBooth/server';

describe('vocaloidBooth', () => {
  it('generateMatchCode should avoid ambiguous chars and keep length', async () => {
    const code = await generateMatchCode({
      length: 8,
      exists: async () => false,
    });

    expect(code).toHaveLength(8);
    expect(code).toMatch(/^[A-Z2-9]+$/);
    expect(code).not.toMatch(/[01IOL]/);
  });

  it('createUpload + getByMatchCode should work', async () => {
    const store = new InMemoryBoothVaultStore();
    const service = new BoothVaultService({
      store,
      defaultTtlHours: 24,
    });

    const created = await service.createUpload({
      boothId: 'cp-01',
      files: [
        {
          fileName: 'song-project.zip',
          objectKey: 'booth/cp-01/song-project.zip',
          size: 1024,
          kind: 'project',
        },
      ],
      metadata: {
        nickname: 'miku-fan',
      },
    });

    expect(created.record.matchCode).toHaveLength(6);
    expect(created.downloadUrlPath).toContain(created.record.matchCode);

    const fetched = await service.getByMatchCode(created.record.matchCode);
    expect(fetched).not.toBeNull();
    expect(fetched?.boothId).toBe('cp-01');
    expect(fetched?.files).toHaveLength(1);

    await service.markDownloaded(created.record.id);
    const updated = await service.getByMatchCode(created.record.matchCode);
    expect(updated?.downloadCount).toBe(1);
  });

  it('getByMatchCode should support case-insensitive input', async () => {
    const store = new InMemoryBoothVaultStore();
    const service = new BoothVaultService({ store });

    const created = await service.createUpload({
      boothId: 'cp-02',
      files: [
        {
          fileName: 'render.mp4',
          objectKey: 'booth/cp-02/render.mp4',
          size: 2048,
          kind: 'output',
        },
      ],
    });

    const lowerCode = created.record.matchCode.toLowerCase();
    const fetched = await service.getByMatchCode(lowerCode);
    expect(fetched?.matchCode).toBe(created.record.matchCode);
  });
});
