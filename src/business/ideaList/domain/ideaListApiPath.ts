/** ideaList API 路径（兼容主站 /api/ideaLists 与子应用 basePath）。 */
export function ideaListApiPath(segments = ''): string {
  const basePath = (process.env.NEXT_PUBLIC_BASE_PATH ?? '').replace(/\/$/, '');
  const raw = String(segments).replace(/^\/+/, '');
  const [pathname, search] = raw.split('?', 2);
  const trimmed = pathname.replace(/\/+$/, '');
  const apiPath = trimmed ? `/api/ideaLists/${trimmed}` : '/api/ideaLists';
  const full = `${basePath}${apiPath}`;
  return search ? `${full}?${search}` : full;
}
