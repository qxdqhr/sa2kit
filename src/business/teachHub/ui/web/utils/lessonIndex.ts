import type { LessonIndex } from '../types';

const LESSON_FILENAME_PATTERN = /^(\d{4})-(.+)\.html$/i;

export function parseLessonFilename(filename: string): LessonIndex | null {
  const base = filename.split('/').pop() || filename;
  const match = base.match(LESSON_FILENAME_PATTERN);
  if (!match) return null;
  const order = Number.parseInt(match[1], 10);
  const slug = `${match[1]}-${match[2]}`;
  if (!Number.isFinite(order)) return null;
  return {
    order,
    slug,
    filename: base,
  };
}

export function listLessonsFromPaths(paths: string[]): LessonIndex[] {
  const lessons: LessonIndex[] = [];
  for (const path of paths) {
    if (!path.startsWith('lessons/')) continue;
    const parsed = parseLessonFilename(path);
    if (parsed) {
      lessons.push({ ...parsed, filename: path.replace(/^lessons\//, '') });
    }
  }
  return lessons.sort((a, b) => a.order - b.order);
}

export function getNextLessonOrder(lessons: LessonIndex[]): number {
  if (!lessons.length) return 1;
  return Math.max(...lessons.map((l) => l.order)) + 1;
}
