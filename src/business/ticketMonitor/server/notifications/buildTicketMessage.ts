import {
  buildFeishuPostMessage,
  formatDateTime,
  type FeishuPostMessage,
} from 'sa2kit/common/feishu';
import type { TicketEvent } from '../../domain/types';
import { SOURCE_LABEL_MAP } from '../../domain/types';

export type { FeishuPostMessage };

function estimateDaysLeft(ticketEndAt: string, now = Date.now()): number {
  const endMs = new Date(ticketEndAt).getTime();
  if (!Number.isFinite(endMs)) return 0;
  return Math.max(0, Math.ceil((endMs - now) / (24 * 60 * 60 * 1000)));
}

export function buildNewEventMessage(event: TicketEvent): FeishuPostMessage {
  const lines = [
    `平台：${SOURCE_LABEL_MAP[event.source]}`,
    `演出：${event.title}`,
    event.receptionTitle ? `受付：${event.receptionTitle}` : '',
    event.seatInfo ? `席位：${event.seatInfo}` : '',
    `开票时间：${formatDateTime(event.ticketOpenAt)}`,
    event.ticketEndAt ? `截止售卖：${formatDateTime(event.ticketEndAt)}` : '',
  ];

  return buildFeishuPostMessage('【票务监控·新演出】', lines, {
    text: '前往官网',
    href: event.eventUrl,
  });
}

export function buildEndingSoonMessage(
  event: TicketEvent,
  thresholdDays: number,
): FeishuPostMessage {
  const daysLeft = estimateDaysLeft(event.ticketEndAt!);
  const lines = [
    `平台：${SOURCE_LABEL_MAP[event.source]}`,
    `演出：${event.title}`,
    event.receptionTitle ? `受付：${event.receptionTitle}` : '',
    `提醒档位：${thresholdDays} 天`,
    `截止售卖：${formatDateTime(event.ticketEndAt!)}`,
    `剩余：约 ${daysLeft} 天`,
  ];

  return buildFeishuPostMessage('【票务监控·即将截止】', lines, {
    text: '前往官网',
    href: event.eventUrl,
  });
}

export function buildTestMessage(): FeishuPostMessage {
  return buildFeishuPostMessage('【票务监控·测试消息】', [
    '飞书 Webhook 配置成功。',
    `发送时间：${formatDateTime(new Date().toISOString())}`,
  ]);
}

export { formatDateTime, estimateDaysLeft };
