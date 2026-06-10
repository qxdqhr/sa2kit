export interface ParticleState {
  x: number;
  y: number;
  z: number;
  vx: number;
  vy: number;
  vz: number;
  life: number;
  maxLife: number;
  r: number;
  g: number;
  b: number;
}

export class ParticlePool {
  private readonly pool: ParticleState[] = [];

  acquire(): ParticleState {
    const reused = this.pool.pop();
    if (reused) {
      return reused;
    }
    return {
      x: 0,
      y: 0,
      z: 0,
      vx: 0,
      vy: 0,
      vz: 0,
      life: 0,
      maxLife: 1,
      r: 1,
      g: 1,
      b: 1,
    };
  }

  release(particle: ParticleState): void {
    this.pool.push(particle);
  }
}
