/**
 * ShowMasterpiece API 路径（兼容网关同域 /api/showmasterpiece 与 Next basePath /showmasterpiece）。
 */
export function showmasterpieceApiPath(segments = ''): string {
  const basePath = (process.env.NEXT_PUBLIC_BASE_PATH ?? '').replace(/\/$/, '');
  const raw = String(segments).replace(/^\/+/, '');
  const [pathname, search] = raw.split('?', 2);
  const trimmed = pathname.replace(/\/+$/, '');
  const apiPath = trimmed ? `/api/showmasterpiece/${trimmed}` : '/api/showmasterpiece';
  const withSlash = apiPath.endsWith('/') ? apiPath : `${apiPath}/`;
  const full = `${basePath}${withSlash}`;
  return search ? `${full}?${search}` : full;
}
