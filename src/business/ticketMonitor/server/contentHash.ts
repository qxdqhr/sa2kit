import { createHash } from 'crypto';
import type { TicketEvent } from '../domain/types';

export function computeEventContentHash(event: Pick<
  TicketEvent,
  'source' | 'title' | 'receptionTitle' | 'seatInfo' | 'status' | 'ticketOpenAt' | 'ticketEndAt' | 'eventUrl'
>): string {
  const payload = [
    event.source,
    event.title,
    event.receptionTitle ?? '',
    event.seatInfo ?? '',
    event.status,
    event.ticketOpenAt,
    event.ticketEndAt ?? '',
    event.eventUrl,
  ].join('|');

  return createHash('sha256').update(payload).digest('hex');
}
