const BLOCKED_HOSTS = new Set([
  'metadata.google.internal',
  'metadata.goog',
]);

export function normalizeComfyBaseUrl(raw: string): string {
  const trimmed = raw.trim();
  const url = new URL(trimmed);
  if (url.protocol !== 'http:' && url.protocol !== 'https:') {
    throw new Error('ComfyUI 地址仅支持 http 或 https');
  }
  if (BLOCKED_HOSTS.has(url.hostname.toLowerCase())) {
    throw new Error('不允许访问该主机');
  }
  url.pathname = url.pathname.replace(/\/+$/, '');
  url.search = '';
  url.hash = '';
  return url.toString().replace(/\/$/, '');
}

export function validateComfyBaseUrl(raw: string): string {
  const normalized = normalizeComfyBaseUrl(raw);
  const url = new URL(normalized);
  if (!url.hostname) {
    throw new Error('无效的 ComfyUI 地址');
  }
  return normalized;
}
