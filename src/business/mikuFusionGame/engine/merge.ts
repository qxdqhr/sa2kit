import type { FusionOrb, MergeResult, MikuFusionGameConfig } from '../types';
import { getMergeScore } from './scoring';
import { getRadiusByLevel } from './physics';

function canMerge(a: FusionOrb, b: FusionOrb, config: MikuFusionGameConfig): boolean {
  if (a.level !== b.level) {
    return false;
  }

  if (a.level >= config.maxLevel) {
    return false;
  }

  const dx = b.x - a.x;
  const dy = b.y - a.y;
  const distance = Math.sqrt(dx * dx + dy * dy);
  // Collision resolution keeps circles around exact touching distance.
  // Use a small epsilon so touching same-level orbs can merge reliably.
  const threshold = a.radius + b.radius + 0.75;

  return distance <= threshold;
}

export function mergeSameLevelOrbs(
  orbs: FusionOrb[],
  config: MikuFusionGameConfig
): MergeResult {
  const mergedIds = new Set<string>();
  const spawned: FusionOrb[] = [];
  let scoreGain = 0;
  let chainIndex = 0;

  for (let i = 0; i < orbs.length; i += 1) {
    if (mergedIds.has(orbs[i].id)) {
      continue;
    }

    for (let j = i + 1; j < orbs.length; j += 1) {
      if (mergedIds.has(orbs[j].id)) {
        continue;
      }

      const a = orbs[i];
      const b = orbs[j];

      if (!canMerge(a, b, config)) {
        continue;
      }

      mergedIds.add(a.id);
      mergedIds.add(b.id);
      chainIndex += 1;

      const nextLevel = Math.min(config.maxLevel, a.level + 1);
      const mergedOrb: FusionOrb = {
        id: `orb-${a.id}-${b.id}-${chainIndex}`,
        x: (a.x + b.x) / 2,
        y: (a.y + b.y) / 2,
        vx: (a.vx + b.vx) / 2 * 0.4,
        vy: (a.vy + b.vy) / 2 * 0.4,
        radius: getRadiusByLevel(nextLevel),
        level: nextLevel,
        age: Math.min(a.age, b.age),
      };

      spawned.push(mergedOrb);
      scoreGain += getMergeScore(nextLevel, chainIndex);

      if (chainIndex >= config.maxMergesPerTick) {
        break;
      }
    }

    if (chainIndex >= config.maxMergesPerTick) {
      break;
    }
  }

  if (mergedIds.size === 0) {
    return {
      orbs,
      scoreGain: 0,
      mergeCount: 0,
    };
  }

  const survivors = orbs.filter((orb) => !mergedIds.has(orb.id));
  const mergedOrbs = survivors.concat(spawned);

  return {
    orbs: mergedOrbs,
    scoreGain,
    mergeCount: chainIndex,
  };
}
