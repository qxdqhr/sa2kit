import { sampleAvatarPoints } from '../../utils/avatarSprite';
import type { SeedParticle } from './normal';

export async function createAvatarSeeds(avatarUrl: string, fallbackColor: string): Promise<SeedParticle[]> {
  const points = await sampleAvatarPoints(avatarUrl);

  if (points.length === 0) {
    return [];
  }

  return points.map((point) => {
    const spread = 0.22;
    return {
      x: 0,
      y: 0,
      z: 0,
      vx: point.x * spread + (Math.random() - 0.5) * 2.4,
      vy: point.y * spread + Math.random() * 2.2,
      vz: (Math.random() - 0.5) * 3.5,
      life: 1.1 + point.brightness * 1.6,
      color: fallbackColor,
    };
  });
}
