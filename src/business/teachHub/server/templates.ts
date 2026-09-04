export {
  DEFAULT_MISSION_TEMPLATE,
  composeMissionMarkdown,
  DEFAULT_RESOURCES_MD,
} from '../domain';

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

export function formatTeachHubStorageError(error: unknown): string {
  const message = error instanceof Error ? error.message : String(error);
  if (message.includes('InvalidAccessKeyId') || message.includes('Access Key Id')) {
    return '文件存储 OSS 密钥无效或已禁用，已尝试本地存储；若仍失败请联系管理员更新 storage.aliyunOss 配置';
  }
  if (message.includes('OSS') || message.includes('上传失败')) {
    return `文件存储失败：${message}`;
  }
  return message || '文件存储失败';
}
