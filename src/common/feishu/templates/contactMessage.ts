import { buildFeishuPostMessage } from '../buildPostMessage';
import { formatDateTime } from '../formatDateTime';
import type { FeishuPostMessage } from '../types';

export interface ContactSubmission {
  name: string;
  email: string;
  message: string;
  submittedAt: string;
  clientIp?: string;
}

/**
 * 构建首页「联系我」表单提交的飞书通知消息。
 */
export function buildContactFeishuMessage(
  submission: ContactSubmission,
): FeishuPostMessage {
  const lines = [
    `姓名：${submission.name}`,
    `邮箱：${submission.email}`,
    `时间：${formatDateTime(submission.submittedAt)}`,
    submission.clientIp ? `来源 IP：${submission.clientIp}` : '',
    '',
    '留言内容：',
    submission.message,
  ].filter((line) => line !== '');

  return buildFeishuPostMessage(
    '【首页留言】',
    lines,
  );
}
