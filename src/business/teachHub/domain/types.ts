/**
 * teachHub 类型定义（跨端 SSOT，client-safe）
 * 权威实现：`sa2kit/business/teachHub/domain`
 */

export type WorkspaceStatus = 'active' | 'archived';

export type LessonProgressStatus =
  | 'locked'
  | 'available'
  | 'in_progress'
  | 'completed';

export type GenerateTrigger = 'first_lesson' | 'next_lesson' | 'retry';

export type GenerateJobStatus = 'pending' | 'running' | 'success' | 'failed';

export type TeachWorkspace = {
  id: string;
  userId: string;
  slug: string;
  title: string;
  topic: string | null;
  status: WorkspaceStatus;
  missionSummary: string | null;
  lessonCount: number;
  lastLessonSlug: string | null;
  lastOpenedAt: string | null;
  createdAt: string;
  updatedAt: string;
};

export type TeachWorkspaceSummary = Pick<
  TeachWorkspace,
  | 'id'
  | 'slug'
  | 'title'
  | 'topic'
  | 'status'
  | 'missionSummary'
  | 'lessonCount'
  | 'lastLessonSlug'
  | 'lastOpenedAt'
  | 'updatedAt'
> & {
  completedLessonCount?: number;
};

export type TeachLessonProgress = {
  id: string;
  userId: string;
  workspaceId: string;
  lessonSlug: string;
  lessonOrder: number;
  status: LessonProgressStatus;
  quizScore: number | null;
  quizTotal: number | null;
  startedAt: string | null;
  completedAt: string | null;
  nextReviewAt: string | null;
};

export type TeachGenerateJob = {
  id: string;
  userId: string;
  workspaceId: string;
  trigger: GenerateTrigger;
  status: GenerateJobStatus;
  inputSnapshot: Record<string, unknown> | null;
  outputFiles: string[] | null;
  errorMessage: string | null;
  createdAt: string;
  finishedAt: string | null;
};

export type TeachStoredFile = {
  id: string;
  relativePath: string;
  mimeType: string;
  size: number;
  createdAt: string;
};

export type LessonIndex = {
  order: number;
  slug: string;
  filename: string;
  title?: string;
};

export type WorkspaceMeta = {
  version: number;
  title: string;
  topic: string | null;
  language: string;
  createdAt: string;
  forkedFrom: string | null;
  autoSyncLessonResources?: boolean;
};

export type MissionFormData = {
  why: string;
  successLooksLike: string[];
  constraints: string[];
  outOfScope: string[];
};

export type LearningRecordSection = {
  heading: string;
  content: string;
};

export type LearningRecord = {
  order: number;
  slug: string;
  relativePath: string;
  title: string;
  sections: LearningRecordSection[];
};

export type ResourceCategory = 'knowledge' | 'wisdom';

export type ResourceItem = {
  title: string;
  url?: string;
  note?: string;
  category: ResourceCategory;
};

export type ResourcesFormData = {
  items: ResourceItem[];
};

export type CreateWorkspaceInput = {
  title: string;
  topic?: string;
  missionDraft?: Partial<MissionFormData>;
};

export type UpdateProgressInput = {
  lessonSlug: string;
  status: LessonProgressStatus;
  quizScore?: number;
  quizTotal?: number;
};

export type GenerateLessonInput = {
  trigger: 'first_lesson' | 'next_lesson';
};

export type GenerateLessonOutput = {
  lesson: {
    order: number;
    slug: string;
    html: string;
  };
  learningRecord?: {
    order: number;
    slug: string;
    markdown: string;
  };
  reference?: {
    slug: string;
    html: string;
  };
};

export type GenerateLessonTrigger = 'first_lesson' | 'next_lesson';
