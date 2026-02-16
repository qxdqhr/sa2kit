import { MIKU_PALETTE } from '../../constants';
import { pickRandomColor } from '../../utils/colorPalettes';
import type { SeedParticle } from './normal';

export function createMikuSeeds(count: number): SeedParticle[] {
  const seeds: SeedParticle[] = [];

  for (let i = 0; i < count; i += 1) {
    const ratio = i / Math.max(count - 1, 1);
    const angle = ratio * Math.PI * 2 * 2;
    const radial = 7 + Math.random() * 9;

    const spiralBoost = 3 + Math.random() * 4;
    seeds.push({
      x: 0,
      y: 0,
      z: 0,
      vx: Math.cos(angle) * radial,
      vy: Math.sin(angle * 0.5) * spiralBoost + 7,
      vz: Math.sin(angle) * radial,
      life: 1.2 + Math.random() * 1.5,
      color: pickRandomColor(MIKU_PALETTE),
    });
  }

  return seeds;
}
