export type * from './types';
export { TeachHubApiClient, type TeachHubApiConfig, type ApiEnvelope } from './api/client';
export {
  TEACH_HUB_API_PREFIX,
  WORKSPACE_TABS,
  lessonTitleFromSlug,
  lessonFilenameFromSlug,
  type TeachHubScreen,
  type WorkspaceTabId,
} from './routes';
export { parseMissionMarkdown, extractMissionWhySummary } from './parsers/missionParser';
export {
  parseLearningRecordMarkdown,
  parseLearningRecordPath,
  recordSummary,
  composeLearningRecordMarkdown,
  listReferenceSlugs,
} from './parsers/learningRecordParser';
export { fetchLearningRecords } from './services/learningRecords';
export {
  parseResourcesMarkdown,
  composeResourcesMarkdown,
  DEFAULT_RESOURCES_MD,
  RESOURCE_CATEGORY_LABELS,
  RESOURCE_CATEGORY_DESCRIPTIONS,
} from './parsers/resourcesParser';
export {
  lessonProgressMap,
  mergeLessonsWithProgress,
  lessonProgressLabel,
  completedLessonCount,
} from './utils/lessonProgress';
export {
  DEFAULT_MISSION_TEMPLATE,
  composeMissionMarkdown,
  isMissionReady,
  resolveGenerateLessonTrigger,
  generateLessonButtonLabel,
} from './templates/mission';
