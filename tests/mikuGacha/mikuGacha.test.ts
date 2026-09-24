import { describe, expect, it } from 'vitest';
import { cardManifest } from '../../src/business/mikuGacha/data/cardManifest';
import { easeInOutCubic } from '../../src/business/mikuGacha/utils/ease';
import { pickCard } from '../../src/business/mikuGacha/utils/pickCard';

describe('mikuGacha', () => {
  it('has 145 cards', () => {
    expect(cardManifest).toHaveLength(145);
    expect(cardManifest[0]?.id).toBe(1);
    expect(cardManifest[144]?.id).toBe(145);
  });

  it('picks within pool', () => {
    for (let i = 0; i < 50; i++) {
      const card = pickCard();
      expect(card.id).toBeGreaterThanOrEqual(1);
      expect(card.id).toBeLessThanOrEqual(145);
    }
  });

  it('easeInOutCubic endpoints and midpoint', () => {
    expect(easeInOutCubic(0)).toBe(0);
    expect(easeInOutCubic(1)).toBe(1);
    expect(easeInOutCubic(0.5)).toBeCloseTo(0.5, 5);
    expect(easeInOutCubic(0.25)).toBeLessThan(0.25);
    expect(easeInOutCubic(0.75)).toBeGreaterThan(0.75);
  });
});
