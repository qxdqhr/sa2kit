/**
 * @vitest-environment node
 */
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { afterEach, describe, expect, it } from 'vitest';
import { createOssFileBootstrap } from '../../src/common/ossFile/server/bootstrap';
import { uploadFileAndResolveAccessUrl } from '../../src/common/ossFile/server/service';

describe('ossFile upload → getUrl integration (local storage)', () => {
  const tempDirs: string[] = [];

  afterEach(() => {
    for (const dir of tempDirs.splice(0)) {
      fs.rmSync(dir, { recursive: true, force: true });
    }
  });

  function createLocalBootstrap(basePath: string) {
    return createOssFileBootstrap({
      loadConfigManager: async () =>
        ({
          getConfig: () => ({
            defaultStorage: 'local',
            storageProviders: {
              local: {
                type: 'local',
                enabled: true,
                rootPath: basePath,
              },
            },
            cdnProviders: {},
            maxFileSize: 1024 * 1024,
            allowedMimeTypes: [],
            cache: { metadataTTL: 0, urlTTL: 0 },
          }),
        }) as never,
    });
  }

  it('uploads via service and resolves URL through bootstrap.getFileUrl', async () => {
    const basePath = fs.mkdtempSync(path.join(os.tmpdir(), 'sa2kit-upload-'));
    tempDirs.push(basePath);

    const bootstrap = createLocalBootstrap(basePath);
    const fileService = await bootstrap.createFileService();
    const file = new File(['integration-test'], 'hello.txt', { type: 'text/plain' });

    const { fileId, accessUrl } = await uploadFileAndResolveAccessUrl(
      fileService,
      {
        file,
        moduleId: 'integration-test',
        businessId: 'default',
        customPath: 'integration-test/hello.txt',
      },
    );

    expect(fileId).toBeTruthy();
    expect(accessUrl).toBeTruthy();

    const resolved = await fileService.getFileUrl(fileId);
    expect(resolved).toBeTruthy();
    expect(resolved).toBe(accessUrl);
  });
});
