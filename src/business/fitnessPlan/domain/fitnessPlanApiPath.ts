/** fitness-plan API 路径（兼容主站与子应用 basePath）。 */
export function fitnessPlanApiPath(segments = ''): string {
  const basePath = (process.env.NEXT_PUBLIC_BASE_PATH ?? '').replace(/\/$/, '');
  const raw = String(segments).replace(/^\/+/, '');
  const [pathname, search] = raw.split('?', 2);
  const trimmed = pathname.replace(/\/+$/, '');
  const apiPath = trimmed ? `/api/fitnessPlan/${trimmed}` : '/api/fitnessPlan';
  const full = `${basePath}${apiPath}`;
  return search ? `${full}?${search}` : full;
}

/** 页面路径（含 basePath）。 */
export function fitnessPlanPagePath(segments = ''): string {
  const basePath = (process.env.NEXT_PUBLIC_BASE_PATH ?? '').replace(/\/$/, '');
  const raw = String(segments).replace(/^\/+/, '');
  if (!raw) return basePath || '/fitness-plan';
  // When basePath is set (host), pages live at basePath/...
  // When unset (legacy), absolute /fitness-plan/...
  const root = basePath || '/fitness-plan';
  return `${root}/${raw}`.replace(/\/+$/, '') || root;
}
