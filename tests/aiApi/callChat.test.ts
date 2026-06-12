import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest';
import { callChat } from '../../src/common/aiApi/callChat';

describe('callChat', () => {
  beforeEach(() => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => ({
        ok: true,
        text: async () =>
          JSON.stringify({
            id: 'chatcmpl-test',
            model: 'gpt-4o-mini',
            choices: [{ message: { role: 'assistant', content: 'Hello world' } }],
            usage: { prompt_tokens: 10, completion_tokens: 5, total_tokens: 15 },
          }),
      }))
    );
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('requires baseUrl and apiKey', async () => {
    await expect(callChat({ baseUrl: '', apiKey: 'k', userPrompt: 'hi' })).rejects.toThrow(
      'baseUrl'
    );
    await expect(
      callChat({ baseUrl: 'https://api.example.com/v1', apiKey: '', userPrompt: 'hi' })
    ).rejects.toThrow('apiKey');
  });

  it('sends external prompts and returns model content', async () => {
    const result = await callChat({
      baseUrl: 'https://api.example.com/v1',
      apiKey: 'test-key',
      model: 'gpt-4o-mini',
      systemPrompt: 'You are helpful',
      userPrompt: 'Say hello',
    });

    expect(result.content).toBe('Hello world');
    expect(result.model).toBe('gpt-4o-mini');
    expect(result.usage?.totalTokens).toBe(15);

    const fetchMock = fetch as unknown as ReturnType<typeof vi.fn>;
    expect(fetchMock).toHaveBeenCalledOnce();
    const [, init] = fetchMock.mock.calls[0];
    expect(init?.headers?.Authorization).toBe('Bearer test-key');
    const body = JSON.parse(String(init?.body));
    expect(body.messages).toEqual([
      { role: 'system', content: 'You are helpful' },
      { role: 'user', content: 'Say hello' },
    ]);
  });
});
