export type BubbleShooterStatus = 'ready' | 'shooting' | 'won' | 'lost';

export interface BubbleShooterConfig {
  rows: number;
  cols: number;
  initialRows: number;
  bubbleRadius: number;
  topOffset: number;
  palette: string[];
  launchSpeed: number;
  minMatchCount: number;
}

export interface BubbleShooterSlot {
  row: number;
  col: number;
}

export interface BubbleShooterProjectile {
  x: number;
  y: number;
  vx: number;
  vy: number;
  color: string;
}

export interface BubbleShooterResolution {
  grid: (string | null)[][];
  removed: number;
  matched: number;
  dropped: number;
}
