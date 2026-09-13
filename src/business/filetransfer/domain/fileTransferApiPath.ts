/** filetransfer API 路径（兼容主站与子应用 basePath）。 */
export function fileTransferApiPath(segments = ''): string {
  const basePath = (process.env.NEXT_PUBLIC_BASE_PATH ?? '').replace(/\/$/, '');
  const raw = String(segments).replace(/^\/+/, '');
  const [pathname, search] = raw.split('?', 2);
  const trimmed = pathname.replace(/\/+$/, '');
  const apiPath = trimmed ? `/api/filetransfer/${trimmed}` : '/api/filetransfer';
  const full = `${basePath}${apiPath}`;
  return search ? `${full}?${search}` : full;
}
