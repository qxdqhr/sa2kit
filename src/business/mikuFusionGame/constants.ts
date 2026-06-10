import type { MikuFusionGameConfig } from './types';

export const BASE_RADIUS = 22;
export const RADIUS_STEP = 4;

export const LEVEL_LABEL_PREFIX = 'M';

export const DEFAULT_MIKU_FUSION_CONFIG: MikuFusionGameConfig = {
  width: 390,
  height: 700,
  gravity: 1450,
  damping: 0.995,
  collisionDamping: 0.92,
  spawnY: 82,
  lossLineY: 132,
  maxLevel: 10,
  maxOrbs: 90,
  maxMergesPerTick: 6,
  gameOverAgeThreshold: 1.1,
  spawnWeights: [0.62, 0.28, 0.1],
  theme: {
    backgroundTop: '#dafaff',
    backgroundBottom: '#86e5ef',
    aimLine: '#14b8a6',
    lossLine: '#ef4444',
    orbColors: [
      '#67e8f9',
      '#22d3ee',
      '#2dd4bf',
      '#5eead4',
      '#34d399',
      '#a7f3d0',
      '#99f6e4',
      '#0ea5e9',
      '#06b6d4',
      '#14b8a6',
    ],
  },
};

