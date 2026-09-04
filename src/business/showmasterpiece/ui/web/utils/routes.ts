/** 子应用内页面路径（兼容 NEXT_PUBLIC_BASE_PATH） */
export function showmasterpiecePagePath(path = '/'): string {
  const basePath = (process.env.NEXT_PUBLIC_BASE_PATH ?? '').replace(/\/$/, '');
  if (!path || path === '/') return `${basePath}/` || '/';
  const normalized = path.startsWith('/') ? path : `/${path}`;
  return `${basePath}${normalized}`;
}
