const DEFAULT_TEACH_HUB_BASE = '/testField/teachHub';

function readBasePath(): string {
  if (typeof process === 'undefined') return '';
  return (process.env.NEXT_PUBLIC_BASE_PATH ?? '').trim().replace(/\/+$/, '');
}

function resolveTeachHubBase(): string {
  // Next basePath 已承担 /teach-hub 网关前缀时，Link/router 勿再拼一层
  if (readBasePath()) return '';

  if (typeof process === 'undefined') return DEFAULT_TEACH_HUB_BASE;
  const raw = process.env.NEXT_PUBLIC_TEACH_HUB_BASE_URL;
  if (raw === undefined) return DEFAULT_TEACH_HUB_BASE;
  const trimmed = raw.trim();
  if (trimmed === '' || trimmed === '/') return '';
  return trimmed.replace(/\/+$/, '');
}

/** 浏览器地址栏可见前缀（HTML 内链、外链用；含网关 basePath） */
export function teachHubPublicBase(): string {
  const basePath = readBasePath();
  if (basePath) return basePath;

  if (typeof process === 'undefined') return DEFAULT_TEACH_HUB_BASE;
  const raw = process.env.NEXT_PUBLIC_TEACH_HUB_BASE_URL;
  if (raw === undefined) return DEFAULT_TEACH_HUB_BASE;
  const trimmed = raw.trim();
  if (trimmed === '' || trimmed === '/') return '';
  return trimmed.replace(/\/+$/, '');
}

/** 站内 teachHub 路由前缀（Next Link / router；子应用 basePath 模式下为空） */
export const TEACH_HUB_BASE = resolveTeachHubBase();

/** 首页 Link 目标（空 base 时用 `/`） */
export const TEACH_HUB_HOME = TEACH_HUB_BASE || '/';

export function isTeachHubHomePath(pathname: string | null): boolean {
  const p = pathname ?? '';
  if (TEACH_HUB_BASE) {
    return p === TEACH_HUB_BASE || p === `${TEACH_HUB_BASE}/`;
  }
  return p === '/' || p === '';
}

export function workspacePath(workspaceId: string): string {
  return TEACH_HUB_BASE
    ? `${TEACH_HUB_BASE}/w/${workspaceId}`
    : `/w/${workspaceId}`;
}

export function lessonPath(workspaceId: string, slug: string): string {
  return `${workspacePath(workspaceId)}/lesson/${slug}`;
}

export function referencePath(workspaceId: string, slug: string): string {
  return `${workspacePath(workspaceId)}/reference/${slug}`;
}

export type WorkspaceTabId = 'overview' | 'mission' | 'records' | 'resources' | 'settings';

export const WORKSPACE_TABS: Array<{
  id: WorkspaceTabId;
  label: string;
  path: (workspaceId: string) => string;
}> = [
  { id: 'overview', label: '概览', path: workspacePath },
  { id: 'mission', label: 'Mission', path: (id) => `${workspacePath(id)}/mission` },
  { id: 'records', label: '学习记录', path: (id) => `${workspacePath(id)}/records` },
  { id: 'resources', label: '资源', path: (id) => `${workspacePath(id)}/resources` },
  { id: 'settings', label: '设置', path: (id) => `${workspacePath(id)}/settings` },
];

export function resolveWorkspaceTab(pathname: string, workspaceId: string): WorkspaceTabId {
  const base = workspacePath(workspaceId);
  if (pathname === base || pathname === `${base}/`) return 'overview';
  if (pathname.startsWith(`${base}/mission`)) return 'mission';
  if (pathname.startsWith(`${base}/records`)) return 'records';
  if (pathname.startsWith(`${base}/resources`)) return 'resources';
  if (pathname.startsWith(`${base}/settings`)) return 'settings';
  return 'overview';
}

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
