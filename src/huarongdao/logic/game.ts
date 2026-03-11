import type { HuarongdaoGameState } from '../types';

const clone = <T>(v: T[]): T[] => [...v];

export const buildSolvedTiles = (rows: number, cols: number): number[] => {
  const total = rows * cols;
  return Array.from({ length: total }, (_, i) => (i + 1) % total);
};

export const isSolved = (tiles: number[]): boolean => {
  return tiles.every((v, i, arr) => v === (i + 1) % arr.length);
};

export const canMove = (tiles: number[], rows: number, cols: number, tileIndex: number): boolean => {
  const blank = tiles.indexOf(0);
  if (blank < 0 || tileIndex < 0 || tileIndex >= tiles.length) return false;
  const br = Math.floor(blank / cols);
  const bc = blank % cols;
  const tr = Math.floor(tileIndex / cols);
  const tc = tileIndex % cols;
  return Math.abs(br - tr) + Math.abs(bc - tc) === 1;
};

export const moveTile = (state: HuarongdaoGameState, tileIndex: number): HuarongdaoGameState => {
  if (!canMove(state.tiles, state.rows, state.cols, tileIndex)) return state;
  const nextTiles = clone(state.tiles);
  const blank = nextTiles.indexOf(0);
  const blankValue = nextTiles[blank];
  const tileValue = nextTiles[tileIndex];
  if (blankValue === undefined || tileValue === undefined) return state;
  nextTiles[blank] = tileValue;
  nextTiles[tileIndex] = blankValue;
  const solved = isSolved(nextTiles);
  return {
    ...state,
    tiles: nextTiles,
    moveCount: state.moveCount + 1,
    isSolved: solved,
    finishedAt: solved ? Date.now() : undefined,
  };
};

export const inversionCount = (tiles: number[]): number => {
  const arr = tiles.filter((n) => n !== 0);
  let cnt = 0;
  for (let i = 0; i < arr.length; i += 1) {
    for (let j = i + 1; j < arr.length; j += 1) {
      if ((arr[i] ?? 0) > (arr[j] ?? 0)) cnt += 1;
    }
  }
  return cnt;
};

export const isSolvable = (tiles: number[], rows: number, cols: number): boolean => {
  const inv = inversionCount(tiles);
  if (cols % 2 === 1) return inv % 2 === 0;
  const blankRowFromBottom = rows - Math.floor(tiles.indexOf(0) / cols);
  return (blankRowFromBottom % 2 === 0) !== (inv % 2 === 0);
};

export const shuffleSolvable = (rows: number, cols: number, steps = 80): number[] => {
  let tiles = buildSolvedTiles(rows, cols);
  for (let i = 0; i < steps; i += 1) {
    const blank = tiles.indexOf(0);
    const br = Math.floor(blank / cols);
    const bc = blank % cols;
    const candidate: number[] = [];
    const dirs: Array<[number, number]> = [
      [1, 0],
      [-1, 0],
      [0, 1],
      [0, -1],
    ];
    dirs.forEach(([dr, dc]) => {
      const nr = br + dr;
      const nc = bc + dc;
      if (nr >= 0 && nr < rows && nc >= 0 && nc < cols) candidate.push(nr * cols + nc);
    });
    const idx = candidate[Math.floor(Math.random() * candidate.length)] ?? blank;
    const next = clone(tiles);
    [next[blank], next[idx]] = [next[idx] ?? 0, next[blank] ?? 0];
    tiles = next;
  }
  return tiles;
};
