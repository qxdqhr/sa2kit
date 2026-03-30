import type {
  MikuFlickChart,
  MikuFlickChartNote,
  MikuFlickConfig,
  MikuFlickDirection,
  MikuFlickInput,
  MikuFlickJudgeGrade,
  MikuFlickJudgeResult,
  MikuFlickRuntimeNote,
  MikuFlickScoreState,
} from '../types';

export const DEFAULT_MIKU_FLICK_KANA_KEYS: string[] = ['あ', 'か', 'さ', 'た', 'な', 'は', 'ま', 'や', 'ら', 'わ'];

const DIRECTIONS: MikuFlickDirection[] = ['up', 'right', 'down', 'left'];

export const DEFAULT_MIKU_FLICK_CONFIG: MikuFlickConfig = {
  bpm: 128,
  laneCount: 4,
  flickThresholdPx: 24,
  previewWindowMs: 2400,
  scrollWindowMs: 2000,
  noteGapBeats: 1,
  startLeadInMs: 1000,
  judgeWindows: {
    perfectMs: 45,
    greatMs: 95,
    goodMs: 150,
    missMs: 210,
  },
};

export const getDirectionArrow = (direction: MikuFlickDirection): string => {
  if (direction === 'up') {
    return '↑';
  }
  if (direction === 'right') {
    return '→';
  }
  if (direction === 'down') {
    return '↓';
  }
  return '←';
};

export const detectFlickDirection = (
  startX: number,
  startY: number,
  endX: number,
  endY: number,
  thresholdPx: number
): MikuFlickDirection | null => {
  const dx = endX - startX;
  const dy = endY - startY;
  const absX = Math.abs(dx);
  const absY = Math.abs(dy);

  if (absX < thresholdPx && absY < thresholdPx) {
    return null;
  }

  if (absX > absY) {
    return dx > 0 ? 'right' : 'left';
  }

  return dy > 0 ? 'down' : 'up';
};

export const buildPhraseChart = (
  phrase: string,
  config: Partial<MikuFlickConfig> = {}
): MikuFlickChart => {
  const merged = { ...DEFAULT_MIKU_FLICK_CONFIG, ...config };
  const beatIntervalMs = 60000 / (merged.bpm || DEFAULT_MIKU_FLICK_CONFIG.bpm);
  const chars = phrase.trim().replace(/\s+/g, '').split('').filter(Boolean);

  const notes: MikuFlickChartNote[] = chars.map((kana, index) => ({
    id: `note-${index + 1}`,
    kana,
    direction: DIRECTIONS[index % DIRECTIONS.length] || 'up',
    timeMs: merged.startLeadInMs + index * beatIntervalMs * merged.noteGapBeats,
  }));

  return {
    bpm: merged.bpm,
    offsetMs: 0,
    notes,
  };
};

export const normalizeChart = (chart: MikuFlickChart): MikuFlickChart => {
  const offsetMs = chart.offsetMs || 0;
  const normalizedNotes = [...chart.notes]
    .map((item, index) => ({
      ...item,
      id: item.id || `note-${index + 1}`,
      timeMs: Math.max(0, item.timeMs + offsetMs),
    }))
    .sort((a, b) => a.timeMs - b.timeMs);

  return {
    bpm: chart.bpm,
    offsetMs,
    notes: normalizedNotes,
  };
};

export const createRuntimeNotes = (chart: MikuFlickChart): MikuFlickRuntimeNote[] => {
  return chart.notes.map((note) => ({
    ...note,
    judged: false,
  }));
};

export const createInitialScore = (): MikuFlickScoreState => ({
  score: 0,
  combo: 0,
  maxCombo: 0,
  perfect: 0,
  great: 0,
  good: 0,
  miss: 0,
});

const gradeByOffset = (absOffsetMs: number, config: MikuFlickConfig): MikuFlickJudgeGrade => {
  const { perfectMs, greatMs, goodMs } = config.judgeWindows;
  if (absOffsetMs <= perfectMs) {
    return 'perfect';
  }
  if (absOffsetMs <= greatMs) {
    return 'great';
  }
  if (absOffsetMs <= goodMs) {
    return 'good';
  }
  return 'miss';
};

