import { buildFeishuPostMessage } from '../buildPostMessage';
import { formatDateTime } from '../formatDateTime';
import type { FeishuPostMessage } from '../types';

export type CiNotifyStatus = 'success' | 'failure';

export interface CiNotifyContext {
  status: CiNotifyStatus;
  repository: string;
  workflow: string;
  runNumber: number;
  runId: number;
  eventName: string;
  refName: string;
  sha: string;
  actor: string;
  serverUrl: string;
  finishedAt: string;
  imageTag?: string;
  teachHubApkReleaseUrl?: string;
  teachHubApkDownloadUrl?: string;
}

function shortSha(sha: string): string {
  return sha.slice(0, 7);
}

function buildRunUrl(context: CiNotifyContext): string {
  return `${context.serverUrl}/${context.repository}/actions/runs/${context.runId}`;
}

/**
 * 构建 GitHub Actions CI 构建结果通知消息。
 */
export function buildCiFeishuMessage(context: CiNotifyContext): FeishuPostMessage {
  const isSuccess = context.status === 'success';
  const title = isSuccess ? '【CI 构建成功】' : '【CI 构建失败】';
  const statusText = isSuccess ? '✅ 成功' : '❌ 失败';

  const lines = [
    `状态：${statusText}`,
    `仓库：${context.repository}`,
    `工作流：${context.workflow}`,
    `触发：${context.eventName} · ${context.refName}`,
    `Run：#${context.runNumber}`,
    `提交：${shortSha(context.sha)}`,
    `操作者：${context.actor}`,
    `完成时间：${formatDateTime(context.finishedAt)}`,
  ];

  if (context.imageTag) {
    lines.push(`镜像标签：${context.imageTag}`);
  }

  if (context.teachHubApkReleaseUrl) {
    lines.push(`TeachHub Android Release 页面：${context.teachHubApkReleaseUrl}`);
  }

  if (context.teachHubApkDownloadUrl) {
    lines.push(`TeachHub Android APK 下载：${context.teachHubApkDownloadUrl}`);
  }

  if (!isSuccess) {
    lines.push('', '请打开 Actions 日志查看失败步骤。');
  }

  return buildFeishuPostMessage(title, lines, {
    text: '查看 Actions 详情',
    href: buildRunUrl(context),
  });
}
