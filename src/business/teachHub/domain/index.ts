/**
 * teachHub domain — 跨端类型 + client 纯函数/API 客户端（RN/Web/Desktop 共用）
 */
export * from './types';
export * from './lessonProgress';
export { TeachHubApiClient, type TeachHubApiConfig, type ApiEnvelope } from './client/api/client';
export {
  TEACH_HUB_API_PREFIX,
  WORKSPACE_TABS,
  lessonTitleFromSlug,
  lessonFilenameFromSlug,
  type TeachHubScreen,
  type WorkspaceTabId,
} from './client/routes';
export { parseMissionMarkdown, extractMissionWhySummary } from './client/parsers/missionParser';
export {
  parseLearningRecordMarkdown,
  parseLearningRecordPath,
  recordSummary,
  composeLearningRecordMarkdown,
  listReferenceSlugs,
} from './client/parsers/learningRecordParser';
export { fetchLearningRecords } from './client/services/learningRecords';
export {
  parseResourcesMarkdown,
  composeResourcesMarkdown,
  DEFAULT_RESOURCES_MD,
  RESOURCE_CATEGORY_LABELS,
  RESOURCE_CATEGORY_DESCRIPTIONS,
} from './client/parsers/resourcesParser';
export {
  DEFAULT_MISSION_TEMPLATE,
  composeMissionMarkdown,
  isMissionReady,
  resolveGenerateLessonTrigger,
  generateLessonButtonLabel,
} from './client/templates/mission';