const canJudge = (offsetMs: number, config: MikuFlickConfig): boolean => {
  return Math.abs(offsetMs) <= config.judgeWindows.missMs;
};

const findBestNoteForInput = (
  notes: MikuFlickRuntimeNote[],
  input: MikuFlickInput,
  config: MikuFlickConfig
): MikuFlickRuntimeNote | null => {
  let best: MikuFlickRuntimeNote | null = null;
  let bestAbsOffset = Number.POSITIVE_INFINITY;

  notes.forEach((note) => {
    if (note.judged) {
      return;
    }
    if (note.kana !== input.kana || note.direction !== input.direction) {
      return;
    }

    const offset = input.inputTimeMs - note.timeMs;
    const absOffset = Math.abs(offset);
    if (!canJudge(offset, config)) {
      return;
    }

    if (absOffset < bestAbsOffset) {
      best = note;
      bestAbsOffset = absOffset;
    }
  });

  return best;
};

export const judgeInput = (
  notes: MikuFlickRuntimeNote[],
  input: MikuFlickInput,
  config: MikuFlickConfig
): MikuFlickJudgeResult => {
  const note = findBestNoteForInput(notes, input, config);
  if (!note) {
    return {
      ok: false,
      grade: 'miss',
      timingOffsetMs: Number.POSITIVE_INFINITY,
    };
  }

  const timingOffsetMs = input.inputTimeMs - note.timeMs;
  const grade = gradeByOffset(Math.abs(timingOffsetMs), config);

  note.judged = true;
  note.grade = grade;
  note.timingOffsetMs = timingOffsetMs;

  if (grade === 'miss') {
    return { ok: false, grade, timingOffsetMs, noteId: note.id };
  }

  return { ok: true, grade, timingOffsetMs, noteId: note.id };
};

export const sweepMissedNotes = (
  notes: MikuFlickRuntimeNote[],
  nowMs: number,
  config: MikuFlickConfig
): MikuFlickJudgeResult[] => {
  const results: MikuFlickJudgeResult[] = [];

  notes.forEach((note) => {
    if (note.judged) {
      return;
    }

    if (nowMs > note.timeMs + config.judgeWindows.missMs) {
      note.judged = true;
      note.grade = 'miss';
      note.timingOffsetMs = nowMs - note.timeMs;
      results.push({
        ok: false,
        grade: 'miss',
        timingOffsetMs: nowMs - note.timeMs,
        noteId: note.id,
      });
    }
  });

  return results;
};

export const applyJudgeToScore = (
  score: MikuFlickScoreState,
  result: MikuFlickJudgeResult
): MikuFlickScoreState => {
  if (result.grade === 'miss') {
    return {
      ...score,
      combo: 0,
      miss: score.miss + 1,
    };
  }

  const combo = score.combo + 1;
  const comboBonus = Math.min(150, combo * 5);

  const baseScore =
    result.grade === 'perfect' ? 300 :
    result.grade === 'great' ? 180 : 100;

  return {
    score: score.score + baseScore + comboBonus,
    combo,
    maxCombo: Math.max(score.maxCombo, combo),
    perfect: score.perfect + (result.grade === 'perfect' ? 1 : 0),
    great: score.great + (result.grade === 'great' ? 1 : 0),
    good: score.good + (result.grade === 'good' ? 1 : 0),
    miss: score.miss,
  };
};

export const calculateAccuracy = (score: MikuFlickScoreState): number => {
  const hit = score.perfect + score.great + score.good;
  const total = hit + score.miss;
  if (total === 0) {
    return 0;
  }

  const weighted = score.perfect * 1 + score.great * 0.7 + score.good * 0.4;
  return weighted / total;
};

export const getPendingNotes = (notes: MikuFlickRuntimeNote[]): MikuFlickRuntimeNote[] => {
  return notes.filter((note) => !note.judged);
};

export const getNextExpectedNote = (notes: MikuFlickRuntimeNote[]): MikuFlickRuntimeNote | null => {
  return getPendingNotes(notes)[0] || null;
};
