export type LessonReaderBarPosition = 'top' | 'bottom' | 'left' | 'right';

export type LessonReaderSettings = {
  barPosition: LessonReaderBarPosition;
  barExpanded: boolean;
};

const STORAGE_KEY = 'teach-hub:lesson-reader-settings';
export const LESSON_READER_SETTINGS_EVENT = 'teach-hub:lesson-reader-settings';

const POSITIONS: LessonReaderBarPosition[] = ['top', 'bottom', 'left', 'right'];

const DEFAULT_SETTINGS: LessonReaderSettings = {
  barPosition: 'top',
  barExpanded: true,
};

function normalizePosition(value: unknown): LessonReaderBarPosition {
  if (typeof value === 'string' && POSITIONS.includes(value as LessonReaderBarPosition)) {
    return value as LessonReaderBarPosition;
  }
  return DEFAULT_SETTINGS.barPosition;
}

export function getLessonReaderSettings(): LessonReaderSettings {
  if (typeof window === 'undefined') return DEFAULT_SETTINGS;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULT_SETTINGS;
    const parsed = JSON.parse(raw) as Partial<LessonReaderSettings>;
    return {
      barPosition: normalizePosition(parsed.barPosition),
      barExpanded: parsed.barExpanded !== false,
    };
  } catch {
    return DEFAULT_SETTINGS;
  }
}

export function saveLessonReaderSettings(
  patch: Partial<LessonReaderSettings>,
): LessonReaderSettings {
  const next = { ...getLessonReaderSettings(), ...patch };
  if (typeof window !== 'undefined') {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    window.dispatchEvent(new CustomEvent(LESSON_READER_SETTINGS_EVENT));
  }
  return next;
}

export const LESSON_READER_POSITION_OPTIONS: Array<{
  value: LessonReaderBarPosition;
  label: string;
}> = [
  { value: 'top', label: '顶部（横向）' },
  { value: 'bottom', label: '底部（横向）' },
  { value: 'left', label: '左侧（竖向）' },
  { value: 'right', label: '右侧（竖向）' },
];

export function isVerticalReaderPosition(position: LessonReaderBarPosition): boolean {
  return position === 'left' || position === 'right';
}
