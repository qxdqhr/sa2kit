import type { AiTaskDefinition, ConnectivityTestOutput } from '../types';
import { callChat } from '../callChat';
import { extractJsonObject } from '../jsonUtils';
import { resolveAiConnectionConfig } from '../resolveConfig';
import { CORE_CONNECTIVITY_TEST_TASK_ID } from '../types';

export const coreConnectivityTestTask: AiTaskDefinition<Record<string, never>, ConnectivityTestOutput> =
  {
    id: CORE_CONNECTIVITY_TEST_TASK_ID,
    description: '测试 AI API 连通性（轻量文本请求）',
    validateInput() {
      return {};
    },
    async execute(_input, ctx) {
      const config = resolveAiConnectionConfig(ctx.clientSettings);
      if (!config) {
        throw new Error('未配置 AI API Key');
      }

      const result = await callChat({
        baseUrl: config.baseUrl,
        apiKey: config.apiKey,
        model: config.textModel,
        systemPrompt: 'You are a connectivity probe. Reply briefly.',
        userPrompt: 'Say OK',
        temperature: 0,
        maxTokens: 32,
        timeoutMs: config.timeoutMs,
      });

      // HTTP 请求成功即视为连通；尽量解析回复内容用于展示
      let reply = result.content.trim();

      try {
        const json = extractJsonObject(result.content);
        reply = String(json.reply ?? json.message ?? result.content).trim();
      } catch {
        // 非 JSON 回复也接受
      }

      return {
        data: { ok: true, reply: reply || 'OK' },
        meta: {
          model: result.model,
          provider: 'openai-compatible',
        },
      };
    },
  };
