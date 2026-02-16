export function getMergeScore(newLevel: number, chainIndex: number): number {
  const base = 10 * Math.max(1, newLevel) * Math.max(1, newLevel);
  const chainMultiplier = 1 + Math.max(0, chainIndex - 1) * 0.15;
  return Math.round(base * chainMultiplier);
}

