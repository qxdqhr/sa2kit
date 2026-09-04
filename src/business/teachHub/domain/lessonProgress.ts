import type { LessonIndex, LessonProgressStatus, TeachLessonProgress } from './types';

export function lessonProgressMap(progress: TeachLessonProgress[]) {
  return new Map(progress.map((p) => [p.lessonSlug, p]));
}

export function mergeLessonsWithProgress(
  lessons: LessonIndex[],
  progress: TeachLessonProgress[],
) {
  const map = lessonProgressMap(progress);
  return lessons.map((lesson) => ({
    lesson,
    progress: map.get(lesson.slug),
  }));
}

const PROGRESS_LABELS: Record<LessonProgressStatus, string> = {
  locked: '未解锁',
  available: '可学习',
  in_progress: '学习中',
  completed: '已完成',
};

export function lessonProgressLabel(status?: LessonProgressStatus): string {
  if (!status) return '可学习';
  return PROGRESS_LABELS[status] ?? status;
}

export function completedLessonCount(progress: TeachLessonProgress[]): number {
  return progress.filter((p) => p.status === 'completed').length;
}
