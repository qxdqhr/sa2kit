export type SkillSource = 'local_cursor' | 'manual_upload' | 'remote';
export type SkillStatus = 'draft' | 'published' | 'archived';

export type SkillSummary = {
  id: string;
  name: string;
  description: string;
  updatedAt: string;
  tags: string[];
  source: SkillSource;
  status: SkillStatus;
};

export type SkillDetail = SkillSummary & {
  content: string;
  files: string[];
};

export type SkillListResponse = {
  items: SkillSummary[];
  total: number;
  page: number;
  limit: number;
};

export type SkillSyncTaskItem = {
  id: string;
  skillId: string;
  status: 'success' | 'failed';
  reason?: string;
};

export type SkillSyncTask = {
  taskId: string;
  mode: 'local-to-web';
  strategy: 'ff-only' | 'manual';
  status: 'running' | 'success' | 'partial' | 'failed';
  total: number;
  successCount: number;
  failedCount: number;
  createdAt: string;
  finishedAt?: string;
  items: SkillSyncTaskItem[];
  metrics?: {
    durationMs: number;
    successRate: number;
    conflictRate: number;
  };
  logs?: Array<{
    at: string;
    level: 'info' | 'warn' | 'error';
    message: string;
  }>;
};
