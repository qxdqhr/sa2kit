import { describe, expect, it } from 'vitest';
import { createOssFileBootstrap } from '../../src/ossFile/server/bootstrap';

describe('createOssFileBootstrap', () => {
  const mockConfigManager = {
    getConfig: () => ({
      defaultStorage: 'local',
      storageProviders: {
        local: {
          type: 'local',
          enabled: true,
          basePath: '/tmp/sa2kit-test',
        },
      },
      cdnProviders: {},
      maxFileSize: 1,
      allowedMimeTypes: [],
      cache: { metadataTTL: 0, urlTTL: 0 },
    }),
  };

  it('exposes config, file service, resolver and getFileUrl helpers', async () => {
    let loadCount = 0;
    const bootstrap = createOssFileBootstrap({
      loadConfigManager: async () => {
        loadCount += 1;
        return mockConfigManager as never;
      },
    });

    const cm1 = await bootstrap.getConfigManager();
    const cm2 = await bootstrap.getConfigManager();
    expect(cm1).toBe(cm2);
    expect(loadCount).toBe(1);

    expect(typeof bootstrap.createFileUrlResolver()).toBe('function');
    await expect(bootstrap.createFileService()).resolves.toBeTruthy();
    await expect(bootstrap.createPersistentFileService()).resolves.toBeTruthy();
    await expect(bootstrap.getFileUrl('missing-id')).resolves.toBeNull();
  });
});
