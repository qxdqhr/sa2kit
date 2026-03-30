export type MikuFlickDirection = 'up' | 'down' | 'left' | 'right';

export type MikuFlickStatus = 'ready' | 'playing' | 'paused' | 'ended';

export type MikuFlickJudgeGrade = 'perfect' | 'great' | 'good' | 'miss';

export interface MikuFlickChartNote {
  id: string;
  kana: string;
  direction: MikuFlickDirection;
  timeMs: number;
}

export interface MikuFlickChart {
  bpm: number;
  offsetMs?: number;
  notes: MikuFlickChartNote[];
}

export interface MikuFlickRuntimeNote extends MikuFlickChartNote {
  judged: boolean;
  grade?: MikuFlickJudgeGrade;
  timingOffsetMs?: number;
}

export interface MikuFlickInput {
  kana: string;
  direction: MikuFlickDirection;
  inputTimeMs: number;
}

export interface MikuFlickJudgeWindows {
  perfectMs: number;
  greatMs: number;
  goodMs: number;
  missMs: number;
}

export interface MikuFlickJudgeResult {
  ok: boolean;
  grade: MikuFlickJudgeGrade;
  timingOffsetMs: number;
  noteId?: string;
}

export interface MikuFlickScoreState {
  score: number;
  combo: number;
  maxCombo: number;
  perfect: number;
  great: number;
  good: number;
  miss: number;
}

export interface MikuFlickConfig {
  bpm: number;
  laneCount: number;
  flickThresholdPx: number;
  previewWindowMs: number;
  scrollWindowMs: number;
  judgeWindows: MikuFlickJudgeWindows;
  noteGapBeats: number;
  startLeadInMs: number;
}
