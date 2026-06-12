import { describe, expect, it, vi, afterEach } from 'vitest';
import { callMultimodalChat } from '../../src/common/aiApi/callMultimodalChat';
import { resolveAudioHandling } from '../../src/common/aiApi/audioStrategy';

const CONNECTION = {
  apiKey: 'test-key',
  baseUrl: 'https://api.example.com/v1',
  textModel: 'gpt-4o-mini',
  visionModel: 'gpt-4o-mini',
  audioModel: 'whisper-1',
  audioStrategy: 'auto' as const,
};

describe('resolveAudioHandling', () => {
  it('returns none without audio', () => {
    expect(
      resolveAudioHandling({
        hasAudio: false,
        strategy: 'auto',
        model: 'gpt-4o-mini',
        baseUrl: 'https://api.openai.com/v1',
      })
    ).toBe('none');
  });

  it('auto picks native for gpt-4o on OpenAI-compatible baseUrl', () => {
    expect(
      resolveAudioHandling({
        hasAudio: true,
        strategy: 'auto',
        model: 'gpt-4o-mini',
        baseUrl: 'https://api.openai.com/v1',
      })
    ).toBe('native');
  });

  it('auto picks stt for text-only model', () => {
    expect(
      resolveAudioHandling({
        hasAudio: true,
        strategy: 'auto',
        model: 'deepseek-chat',
        baseUrl: 'https://api.openai.com/v1',
      })
    ).toBe('stt');
  });

  it('auto picks stt for ollama', () => {
    expect(
      resolveAudioHandling({
        hasAudio: true,
        strategy: 'auto',
        model: 'llava',
        baseUrl: 'http://127.0.0.1:11434/v1',
      })
    ).toBe('stt');
  });
});

describe('callMultimodalChat', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('sends image_url parts for vision request', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => ({
        ok: true,
        text: async () =>
          JSON.stringify({
            model: 'gpt-4o-mini',
            choices: [{ message: { content: 'multimodal reply' } }],
          }),
      }))
    );

    const result = await callMultimodalChat({
      systemPrompt: 'sys',
      userPrompt: 'describe',
      media: [{ kind: 'image', base64: 'aW1n', mimeType: 'image/png' }],
      connection: CONNECTION,
    });

    expect(result.content).toBe('multimodal reply');
    const fetchMock = fetch as unknown as ReturnType<typeof vi.fn>;
    const chatCall = fetchMock.mock.calls.find(([url]) =>
      String(url).includes('/chat/completions')
    );
    const body = JSON.parse(String(chatCall?.[1]?.body));
    const userContent = body.messages[1].content;
    expect(userContent.some((part: { type: string }) => part.type === 'image_url')).toBe(true);
  });

  it('auto uses native audio for gpt-4o', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => ({
        ok: true,
        text: async () =>
          JSON.stringify({
            model: 'gpt-4o-mini',
            choices: [{ message: { content: 'heard it' } }],
          }),
      }))
    );

    const result = await callMultimodalChat({
      systemPrompt: 'sys',
      userPrompt: 'listen',
      media: [{ kind: 'audio', base64: 'YXVkbw==', mimeType: 'audio/wav' }],
      connection: CONNECTION,
    });

    expect(result.audioHandling).toBe('native');
    const fetchMock = fetch as unknown as ReturnType<typeof vi.fn>;
    const chatCall = fetchMock.mock.calls.find(([url]) =>
      String(url).includes('/chat/completions')
    );
    const body = JSON.parse(String(chatCall?.[1]?.body));
    const userContent = body.messages[1].content;
    expect(userContent.some((part: { type: string }) => part.type === 'input_audio')).toBe(true);
  });

  it('auto falls back to STT when native audio fails', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async (url: string, init?: RequestInit) => {
        if (String(url).includes('/audio/transcriptions')) {
          return {
            ok: true,
            text: async () => JSON.stringify({ text: '你好世界' }),
          };
        }

        const body = init?.body ? JSON.parse(String(init.body)) : {};
        const userMessage = body.messages?.find((item: { role: string }) => item.role === 'user');
        const hasNativeAudio = Array.isArray(userMessage?.content)
          ? userMessage.content.some((part: { type?: string }) => part.type === 'input_audio')
          : false;

        if (hasNativeAudio) {
          return {
            ok: false,
            text: async () =>
              JSON.stringify({
                error: { message: 'Model does not support input_audio' },
              }),
          };
        }

        return {
          ok: true,
          text: async () =>
            JSON.stringify({
              model: 'gpt-4o-mini',
              choices: [{ message: { content: 'multimodal reply' } }],
            }),
        };
      })
    );

    const result = await callMultimodalChat({
      systemPrompt: 'sys',
      userPrompt: 'listen',
      media: [{ kind: 'audio', base64: 'YXVkbw==', mimeType: 'audio/wav' }],
      connection: CONNECTION,
    });

    expect(result.audioHandling).toBe('stt');
    expect(result.transcriptions).toEqual(['你好世界']);
    const fetchMock = fetch as unknown as ReturnType<typeof vi.fn>;
    expect(
      fetchMock.mock.calls.some(([url]) => String(url).includes('/audio/transcriptions'))
    ).toBe(true);
  });

  it('uses STT directly for deepseek model', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async (url: string) => {
        if (String(url).includes('/audio/transcriptions')) {
          return {
            ok: true,
            text: async () => JSON.stringify({ text: '你好世界' }),
          };
        }
        return {
          ok: true,
          text: async () =>
            JSON.stringify({
              model: 'deepseek-chat',
              choices: [{ message: { content: 'multimodal reply' } }],
            }),
        };
      })
    );

    const result = await callMultimodalChat({
      systemPrompt: 'sys',
      userPrompt: 'listen',
      media: [{ kind: 'audio', base64: 'YXVkbw==', mimeType: 'audio/wav' }],
      connection: {
        ...CONNECTION,
        textModel: 'deepseek-chat',
        visionModel: 'deepseek-chat',
      },
    });

    expect(result.audioHandling).toBe('stt');
    expect(result.transcriptions).toEqual(['你好世界']);
    const fetchMock = fetch as unknown as ReturnType<typeof vi.fn>;
    const chatCall = fetchMock.mock.calls.find(([url]) =>
      String(url).includes('/chat/completions')
    );
    const body = JSON.parse(String(chatCall?.[1]?.body));
    expect(body.messages[1].content).toContain('[语音转写]');
    expect(body.messages[1].content).toContain('你好世界');
  });
});
