export type PuzzleStatus = 'draft' | 'active' | 'archived';

export interface HuarongdaoConfig {
  id: string;
  slug: string;
  name: string;
  description?: string;
  status: PuzzleStatus;
  rows: number;
  cols: number;
  sourceImageUrl: string;
  showReference: boolean;
  shuffleSteps: number;
  timeLimitSec?: number;
  startMode: 'random-solvable' | 'custom-layout';
  initialTiles?: number[];
  createdAt: string;
  updatedAt: string;
}

export interface HuarongdaoStateSnapshot {
  configs: HuarongdaoConfig[];
  activeConfig?: HuarongdaoConfig;
}

export interface CreateHuarongdaoConfigInput {
  slug: string;
  name: string;
  description?: string;
  rows: number;
  cols: number;
  sourceImageUrl: string;
  showReference?: boolean;
  shuffleSteps?: number;
  timeLimitSec?: number;
  startMode?: 'random-solvable' | 'custom-layout';
  initialTiles?: number[];
}

export interface HuarongdaoGameState {
  tiles: number[];
  rows: number;
  cols: number;
  moveCount: number;
  startedAt: number;
  finishedAt?: number;
  isSolved: boolean;
}
