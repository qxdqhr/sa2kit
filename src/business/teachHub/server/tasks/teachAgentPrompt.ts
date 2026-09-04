import { GENERATE_LESSON_JSON_SCHEMA, TEACH_SKILL_SYSTEM_PROMPT } from './teachSkillSystemPrompt';

export type TeachGenerateLessonTaskInput = {
  workspaceId: string;
  trigger: 'first_lesson' | 'next_lesson';
  nextOrder: number;
  workspaceTitle: string;
  missionMarkdown: string;
  notesMarkdown?: string;
  learningRecords: string[];
  existingLessonSlugs: string[];
  lastQuizResult?: { score: number; total: number; lessonSlug: string };
};

export function buildGenerateLessonUserPrompt(input: TeachGenerateLessonTaskInput): string {
  const orderStr = String(input.nextOrder).padStart(4, '0');
  const recordsBlock =
    input.learningRecords.length > 0
      ? input.learningRecords.slice(-5).join('\n\n---\n\n')
      : '（尚无学习记录）';

  const lessonsBlock =
    input.existingLessonSlugs.length > 0
      ? input.existingLessonSlugs.join(', ')
      : '（尚无课时）';

  const quizBlock = input.lastQuizResult
    ? `上一课 ${input.lastQuizResult.lessonSlug} 测验：${input.lastQuizResult.score}/${input.lastQuizResult.total}`
    : '（无上一课测验数据）';

  return `请为以下学习工作区生成第 ${input.nextOrder} 课（文件名 ${orderStr}-slug.html）。

## 触发类型
${input.trigger}

## 工作区
- ID: ${input.workspaceId}
- 标题: ${input.workspaceTitle}

## MISSION.md
${input.missionMarkdown}

## NOTES.md
${input.notesMarkdown || '（空）'}

## 已有课时 slug
${lessonsBlock}

## 学习记录
${recordsBlock}

## 上一课测验
${quizBlock}

## 输出要求
- lesson.order 必须为 ${input.nextOrder}
- lesson.slug 必须为 "${orderStr}-" 开头的 dash-case（如 ${orderStr}-duration-and-beat）
- lesson.html 为完整自包含 HTML
- learningRecord.order 建议与 lesson.order 相同
- 若本课需要新速查表，可附带 reference；否则 reference 为 null

JSON 结构：
${GENERATE_LESSON_JSON_SCHEMA}`;
}

export { TEACH_SKILL_SYSTEM_PROMPT } from './teachSkillSystemPrompt';
