export const EXAM_QUESTION_TYPE = {
  SINGLE_CHOICE: 'single_choice',
  MULTIPLE_CHOICE: 'multiple_choice',
} as const;

export const DEFAULT_EXAM_TYPE_ID = 'default';

export const SYSTEM_EXAM_TYPE_IDS = ['default', 'arknights'] as const;

export const EXAM_TYPE_ID_PATTERN = /^[a-z0-9_-]+$/;

export const DEFAULT_PASSING_SCORE = 60;
