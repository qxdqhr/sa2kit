import type {
  BubbleShooterConfig,
  BubbleShooterResolution,
  BubbleShooterSlot,
} from '../types';

const slotKey = (row: number, col: number): string => `${row}:${col}`;

const cloneGrid = (grid: (string | null)[][]): (string | null)[][] => grid.map((row) => [...row]);

export const DEFAULT_BUBBLE_SHOOTER_CONFIG: BubbleShooterConfig = {
  rows: 12,
  cols: 8,
  initialRows: 5,
  bubbleRadius: 16,
  topOffset: 18,
  palette: ['#fb7185', '#60a5fa', '#34d399', '#fbbf24', '#a78bfa'],
  launchSpeed: 440,
  minMatchCount: 3,
};

export const getBubbleDiameter = (config: BubbleShooterConfig): number => config.bubbleRadius * 2;

export const getRowStep = (config: BubbleShooterConfig): number => Math.round(config.bubbleRadius * 1.73);

export const getBoardWidth = (config: BubbleShooterConfig): number => {
  return getBubbleDiameter(config) * config.cols + config.bubbleRadius;
};

export const getBoardHeight = (config: BubbleShooterConfig): number => {
  return config.topOffset + getRowStep(config) * (config.rows + 1) + config.bubbleRadius;
};

export const createEmptyGrid = (config: BubbleShooterConfig): (string | null)[][] => {
  return Array.from({ length: config.rows }, () => Array.from({ length: config.cols }, () => null));
};

export const createInitialGrid = (config: BubbleShooterConfig): (string | null)[][] => {
  const grid = createEmptyGrid(config);
  for (let row = 0; row < config.initialRows; row += 1) {
    for (let col = 0; col < config.cols; col += 1) {
      const color = config.palette[Math.floor(Math.random() * config.palette.length)] || config.palette[0] || '#60a5fa';
      const targetRow = grid[row];
      if (targetRow) {
        targetRow[col] = color;
      }
    }
  }
  return grid;
};

export const pickRandomColor = (palette: string[]): string => {
  return palette[Math.floor(Math.random() * palette.length)] || '#60a5fa';
};

export const getBubblePosition = (
  row: number,
  col: number,
  config: BubbleShooterConfig
): { x: number; y: number } => {
  const diameter = getBubbleDiameter(config);
  const rowStep = getRowStep(config);
  const x = config.bubbleRadius + col * diameter + (row % 2 === 1 ? config.bubbleRadius : 0);
  const y = config.topOffset + config.bubbleRadius + row * rowStep;
  return { x, y };
};

export const isValidSlot = (slot: BubbleShooterSlot, config: BubbleShooterConfig): boolean => {
  return slot.row >= 0 && slot.row < config.rows && slot.col >= 0 && slot.col < config.cols;
};

export const getNeighbors = (slot: BubbleShooterSlot, config: BubbleShooterConfig): BubbleShooterSlot[] => {
  const evenDirections = [
    { row: -1, col: -1 },
    { row: -1, col: 0 },
    { row: 0, col: -1 },
    { row: 0, col: 1 },
    { row: 1, col: -1 },
    { row: 1, col: 0 },
  ];

  const oddDirections = [
    { row: -1, col: 0 },
    { row: -1, col: 1 },
    { row: 0, col: -1 },
    { row: 0, col: 1 },
    { row: 1, col: 0 },
    { row: 1, col: 1 },
  ];

  const directions = slot.row % 2 === 0 ? evenDirections : oddDirections;
  return directions
    .map((direction) => ({ row: slot.row + direction.row, col: slot.col + direction.col }))
    .filter((candidate) => isValidSlot(candidate, config));
};

export const getNearestSlot = (
  x: number,
  y: number,
  config: BubbleShooterConfig
): BubbleShooterSlot => {
  const rowStep = getRowStep(config);
  const diameter = getBubbleDiameter(config);
  const row = Math.max(0, Math.min(config.rows - 1, Math.round((y - config.topOffset - config.bubbleRadius) / rowStep)));
  const rowOffset = row % 2 === 1 ? config.bubbleRadius : 0;
  const col = Math.max(0, Math.min(config.cols - 1, Math.round((x - config.bubbleRadius - rowOffset) / diameter)));
  return { row, col };
};

const hasAdjacentBubble = (
  row: number,
  col: number,
  grid: (string | null)[][],
  config: BubbleShooterConfig
): boolean => {
  if (row === 0) {
    return true;
  }
  return getNeighbors({ row, col }, config).some((neighbor) => {
    const targetRow = grid[neighbor.row];
    return Boolean(targetRow?.[neighbor.col]);
  });
};

