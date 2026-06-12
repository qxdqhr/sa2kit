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
        systemPrompt: 'You are a connectivity probe. Reply with JSON only.',
        userPrompt: 'Return JSON: {"ok":true,"reply":"OK"}',
        temperature: 0,
        maxTokens: 32,
        timeoutMs: config.timeoutMs,
      });

      let ok = false;
      let reply = result.content.trim();

      try {
        const json = extractJsonObject(result.content);
        ok = json.ok === true || json.ok === 'true';
        reply = String(json.reply ?? result.content).trim();
      } catch {
        ok = /ok/i.test(result.content);
      }

      if (!ok && !reply) {
        throw new Error('模型未返回有效响应');
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
