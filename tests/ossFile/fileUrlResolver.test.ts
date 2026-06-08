import { describe, expect, it } from 'vitest';
import { createFileUrlResolver } from '../../src/ossFile/server/service';

describe('createFileUrlResolver', () => {
  it('returns an async resolver function', () => {
    const resolver = createFileUrlResolver({
      loadConfigManager: async () =>
        ({
          getConfig: () => ({
            defaultStorage: 'local',
            storageProviders: {},
            cdnProviders: {},
            maxFileSize: 1,
            allowedMimeTypes: [],
            cache: { metadataTTL: 0, urlTTL: 0 },
          }),
        }) as never,
    });
    expect(typeof resolver).toBe('function');
  });
});
