import type { ViewportState } from './types';

export function parseViewport(raw: string | null | undefined): ViewportState | null {
  if (!raw) return null;
  try {
    const v = JSON.parse(raw) as ViewportState;
    if (typeof v.x === 'number' && typeof v.y === 'number' && typeof v.zoom === 'number') {
      return v;
    }
  } catch {
    return null;
  }
  return null;
}

export function serializeViewport(viewport: ViewportState | null | undefined): string | null {
  if (!viewport) return null;
  return JSON.stringify(viewport);
}
