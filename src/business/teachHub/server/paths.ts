/** teachHub OSS 路径与 id 校验（纯函数，无宿主依赖） */

export const TEACH_HUB_MODULE_ID = 'teach-hub';

const SAFE_ID_PATTERN = /^[a-zA-Z0-9_-]+$/;

export function assertSafeId(id: string, label: string): void {
  if (!SAFE_ID_PATTERN.test(id)) {
    throw new Error(`非法 ${label}: ${id}`);
  }
}

export function buildBusinessId(userId: string, workspaceId: string): string {
  assertSafeId(userId, 'userId');
  assertSafeId(workspaceId, 'workspaceId');
  return `${userId}/${workspaceId}`;
}

export function buildCustomPath(
  userId: string,
  workspaceId: string,
  relativePath: string,
): string {
  const safeRelative = sanitizeRelativePath(relativePath);
  if (!safeRelative) {
    throw new Error(`非法 relativePath: ${relativePath}`);
  }
  return `${TEACH_HUB_MODULE_ID}/${userId}/${workspaceId}/${safeRelative}`;
}

export function sanitizeRelativePath(raw: string): string | null {
  const normalized = raw.replaceAll('\\', '/').trim();
  if (!normalized) return null;
  if (normalized.startsWith('/')) return null;
  if (normalized.includes('..')) return null;
  if (normalized.split('/').some((part) => part === '.')) return null;
  if (normalized.includes('//')) return null;
  return normalized;
}

export function parseBusinessId(
  businessId: string,
): { userId: string; workspaceId: string } | null {
  const parts = businessId.split('/');
  if (parts.length !== 2) return null;
  const [userId, workspaceId] = parts;
  if (!userId || !workspaceId) return null;
  if (!SAFE_ID_PATTERN.test(userId) || !SAFE_ID_PATTERN.test(workspaceId)) return null;
  return { userId, workspaceId };
}

export function slugifyTitle(title: string): string {
  const ascii = title
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 48);
  if (ascii) return ascii;
  const fallback = title
    .trim()
    .replace(/\s+/g, '-')
    .replace(/[^a-zA-Z0-9\u4e00-\u9fff_-]+/g, '')
    .slice(0, 48);
  return fallback || 'workspace';
}
