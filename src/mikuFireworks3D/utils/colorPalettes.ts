import { MIKU_PALETTE, NORMAL_PALETTE } from '../constants';
import type { FireworkKind } from '../types';

export function pickPalette(kind: FireworkKind): string[] {
  if (kind === 'miku') {
    return MIKU_PALETTE;
  }
  return NORMAL_PALETTE;
}

export function pickRandomColor(colors: string[]): string {
  if (colors.length === 0) {
    return '#ffffff';
  }
  const index = Math.floor(Math.random() * colors.length);
  return colors[index] || '#ffffff';
}
