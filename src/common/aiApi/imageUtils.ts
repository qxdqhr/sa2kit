import type { AiImageInput } from './types';

const ALLOWED_MIME = new Set(['image/jpeg', 'image/png', 'image/webp', 'image/gif']);

export function assertValidImageInput(image: AiImageInput, maxImageBytes = 5 * 1024 * 1024): void {
  if (!image.base64?.trim()) {
    throw new Error('图片数据不能为空');
  }
  if (!ALLOWED_MIME.has(image.mimeType)) {
    throw new Error(`不支持的图片格式: ${image.mimeType}`);
  }

  const byteLength = estimateBase64ByteLength(image.base64);
  if (byteLength > maxImageBytes) {
    throw new Error(`图片过大，最大 ${Math.round(maxImageBytes / 1024 / 1024)}MB`);
  }
}

function estimateBase64ByteLength(base64: string): number {
  if (typeof Buffer !== 'undefined') {
    return Buffer.byteLength(base64, 'base64');
  }
  const padding = base64.endsWith('==') ? 2 : base64.endsWith('=') ? 1 : 0;
  return Math.floor((base64.length * 3) / 4) - padding;
}

export async function fileToAiImageInput(file: File): Promise<AiImageInput> {
  const buffer = await file.arrayBuffer();
  if (typeof Buffer !== 'undefined') {
    return {
      base64: Buffer.from(buffer).toString('base64'),
      mimeType: file.type || 'image/jpeg',
    };
  }
  const bytes = new Uint8Array(buffer);
  let binary = '';
  for (let index = 0; index < bytes.length; index += 1) {
    binary += String.fromCharCode(bytes[index]!);
  }
  const base64 = btoa(binary);
  return { base64, mimeType: file.type || 'image/jpeg' };
}
