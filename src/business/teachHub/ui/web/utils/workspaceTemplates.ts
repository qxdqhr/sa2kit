export {
  DEFAULT_MISSION_TEMPLATE,
  composeMissionMarkdown,
  DEFAULT_RESOURCES_MD,
} from 'sa2kit/business/teachHub/domain';

export const DEFAULT_NOTES_MD = `# 教学笔记

## 学习偏好

- 

`;

export function buildWorkspaceMeta(input: {
  title: string;
  topic?: string | null;
  forkedFrom?: string | null;
  autoSyncLessonResources?: boolean;
}) {
  return {
    version: 1,
    title: input.title,
    topic: input.topic ?? null,
    language: 'zh-CN',
    createdAt: new Date().toISOString(),
    forkedFrom: input.forkedFrom ?? null,
    autoSyncLessonResources: input.autoSyncLessonResources ?? false,
  };
}
