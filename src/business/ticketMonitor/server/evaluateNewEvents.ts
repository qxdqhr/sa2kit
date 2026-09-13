import type { TicketEvent, TicketSource } from '../domain/types';
import type { ticketMonitorConfig } from './schema';
import type { TicketMonitorDbService } from './ticketMonitorDbService';
import { buildNewEventMessage } from './notifications/buildTicketMessage';
import { sendFeishuPostMessage } from 'sa2kit/common/feishu';

type ConfigRow = typeof ticketMonitorConfig.$inferSelect;

export interface NotifyDispatchResult {
  sent: number;
  skipped: number;
  failed: number;
}

async function canSend(config: ConfigRow): Promise<boolean> {
  return Boolean(
    config.notificationsEnabled
    && config.feishuWebhookUrl?.trim(),
  );
}

async function dispatchMessage(
  ticketMonitorDb: TicketMonitorDbService,
  config: ConfigRow,
  input: {
    event: TicketEvent;
    triggerType: 'new_event' | 'ending_soon';
    dedupeKey: string;
    message: ReturnType<typeof buildNewEventMessage>;
  },
): Promise<'sent' | 'skipped' | 'failed'> {
  if (await ticketMonitorDb.hasNotifyDedupeKey(input.dedupeKey)) {
    return 'skipped';
  }

  const result = await sendFeishuPostMessage(
    config.feishuWebhookUrl!,
    input.message,
    config.feishuSignSecret,
  );

  await ticketMonitorDb.insertNotifyLog({
    eventId: input.event.id,
    triggerType: input.triggerType,
    dedupeKey: input.dedupeKey,
    source: input.event.source,
    title: input.event.title,
    payload: { title: input.message.content.post.zh_cn.title },
    feishuStatus: result.success ? 'success' : 'failed',
    errorMessage: result.errorMessage,
  });

  return result.success ? 'sent' : 'failed';
}

export async function evaluateNewEvents(
  newEvents: TicketEvent[],
  config: ConfigRow,
  ticketMonitorDb: TicketMonitorDbService,
): Promise<NotifyDispatchResult> {
  const summary: NotifyDispatchResult = { sent: 0, skipped: 0, failed: 0 };

  if (!newEvents.length || !config.newEventEnabled || !(await canSend(config))) {
    return summary;
  }

  const allowed = new Set<TicketSource>(config.newEventPlatforms ?? []);

  for (const event of newEvents) {
    if (!allowed.has(event.source)) continue;

    const dedupeKey = `new_event:${event.id}`;
    const outcome = await dispatchMessage(ticketMonitorDb, config, {
      event,
      triggerType: 'new_event',
      dedupeKey,
      message: buildNewEventMessage(event),
    });

    summary[outcome] += 1;
  }

  return summary;
}
