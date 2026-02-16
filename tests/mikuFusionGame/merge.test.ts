import { describe, expect, it } from 'vitest';

import { DEFAULT_MIKU_FUSION_CONFIG } from '../../src/mikuFusionGame/constants';
import { mergeSameLevelOrbs } from '../../src/mikuFusionGame/engine/merge';
import type { FusionOrb } from '../../src/mikuFusionGame/types';

describe('mergeSameLevelOrbs', () => {
  it('merges two touching level-1 orbs into one level-2 orb', () => {
    const radius = 22;

    const orbs: FusionOrb[] = [
      {
        id: 'a',
        x: 100,
        y: 100,
        vx: 0,
        vy: 0,
        radius,
        level: 1,
        age: 1,
      },
      {
        id: 'b',
        x: 100 + radius * 2,
        y: 100,
        vx: 0,
        vy: 0,
        radius,
        level: 1,
        age: 1,
      },
    ];

    const result = mergeSameLevelOrbs(orbs, DEFAULT_MIKU_FUSION_CONFIG);

    expect(result.mergeCount).toBe(1);
    expect(result.orbs).toHaveLength(1);
    expect(result.orbs[0]?.level).toBe(2);
    expect(result.scoreGain).toBeGreaterThan(0);
  });
});
