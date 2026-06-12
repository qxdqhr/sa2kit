import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest';
import * as resolveConfig from '../../src/common/aiApi/resolveConfig';
import {
  clearAiTasksForTest,
  registerCoreAiTasks,
  resetCoreAiTasksForTest,
  runAiTask,
  CORE_LLM_COMPLETION_TASK_ID,
} from '../../src/common/aiApi';

describe('aiApi runAiTask', () => {
  beforeEach(() => {
    clearAiTasksForTest();
    resetCoreAiTasksForTest();
    registerCoreAiTasks();

    vi.stubGlobal(
      'fetch',
      vi.fn(async () => ({
        ok: true,
        text: async () =>
          JSON.stringify({
            id: 'chatcmpl-task',
            model: 'gpt-4o-mini',
            choices: [{ message: { role: 'assistant', content: 'Task reply' } }],
          }),
      }))
    );
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
    clearAiTasksForTest();
    resetCoreAiTasksForTest();
  });

  it('returns AI_CONFIG_MISSING without api key', async () => {
    vi.spyOn(resolveConfig, 'resolveAiConnectionConfig').mockReturnValue(null);

    const result = await runAiTask(CORE_LLM_COMPLETION_TASK_ID, {
      userPrompt: 'hello',
    });
    expect(result.success).toBe(false);
    expect(result.error?.code).toBe('AI_CONFIG_MISSING');
  });

  it('runs core.llmCompletion with external connection and prompts', async () => {
    const result = await runAiTask(
      CORE_LLM_COMPLETION_TASK_ID,
      {
        systemPrompt: 'Be concise',
        userPrompt: 'Reply OK',
        connection: {
          apiKey: 'sk-test',
          baseUrl: 'https://api.example.com/v1',
          textModel: 'gpt-4o-mini',
        },
      },
      {}
    );

    expect(result.success).toBe(true);
    expect(result.data).toEqual({
      content: 'Task reply',
      rawText: 'Task reply',
    });
    expect(result.meta?.model).toBe('gpt-4o-mini');
  });
});
