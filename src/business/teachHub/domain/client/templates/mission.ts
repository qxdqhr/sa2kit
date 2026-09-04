import type {
  GenerateLessonTrigger,
  LessonIndex,
  MissionFormData,
  TeachLessonProgress,
} from '../../types';

export {
  DEFAULT_MISSION_TEMPLATE,
  composeMissionMarkdown,
} from './missionMarkdown';

export function isMissionReady(mission: MissionFormData): boolean {
  return Boolean(mission.why.trim());
}

export function resolveGenerateLessonTrigger(
  lessons: LessonIndex[],
  progress: TeachLessonProgress[],
  missionReady: boolean,
): GenerateLessonTrigger | null {
  if (!missionReady) return null;
  if (lessons.length === 0) return 'first_lesson';
  const last = lessons[lessons.length - 1];
  const lastProgress = progress.find((p) => p.lessonSlug === last.slug);
  if (lastProgress?.status === 'completed') return 'next_lesson';
  return null;
}

export function generateLessonButtonLabel(
  trigger: GenerateLessonTrigger | null,
  lessonCount: number,
): string {
  if (trigger === 'first_lesson') return '开始第一课（Mimo）';
  if (trigger === 'next_lesson') return '生成下一课（Mimo）';
  if (lessonCount === 0) return '请先填写 Mission';
  return '请先完成当前最后一课';
}
