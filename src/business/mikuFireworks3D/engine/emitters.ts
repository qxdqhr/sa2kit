import type { FireworkKind } from '../types';
import { pickPalette, pickRandomColor } from '../utils/colorPalettes';
import { createAvatarSeeds } from './patterns/avatar';
import { createMikuSeeds } from './patterns/miku';
import { createNormalSeeds, type SeedParticle } from './patterns/normal';

interface EmitOptions {
  kind: FireworkKind;
  count: number;
  color?: string;
  avatarUrl?: string;
}

export async function createSeedParticles(options: EmitOptions): Promise<SeedParticle[]> {
  const palette = pickPalette(options.kind);
  const color = options.color ?? pickRandomColor(palette);

  if (options.kind === 'miku') {
    return createMikuSeeds(options.count);
  }

  if (options.kind === 'avatar' && options.avatarUrl) {
    const avatarSeeds = await createAvatarSeeds(options.avatarUrl, color);
    if (avatarSeeds.length > 0) {
      return avatarSeeds;
    }
  }

  return createNormalSeeds(options.count, color);
}
