export interface EngineDegradePolicy {
  shouldDegrade: boolean;
  recommendedParticleScale: number;
}

export function evaluateDegradePolicy(fps: number): EngineDegradePolicy {
  if (fps < 24) {
    return { shouldDegrade: true, recommendedParticleScale: 0.65 };
  }
  if (fps < 34) {
    return { shouldDegrade: true, recommendedParticleScale: 0.82 };
  }
  return { shouldDegrade: false, recommendedParticleScale: 1 };
}
