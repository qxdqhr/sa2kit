import type { FusionOrb, MikuFusionGameConfig } from '../types';

export function resolveCircleCollisions(
  orbs: FusionOrb[],
  config: MikuFusionGameConfig
): FusionOrb[] {
  const next = orbs.map((orb) => ({ ...orb }));

  for (let i = 0; i < next.length; i += 1) {
    for (let j = i + 1; j < next.length; j += 1) {
      const a = next[i];
      const b = next[j];

      const dx = b.x - a.x;
      const dy = b.y - a.y;
      const distance = Math.sqrt(dx * dx + dy * dy) || 0.0001;
      const minDistance = a.radius + b.radius;

      if (distance >= minDistance) {
        continue;
      }

      const nx = dx / distance;
      const ny = dy / distance;
      const overlap = minDistance - distance;

      a.x -= nx * overlap * 0.5;
      a.y -= ny * overlap * 0.5;
      b.x += nx * overlap * 0.5;
      b.y += ny * overlap * 0.5;

      const rvx = b.vx - a.vx;
      const rvy = b.vy - a.vy;
      const velocityAlongNormal = rvx * nx + rvy * ny;

      if (velocityAlongNormal > 0) {
        continue;
      }

      const restitution = config.collisionDamping;
      const impulse = (-(1 + restitution) * velocityAlongNormal) / 2;
      const impulseX = impulse * nx;
      const impulseY = impulse * ny;

      a.vx -= impulseX;
      a.vy -= impulseY;
      b.vx += impulseX;
      b.vy += impulseY;
    }
  }

  return next;
}

