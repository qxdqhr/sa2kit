import { describe, it, expect } from 'vitest';
import { generateMatchCode, normalizeMatchCode } from '../../src/vocaloidBooth/core';

describe('vocaloidBooth code helpers', () => {
  it('normalizes match code', () => {
    expect(normalizeMatchCode(' a1b2c3 ')).toBe('A1B2C3');
  });

  it('generates non-ambiguous unique match code', async () => {
    const code = await generateMatchCode({
      length: 6,
      exists: async () => false,
    });

    expect(code).toHaveLength(6);
    expect(code).toMatch(/^[A-Z2-9]+$/);
    expect(code).not.toMatch(/[01IOL]/);
  });
});
