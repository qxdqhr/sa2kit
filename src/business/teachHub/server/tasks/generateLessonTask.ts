import {
  extractJsonObject,
  registerAiTask,
  requireAiConnectionConfig,
  requestJson,
  type AiTaskDefinition,
} from 'sa2kit/common/aiApi/server';
import {
  buildGenerateLessonUserPrompt,
  TEACH_SKILL_SYSTEM_PROMPT,
  type TeachGenerateLessonTaskInput,
} from './teachAgentPrompt';
import {
  parseGenerateLessonJson,
  validateGenerateLessonOutput,
} from './validateGenerateOutput';

export const TEACH_GENERATE_LESSON_TASK_ID = 'teach.generateLesson';

function joinChatCompletionsUrl(baseUrl: string): string {
  return `${baseUrl.replace(/\/+$/, '')}/chat/completions`;
}

function isTeachGenerateLessonInput(input: unknown): input is TeachGenerateLessonTaskInput {
  if (!input || typeof input !== 'object') return false;
  const v = input as TeachGenerateLessonTaskInput;
  return (
    typeof v.workspaceId === 'string' &&
    (v.trigger === 'first_lesson' || v.trigger === 'next_lesson') &&
    Number.isFinite(v.nextOrder) &&
    typeof v.missionMarkdown === 'string' &&
    Array.isArray(v.learningRecords) &&
    Array.isArray(v.existingLessonSlugs)
  );
}

export const teachGenerateLessonTask: AiTaskDefinition<
  TeachGenerateLessonTaskInput,
  { output: ReturnType<typeof validateGenerateLessonOutput>; rawText: string }
> = {
  id: TEACH_GENERATE_LESSON_TASK_ID,
  description: 'teachHub：根据工作区上下文生成下一课 HTML',
  validateInput(input) {
    if (!isTeachGenerateLessonInput(input)) {
      throw new Error('无效的 teach.generateLesson 输入');
    }
    if (!input.missionMarkdown.trim()) {
      throw new Error('missionMarkdown 不能为空');
    }
    return input;
  },
  async execute(input, ctx) {
    const config = requireAiConnectionConfig(undefined, ctx.clientSettings);
    const model = config.textModel;
    const userPrompt = buildGenerateLessonUserPrompt(input);

    const payload: Record<string, unknown> = {
      model,
      messages: [
        { role: 'system', content: TEACH_SKILL_SYSTEM_PROMPT },
        { role: 'user', content: userPrompt },
      ],
      temperature: 0.35,
      max_tokens: 12000,
      response_format: { type: 'json_object' },
    };

    const raw = await requestJson({
      url: joinChatCompletionsUrl(config.baseUrl),
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${config.apiKey}`,
      },
      body: payload,
      timeoutMs: Math.max(config.timeoutMs, 120000),
    });

    const content = (raw as { choices?: Array<{ message?: { content?: string } }> }).choices?.[0]
      ?.message?.content;
    const text = typeof content === 'string' ? content : '';
    const json = extractJsonObject(text);
    const parsed = parseGenerateLessonJson(json);
    const output = validateGenerateLessonOutput(parsed, input.nextOrder);

    return {
      data: { output, rawText: text },
      meta: {
        model: (raw as { model?: string }).model ?? model,
        provider: 'openai-compatible',
      },
    };
  },
};

let registered = false;

export function registerTeachHubAiTasks(): void {
  if (registered) return;
  registerAiTask(teachGenerateLessonTask);
  registered = true;
}
