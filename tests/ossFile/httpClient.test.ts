import { afterEach, describe, expect, it, vi } from 'vitest';
import type { RequestAdapter } from '../../src/request/types/types';
import {
  configureOssFileFromPlatform,
  configureOssFileHttp,
  createOssFileFetchFromAdapter,
  ossFileFetch,
  resetOssFileHttpForTesting,
} from '../../src/ossFile/shared/httpClient';
import { uploadModuleFile } from '../../src/ossFile/client';

afterEach(() => {
  resetOssFileHttpForTesting();
});

describe('ossFile httpClient (R2-223)', () => {
  it('configureOssFileHttp injects global fetch', async () => {
    const mockFetch = vi.fn(async () =>
      new Response(JSON.stringify({ success: true, data: { ok: 1 } }), {
        status: 200,
      }),
    );
    configureOssFileHttp({ fetch: mockFetch });

    const response = await ossFileFetch('/api/test');
    expect(mockFetch).toHaveBeenCalledWith(
      '/api/test',
      expect.objectContaining({ credentials: 'include' }),
    );
    await expect(response.json()).resolves.toEqual({ success: true, data: { ok: 1 } });
  });

  it('createOssFileFetchFromAdapter bridges JSON GET', async () => {
    const adapter: RequestAdapter = {
      request: vi.fn(async () => ({ success: true, items: [] })),
    };
    const bridged = createOssFileFetchFromAdapter(adapter);
    const response = await bridged('/api/items?keys=a');
    expect(adapter.request).toHaveBeenCalled();
    await expect(response.json()).resolves.toEqual({ success: true, items: [] });
  });

  it('configureOssFileFromPlatform routes multipart to uploadFetch', async () => {
    const jsonAdapter: RequestAdapter = {
      request: vi.fn(async () => {
        throw new Error('JSON adapter should not handle multipart');
      }),
    };
    const uploadFetch = vi.fn(async () =>
      new Response(
        JSON.stringify({
          success: true,
          data: { fileId: 'f1', accessUrl: 'https://cdn/x.jpg' },
        }),
        { status: 200 },
      ),
    );

    configureOssFileFromPlatform(
      { storage: {} as never, fetch: jsonAdapter },
      { uploadFetch },
    );

    const file = new File(['x'], 'a.jpg', { type: 'image/jpeg' });
    const result = await uploadModuleFile({
      file,
      moduleId: 'test',
      uploadUrl: '/api/upload',
    });

    expect(uploadFetch).toHaveBeenCalled();
    expect(result.fileId).toBe('f1');
    expect(result.accessUrl).toBe('https://cdn/x.jpg');
  });
});
