import { BASE_RADIUS, RADIUS_STEP } from '../constants';
import type { FusionOrb, MikuFusionGameConfig } from '../types';

export function getRadiusByLevel(level: number): number {
  return BASE_RADIUS + (Math.max(1, level) - 1) * RADIUS_STEP;
}

export function stepPhysics(
  orbs: FusionOrb[],
  config: MikuFusionGameConfig,
  dt: number
): FusionOrb[] {
  return orbs.map((orb) => {
    const next = { ...orb };

    next.vy += config.gravity * dt;
    next.vx *= config.damping;
    next.vy *= config.damping;

    next.x += next.vx * dt;
    next.y += next.vy * dt;
    next.age += dt;

    if (next.x - next.radius < 0) {
      next.x = next.radius;
      next.vx = Math.abs(next.vx) * config.collisionDamping;
    } else if (next.x + next.radius > config.width) {
      next.x = config.width - next.radius;
      next.vx = -Math.abs(next.vx) * config.collisionDamping;
    }

    if (next.y + next.radius > config.height) {
      next.y = config.height - next.radius;
      next.vy = -Math.abs(next.vy) * config.collisionDamping;
    }

    return next;
  });
}

