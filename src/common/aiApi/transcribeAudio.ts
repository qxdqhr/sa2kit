import { base64ToBlob, mimeToAudioFormat } from './audioUtils';
import type { AiAudioInput, AiConnectionConfig } from './types';

function joinUrl(baseUrl: string, path: string): string {
  return `${baseUrl.replace(/\/+$/, '')}/${path.replace(/^\/+/, '')}`;
}

type TranscriptionResponse = {
  text?: string;
  error?: { message?: string };
};

export interface TranscribeAudioOptions {
  audio: AiAudioInput;
  config: AiConnectionConfig;
  model?: string;
  language?: string;
}

export async function transcribeAudio(options: TranscribeAudioOptions): Promise<string> {
  const { audio, config, model, language } = options;
  const sttModel = model?.trim() || config.audioModel;
  const blob = base64ToBlob(audio.base64, audio.mimeType);
  const extension = mimeToAudioFormat(audio.mimeType);
  const form = new FormData();

  form.append('file', blob, `audio.${extension}`);
  form.append('model', sttModel);
  if (language?.trim()) {
    form.append('language', language.trim());
  }

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), config.timeoutMs);

  try {
    const response = await fetch(joinUrl(config.baseUrl, 'audio/transcriptions'), {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${config.apiKey}`,
      },
      body: form,
      signal: controller.signal,
    });

    const text = await response.text();
    let data: unknown = null;
    if (text) {
      try {
        data = JSON.parse(text);
      } catch {
        data = text;
      }
    }

    if (!response.ok) {
      const record = data as { error?: { message?: string } | string; message?: string } | null;
      const errorMessage =
        (typeof record?.error === 'object' ? record.error?.message : record?.error) ||
        record?.message ||
        `STT 请求失败 (${response.status})`;
      throw new Error(String(errorMessage));
    }

    if (typeof data === 'string') {
      return data.trim();
    }

    const parsed = data as TranscriptionResponse;
    return (parsed.text ?? '').trim();
  } finally {
    clearTimeout(timeoutId);
  }
}

export async function transcribeAudios(
  audios: AiAudioInput[],
  config: AiConnectionConfig,
  model?: string
): Promise<string[]> {
  const results: string[] = [];
  for (const audio of audios) {
    results.push(await transcribeAudio({ audio, config, model }));
  }
  return results;
}
