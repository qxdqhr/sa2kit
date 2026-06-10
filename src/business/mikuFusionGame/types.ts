export type MikuFusionGameStatus = 'ready' | 'playing' | 'paused' | 'gameOver';
export type OrbImageMapping = Partial<Record<number, string>>;

export interface FusionOrb {
  id: string;
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  level: number;
  age: number;
}

export interface MikuFusionTheme {
  backgroundTop: string;
  backgroundBottom: string;
  aimLine: string;
  lossLine: string;
  orbColors: string[];
}

export interface MikuFusionGameConfig {
  width: number;
  height: number;
  gravity: number;
  damping: number;
  collisionDamping: number;
  spawnY: number;
  lossLineY: number;
  maxLevel: number;
  maxOrbs: number;
  maxMergesPerTick: number;
  gameOverAgeThreshold: number;
  spawnWeights: number[];
  theme: MikuFusionTheme;
}

export interface MikuFusionGameCallbacks {
  onScoreChange?: (score: number) => void;
  onGameOver?: (score: number, bestScore: number) => void;
}

export interface MergeResult {
  orbs: FusionOrb[];
  scoreGain: number;
  mergeCount: number;
}
