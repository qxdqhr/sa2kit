import type { MikuFusionGameStatus } from '../types';

const ALLOWED_TRANSITIONS: Record<MikuFusionGameStatus, MikuFusionGameStatus[]> = {
  ready: ['playing'],
  playing: ['paused', 'gameOver', 'ready'],
  paused: ['playing', 'ready'],
  gameOver: ['ready', 'playing'],
};

export function canTransition(
  from: MikuFusionGameStatus,
  to: MikuFusionGameStatus
): boolean {
  return ALLOWED_TRANSITIONS[from].includes(to);
}

