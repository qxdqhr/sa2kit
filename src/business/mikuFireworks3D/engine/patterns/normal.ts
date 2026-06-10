export interface SeedParticle {
  x: number;
  y: number;
  z: number;
  vx: number;
  vy: number;
  vz: number;
  life: number;
  color: string;
}

export function createNormalSeeds(count: number, color: string): SeedParticle[] {
  const seeds: SeedParticle[] = [];
  for (let i = 0; i < count; i += 1) {
    const theta = Math.random() * Math.PI * 2;
    const phi = Math.acos(2 * Math.random() - 1);
    const speed = 8 + Math.random() * 12;
    seeds.push({
      x: 0,
      y: 0,
      z: 0,
      vx: speed * Math.sin(phi) * Math.cos(theta),
      vy: speed * Math.cos(phi),
      vz: speed * Math.sin(phi) * Math.sin(theta),
      life: 1 + Math.random() * 1.6,
      color,
    });
  }
  return seeds;
}
