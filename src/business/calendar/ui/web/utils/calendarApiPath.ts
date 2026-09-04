/**
 * 日历 API 路径（兼容网关同域 /api/calendar 与 Next basePath /calendar）。
 * 生产 trailingSlash=true 时统一带尾斜杠，避免 308 重定向丢 cookie/参数。
 */
export function calendarApiPath(segments = ''): string {
  const basePath = (process.env.NEXT_PUBLIC_BASE_PATH ?? '').replace(/\/$/, '');
  const raw = String(segments).replace(/^\/+/, '');
  const [pathname, search] = raw.split('?', 2);
  const trimmed = pathname.replace(/\/+$/, '');
  const apiPath = trimmed ? `/api/calendar/${trimmed}` : '/api/calendar';
  const withSlash = apiPath.endsWith('/') ? apiPath : `${apiPath}/`;
  const full = `${basePath}${withSlash}`;
  return search ? `${full}?${search}` : full;
}
