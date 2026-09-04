/**
 * teachHub AI 任务（server/tasks）
 * 宿主通过 `registerTeachHubAiTasks()` 注册。
 */
export {
  TEACH_GENERATE_LESSON_TASK_ID,
  teachGenerateLessonTask,
  registerTeachHubAiTasks,
} from './generateLessonTask';
export {
  buildGenerateLessonUserPrompt,
  type TeachGenerateLessonTaskInput,
} from './teachAgentPrompt';
export {
  TEACH_SKILL_SYSTEM_PROMPT,
  GENERATE_LESSON_JSON_SCHEMA,
} from './teachSkillSystemPrompt';
export {
  parseGenerateLessonJson,
  validateGenerateLessonOutput,
  outputFilePaths,
  type RawGenerateLessonJson,
} from './validateGenerateOutput';
