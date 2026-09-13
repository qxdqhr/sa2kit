import type { TicketEvent } from '../domain/types';
import { resolveEndingSoonDaysList } from '../domain/types';
import type { ticketMonitorConfig } from './schema';
import type { TicketMonitorDbService } from './ticketMonitorDbService';
import { buildEndingSoonMessage } from './notifications/buildTicketMessage';
import { sendFeishuPostMessage } from 'sa2kit/common/feishu';
import type { NotifyDispatchResult } from './evaluateNewEvents';

type ConfigRow = typeof ticketMonitorConfig.$inferSelect;

const DAY_MS = 24 * 60 * 60 * 1000;

async function canSend(config: ConfigRow): Promise<boolean> {
  return Boolean(
    config.notificationsEnabled
    && config.feishuWebhookUrl?.trim(),
  );
}

export async function evaluateEndingSoon(
  events: TicketEvent[],
  config: ConfigRow,
  ticketMonitorDb: TicketMonitorDbService,
): Promise<NotifyDispatchResult & { triggered: number }> {
  const summary: NotifyDispatchResult & { triggered: number } = {
    sent: 0,
    skipped: 0,
    failed: 0,
    triggered: 0,
  };

  if (!config.endingSoonEnabled || !(await canSend(config))) {
    return summary;
  }

  const thresholds = resolveEndingSoonDaysList(config.endingSoonDaysList);
  const now = Date.now();

  for (const event of events) {
    if (!event.ticketEndAt || event.status === 'ended') continue;

    const endMs = new Date(event.ticketEndAt).getTime();
    if (!Number.isFinite(endMs) || endMs <= now) continue;

    const remainingMs = endMs - now;

    for (const thresholdDays of thresholds) {
      if (remainingMs <= 0 || remainingMs > thresholdDays * DAY_MS) continue;

      summary.triggered += 1;
      const dedupeKey = `ending_soon:${event.id}:${event.ticketEndAt}:${thresholdDays}`;

      if (await ticketMonitorDb.hasNotifyDedupeKey(dedupeKey)) {
        summary.skipped += 1;
        continue;
      }

      const message = buildEndingSoonMessage(event, thresholdDays);
      const result = await sendFeishuPostMessage(
        config.feishuWebhookUrl!,
        message,
        config.feishuSignSecret,
      );

      await ticketMonitorDb.insertNotifyLog({
        eventId: event.id,
        triggerType: 'ending_soon',
        dedupeKey,
        source: event.source,
        title: event.title,
        payload: {
          thresholdDays,
          title: message.content.post.zh_cn.title,
        },
        feishuStatus: result.success ? 'success' : 'failed',
        errorMessage: result.errorMessage,
      });

      if (result.success) summary.sent += 1;
      else summary.failed += 1;
    }
  }

  return summary;
}
