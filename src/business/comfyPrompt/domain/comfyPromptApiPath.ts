/** comfy-prompt API 路径（兼容 basePath）。 */
export function comfyPromptApiPath(segments = ''): string {
  const basePath = (process.env.NEXT_PUBLIC_BASE_PATH ?? '').replace(/\/$/, '');
  const raw = String(segments).replace(/^\/+/, '');
  const [pathname, search] = raw.split('?', 2);
  const trimmed = pathname.replace(/\/+$/, '');
  const apiPath = trimmed ? `/api/comfyPrompt/${trimmed}` : '/api/comfyPrompt';
  const full = `${basePath}${apiPath}`;
  return search ? `${full}?${search}` : full;
}
