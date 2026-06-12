import type { AiAudioInput } from './types';

const ALLOWED_MIME = new Set([
  'audio/wav',
  'audio/x-wav',
  'audio/mpeg',
  'audio/mp3',
  'audio/mp4',
  'audio/webm',
  'audio/ogg',
  'audio/flac',
]);

const MIME_TO_FORMAT: Record<string, string> = {
  'audio/wav': 'wav',
  'audio/x-wav': 'wav',
  'audio/mpeg': 'mp3',
  'audio/mp3': 'mp3',
  'audio/mp4': 'mp4',
  'audio/webm': 'webm',
  'audio/ogg': 'ogg',
  'audio/flac': 'flac',
};

export function mimeToAudioFormat(mimeType: string): string {
  return MIME_TO_FORMAT[mimeType] ?? mimeType.split('/').pop() ?? 'wav';
}

export function assertValidAudioInput(
  audio: AiAudioInput,
  maxAudioBytes = 25 * 1024 * 1024
): void {
  if (!audio.base64?.trim()) {
    throw new Error('音频数据不能为空');
  }
  if (!ALLOWED_MIME.has(audio.mimeType)) {
    throw new Error(`不支持的音频格式: ${audio.mimeType}`);
  }

  const byteLength = estimateBase64ByteLength(audio.base64);
  if (byteLength > maxAudioBytes) {
    throw new Error(`音频过大，最大 ${Math.round(maxAudioBytes / 1024 / 1024)}MB`);
  }
}

function estimateBase64ByteLength(base64: string): number {
  if (typeof Buffer !== 'undefined') {
    return Buffer.byteLength(base64, 'base64');
  }
  const padding = base64.endsWith('==') ? 2 : base64.endsWith('=') ? 1 : 0;
  return Math.floor((base64.length * 3) / 4) - padding;
}

export async function fileToAiAudioInput(file: File): Promise<AiAudioInput> {
  const buffer = await file.arrayBuffer();
  if (typeof Buffer !== 'undefined') {
    return {
      base64: Buffer.from(buffer).toString('base64'),
      mimeType: file.type || 'audio/wav',
    };
  }
  const bytes = new Uint8Array(buffer);
  let binary = '';
  for (let index = 0; index < bytes.length; index += 1) {
    binary += String.fromCharCode(bytes[index]!);
  }
  return { base64: btoa(binary), mimeType: file.type || 'audio/wav' };
}

export function base64ToBlob(base64: string, mimeType: string): Blob {
  if (typeof Buffer !== 'undefined') {
    const bytes = Buffer.from(base64, 'base64');
    return new Blob([bytes], { type: mimeType });
  }
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let index = 0; index < binary.length; index += 1) {
    bytes[index] = binary.charCodeAt(index);
  }
  return new Blob([bytes], { type: mimeType });
}
