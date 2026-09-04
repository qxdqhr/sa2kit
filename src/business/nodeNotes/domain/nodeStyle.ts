export const DEFAULT_NODE_BG = '#ffffff';
export const DEFAULT_NODE_TEXT = '#1e293b';
export const DEFAULT_EDGE_COLOR = '#0891b2';
export const DEFAULT_CANVAS_BG = '#f8fafc';

const HEX_COLOR = /^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/;

export function normalizeHexColor(value: string | null | undefined, fallback: string): string {
  if (!value) return fallback;
  const trimmed = value.trim();
  if (!HEX_COLOR.test(trimmed)) return fallback;
  if (trimmed.length === 4) {
    const [, r, g, b] = trimmed;
    return `#${r}${r}${g}${g}${b}${b}`.toLowerCase();
  }
  return trimmed.toLowerCase();
}

export const STYLE_PRESETS = [
  '#ffffff',
  '#fef3c7',
  '#dcfce7',
  '#dbeafe',
  '#ede9fe',
  '#fce7f3',
  '#1e293b',
  '#7c3aed',
  '#0891b2',
  '#dc2626',
  '#ea580c',
  '#16a34a',
] as const;
