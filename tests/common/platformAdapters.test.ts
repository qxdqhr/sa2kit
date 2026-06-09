import { describe, expect, it } from 'vitest';
import {
  createNodeHonoPlatformAdapter,
  createWebPlatformAdapter,
} from '../../src/common/platform';

describe('common/platform adapters (R2-221 / R2-222)', () => {
  it('createWebPlatformAdapter exposes storage and fetch', () => {
    const adapter = createWebPlatformAdapter({ filePick: false });
    expect(adapter.storage).toBeTruthy();
    expect(adapter.fetch).toBeTruthy();
    expect(adapter.filePick).toBeUndefined();
  });

  it('createNodeHonoPlatformAdapter supports memory storage round-trip', async () => {
    const adapter = createNodeHonoPlatformAdapter();
    await adapter.storage.setItem('k', 'v');
    await expect(adapter.storage.getItem('k')).resolves.toBe('v');
  });
});