export const findAttachSlot = (
  x: number,
  y: number,
  grid: (string | null)[][],
  config: BubbleShooterConfig,
  preferred?: BubbleShooterSlot
): BubbleShooterSlot | null => {
  const candidates: BubbleShooterSlot[] = [];
  if (preferred && isValidSlot(preferred, config)) {
    candidates.push(preferred, ...getNeighbors(preferred, config));
  }
  const nearest = getNearestSlot(x, y, config);
  candidates.push(nearest, ...getNeighbors(nearest, config));

  const uniqueCandidates = Array.from(
    new Map(candidates.map((slot) => [slotKey(slot.row, slot.col), slot])).values()
  );

  let best: BubbleShooterSlot | null = null;
  let bestDistance = Number.POSITIVE_INFINITY;

  uniqueCandidates.forEach((slot) => {
    const targetRow = grid[slot.row];
    if (!targetRow || targetRow[slot.col] || !hasAdjacentBubble(slot.row, slot.col, grid, config)) {
      return;
    }
    const position = getBubblePosition(slot.row, slot.col, config);
    const dx = position.x - x;
    const dy = position.y - y;
    const distance = dx * dx + dy * dy;
    if (distance < bestDistance) {
      bestDistance = distance;
      best = slot;
    }
  });

  return best;
};

export const findCollisionSlot = (
  x: number,
  y: number,
  grid: (string | null)[][],
  config: BubbleShooterConfig
): BubbleShooterSlot | null => {
  const threshold = (config.bubbleRadius * 2 - 1) ** 2;

  for (let row = 0; row < config.rows; row += 1) {
    for (let col = 0; col < config.cols; col += 1) {
      const targetRow = grid[row];
      if (!targetRow?.[col]) {
        continue;
      }
      const position = getBubblePosition(row, col, config);
      const dx = position.x - x;
      const dy = position.y - y;
      if (dx * dx + dy * dy <= threshold) {
        return { row, col };
      }
    }
  }

  return null;
};

const collectGroup = (
  start: BubbleShooterSlot,
  grid: (string | null)[][],
  config: BubbleShooterConfig,
  color: string
): BubbleShooterSlot[] => {
  const queue: BubbleShooterSlot[] = [start];
  const visited = new Set<string>();
  const group: BubbleShooterSlot[] = [];

  while (queue.length > 0) {
    const current = queue.shift();
    if (!current) {
      continue;
    }

    const key = slotKey(current.row, current.col);
    if (visited.has(key)) {
      continue;
    }
    visited.add(key);

    const currentColor = grid[current.row]?.[current.col];
    if (currentColor !== color) {
      continue;
    }

    group.push(current);
    getNeighbors(current, config).forEach((neighbor) => {
      const neighborKey = slotKey(neighbor.row, neighbor.col);
      if (!visited.has(neighborKey)) {
        queue.push(neighbor);
      }
    });
  }

  return group;
};

const collectTopConnected = (
  grid: (string | null)[][],
  config: BubbleShooterConfig
): Set<string> => {
  const visited = new Set<string>();
  const queue: BubbleShooterSlot[] = [];

  for (let col = 0; col < config.cols; col += 1) {
    if (grid[0]?.[col]) {
      queue.push({ row: 0, col });
    }
  }

  while (queue.length > 0) {
    const current = queue.shift();
    if (!current) {
      continue;
    }

    const key = slotKey(current.row, current.col);
    if (visited.has(key)) {
      continue;
    }

    if (!grid[current.row]?.[current.col]) {
      continue;
    }

    visited.add(key);
    getNeighbors(current, config).forEach((neighbor) => {
      const neighborKey = slotKey(neighbor.row, neighbor.col);
      if (!visited.has(neighborKey)) {
        queue.push(neighbor);
      }
    });
  }

  return visited;
};

export const resolveMatches = (
  grid: (string | null)[][],
  placed: BubbleShooterSlot,
  config: BubbleShooterConfig
): BubbleShooterResolution => {
  const nextGrid = cloneGrid(grid);
  const placedColor = nextGrid[placed.row]?.[placed.col];
  if (!placedColor) {
    return { grid: nextGrid, removed: 0, matched: 0, dropped: 0 };
  }

  const group = collectGroup(placed, nextGrid, config, placedColor);
  let matched = 0;
  if (group.length >= config.minMatchCount) {
    group.forEach((slot) => {
      const targetRow = nextGrid[slot.row];
      if (targetRow?.[slot.col]) {
        targetRow[slot.col] = null;
        matched += 1;
      }
    });
  }

  let dropped = 0;
  if (matched > 0) {
    const topConnected = collectTopConnected(nextGrid, config);
    for (let row = 0; row < config.rows; row += 1) {
      for (let col = 0; col < config.cols; col += 1) {
        const targetRow = nextGrid[row];
        if (targetRow?.[col] && !topConnected.has(slotKey(row, col))) {
          targetRow[col] = null;
          dropped += 1;
        }
      }
    }
  }

  return {
    grid: nextGrid,
    matched,
    dropped,
    removed: matched + dropped,
  };
};

export const hasAnyBubble = (grid: (string | null)[][]): boolean => {
  return grid.some((row) => row.some(Boolean));
};

export const hasReachedDangerLine = (
  grid: (string | null)[][],
  config: BubbleShooterConfig,
  dangerRowOffset = 2
): boolean => {
  const limitRow = Math.max(0, config.rows - dangerRowOffset);
  for (let row = limitRow; row < config.rows; row += 1) {
    const targetRow = grid[row];
    if (targetRow?.some(Boolean)) {
      return true;
    }
  }
  return false;
};
