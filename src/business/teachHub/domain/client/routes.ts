/** REST API 路径片段（不含 apiBaseUrl） */
export const TEACH_HUB_API_PREFIX = '/api/teach-hub';

export type TeachHubScreen =
  | 'Home'
  | 'NewWorkspace'
  | 'WorkspaceOverview'
  | 'Mission'
  | 'Records'
  | 'Resources'
  | 'Settings'
  | 'Lesson'
  | 'Reference';

export type WorkspaceTabId = 'overview' | 'mission' | 'records' | 'resources' | 'settings';

export const WORKSPACE_TABS: Array<{ id: WorkspaceTabId; label: string }> = [
  { id: 'overview', label: '概览' },
  { id: 'mission', label: 'Mission' },
  { id: 'records', label: '学习记录' },
  { id: 'resources', label: '资源' },
  { id: 'settings', label: '设置' },
];

export function lessonTitleFromSlug(slug: string): string {
  const parts = slug.split('-');
  if (parts.length > 1 && /^\d{4}$/.test(parts[0])) {
    return parts.slice(1).join(' ').replace(/\b\w/g, (c) => c.toUpperCase());
  }
  return slug;
}

export function lessonFilenameFromSlug(slug: string): string {
  return slug.endsWith('.html') ? slug : `${slug}.html`;
}
