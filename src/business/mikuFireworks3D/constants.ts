import type { FireworkKind } from './types';

export const DEFAULT_MAX_PARTICLES = 5000;
export const DEFAULT_MAX_ACTIVE_FIREWORKS = 12;

export const FIREWORK_KIND_LABELS: Record<FireworkKind, string> = {
  normal: '普通烟花',
  miku: 'MIKU 主题',
  avatar: '头像烟花',
};

export const MIKU_PALETTE = ['#39c5bb', '#66e3db', '#7ad8ff', '#b0fff8', '#8cf7e0'];
export const NORMAL_PALETTE = ['#ffe066', '#ff6b6b', '#4dabf7', '#c77dff', '#69db7c'];

export const DANMAKU_MAX_LENGTH = 32;
export const DANMAKU_TRACK_COUNT = 8;
