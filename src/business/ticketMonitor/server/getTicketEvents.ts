import type { TicketEventsQuery, TicketEventsResult } from '../domain/types';
import type { TicketMonitorDbService } from './ticketMonitorDbService';

export async function getCachedTicketEvents(
  query: TicketEventsQuery,
  ticketMonitorDb: TicketMonitorDbService,
): Promise<TicketEventsResult> {
  const events = await ticketMonitorDb.getCachedEvents(query);
  const lastSyncAt = await ticketMonitorDb.getLastSyncAt();

  return {
    events,
    errors: [],
    lastSyncAt: lastSyncAt ?? undefined,
  };
}
