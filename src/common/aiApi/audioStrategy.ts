import { detectVisionMessageFormat } from './visionMessageFormats';
import { isLikelyNativeAudioChatModel } from './modelHeuristics';
import type { AudioStrategy } from './types';

export type ResolvedAudioHandling = 'none' | 'native' | 'stt';

export function resolveAudioHandling(options: {
  hasAudio: boolean;
  strategy: AudioStrategy;
  model: string;
  baseUrl: string;
}): ResolvedAudioHandling {
  if (!options.hasAudio) {
    return 'none';
  }

  if (options.strategy === 'stt') {
    return 'stt';
  }

  if (options.strategy === 'native') {
    return 'native';
  }

  // auto：Ollama 等本地栈通常无 chat 内嵌音频 → STT
  if (detectVisionMessageFormat(options.baseUrl) === 'ollama') {
    return 'stt';
  }

  if (isLikelyNativeAudioChatModel(options.model)) {
    return 'native';
  }

  return 'stt';
}

export function isAudioInputError(message: string): boolean {
  return (
    /input_audio/i.test(message) ||
    /unknown variant [`']?input_audio[`']?/i.test(message) ||
    /does not support.*audio/i.test(message) ||
    /audio input/i.test(message) ||
    /invalid audio/i.test(message)
  );
}

export function appendTranscriptionsToPrompt(
  userPrompt: string,
  transcriptions: string[]
): string {
  if (transcriptions.length === 0) {
    return userPrompt;
  }

  const blocks = transcriptions.map((text, index) => {
    const label = transcriptions.length === 1 ? '[语音转写]' : `[语音转写 ${index + 1}]`;
    return `${label}\n${text.trim()}`;
  });

  const joined = blocks.join('\n\n');
  const trimmedPrompt = userPrompt.trim();
  return trimmedPrompt ? `${trimmedPrompt}\n\n${joined}` : joined;
}
