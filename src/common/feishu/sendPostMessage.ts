import { createHmac } from 'crypto';
import type { FeishuPostMessage, FeishuSendOptions, FeishuSendResult } from './types';

function buildSignHeaders(secret: string): Record<string, string> {
  const timestamp = Math.floor(Date.now() / 1000).toString();
  const sign = createHmac('sha256', secret)
    .update(`${timestamp}\n${secret}`)
    .digest('base64');

  return {
    timestamp,
    sign,
  };
}

/**
 * 通过飞书自定义机器人 Webhook 发送 post 富文本消息。
 * @see https://open.feishu.cn/document/client-docs/bot-v3/add-custom-bot
 */
export async function sendFeishuPostMessage(
  webhookUrl: string,
  message: FeishuPostMessage,
  signSecret?: string | null,
  options?: FeishuSendOptions,
): Promise<FeishuSendResult> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json; charset=utf-8',
  };

  if (signSecret?.trim()) {
    Object.assign(headers, buildSignHeaders(signSecret.trim()));
  }

  const timeoutMs = options?.timeoutMs ?? 15000;

  try {
    const response = await fetch(webhookUrl, {
      method: 'POST',
      headers,
      body: JSON.stringify(message),
      signal: AbortSignal.timeout(timeoutMs),
    });

    const text = await response.text();
    if (!response.ok) {
      return {
        success: false,
        status: response.status,
        errorMessage: text || `HTTP ${response.status}`,
      };
    }

    try {
      const json = JSON.parse(text) as { code?: number; msg?: string };
      if (json.code !== undefined && json.code !== 0) {
        return {
          success: false,
          status: response.status,
          errorMessage: json.msg || `Feishu code ${json.code}`,
        };
      }
    } catch {
      // non-json success body is acceptable
    }

    return { success: true, status: response.status };
  } catch (error) {
    return {
      success: false,
      status: 0,
      errorMessage: error instanceof Error ? error.message : String(error),
    };
  }
}
