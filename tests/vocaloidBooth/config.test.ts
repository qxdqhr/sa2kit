import { describe, expect, it } from 'vitest';
import {
  defaultVocaloidBoothConfig,
  normalizeVocaloidBoothConfig,
} from '../../src/vocaloidBooth/core';

describe('vocaloidBooth config', () => {
  it('normalizes invalid numeric values', () => {
    const cfg = normalizeVocaloidBoothConfig({
      defaultTtlHours: 0,
      maxFiles: 0,
      maxSingleFileSizeMb: 0,
      maxTotalFileSizeMb: 0,
      allowedExtensions: ['ZIP', 'VSQX'],
    });

    expect(cfg.defaultTtlHours).toBe(1);
    expect(cfg.maxFiles).toBe(1);
    expect(cfg.maxSingleFileSizeMb).toBe(1);
    expect(cfg.maxTotalFileSizeMb).toBe(1);
    expect(cfg.allowedExtensions).toEqual(['zip', 'vsqx']);
  });

  it('fallbacks to default config fields', () => {
    const cfg = normalizeVocaloidBoothConfig({ boothId: '' });
    expect(cfg.boothId).toBe(defaultVocaloidBoothConfig.boothId);
    expect(cfg.title).toBe(defaultVocaloidBoothConfig.title);
  });
});
