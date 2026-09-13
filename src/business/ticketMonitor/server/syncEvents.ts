import type { SyncEventsResult, SyncRunStatus } from '../domain/types';
import type { TicketMonitorDbService } from './ticketMonitorDbService';
import { fetchEventsFromAdapters } from './fetchEventsFromAdapters';
import { evaluateNewEvents } from './evaluateNewEvents';
import { evaluateEndingSoon } from './evaluateEndingSoon';

export async function syncTicketMonitorEvents(
  ticketMonitorDb: TicketMonitorDbService,
): Promise<SyncEventsResult> {
  const startedAt = new Date();
  const config = await ticketMonitorDb.getConfigForNotify();
  const { events, errors, sourcesTotal, sourcesFailed } = await fetchEventsFromAdapters();

  const runId = await ticketMonitorDb.createSyncRun(sourcesTotal);

  const newEvents = [];
  let eventsUpserted = 0;

  for (const event of events) {
    const { isNew, stored } = await ticketMonitorDb.upsertEvent(event);
    eventsUpserted += 1;
    if (isNew) {
      newEvents.push(stored);
    }
  }

  const newEventResult = await evaluateNewEvents(newEvents, config, ticketMonitorDb);
  const allStoredEvents = await ticketMonitorDb.getAllStoredEvents();
  const endingSoonResult = await evaluateEndingSoon(allStoredEvents, config, ticketMonitorDb);

  const notificationsSent = newEventResult.sent + endingSoonResult.sent;
  const notifyErrors: string[] = [];

  if (newEventResult.failed > 0) {
    notifyErrors.push(`new_event notifications failed: ${newEventResult.failed}`);
  }
  if (endingSoonResult.failed > 0) {
    notifyErrors.push(`ending_soon notifications failed: ${endingSoonResult.failed}`);
  }

  const allErrors = [...errors, ...notifyErrors];
  let status: SyncRunStatus = 'success';
  if (allErrors.length && eventsUpserted > 0) status = 'partial';
  if (allErrors.length && eventsUpserted === 0) status = 'failed';

  await ticketMonitorDb.finishSyncRun(runId, {
    sourcesFailed,
    eventsUpserted,
    newEventsFound: newEvents.length,
    endingSoonTriggered: endingSoonResult.triggered,
    notificationsSent,
    errors: allErrors,
    status,
    startedAt,
  });

  return {
    runId,
    eventsUpserted,
    newEventsFound: newEvents.length,
    endingSoonTriggered: endingSoonResult.triggered,
    notificationsSent,
    errors: allErrors,
    status,
  };
}
