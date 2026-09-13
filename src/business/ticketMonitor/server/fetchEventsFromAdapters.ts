import type { TicketEvent, TicketSource } from '../domain/types';
import { eplusAdapter } from './adapters/eplusAdapter';
import { asobistoreAdapter } from './adapters/asobistoreAdapter';
import { piaproAdapter } from './adapters/piaproAdapter';
import { lawsonTicketAdapter } from './adapters/lawsonTicketAdapter';

const sourceAdapterMap: Record<TicketSource, () => Promise<TicketEvent[]>> = {
  eplus: eplusAdapter,
  asobistore: asobistoreAdapter,
  piapro: piaproAdapter,
  lawsonticket: lawsonTicketAdapter,
};

export const ALL_TICKET_SOURCES = Object.keys(sourceAdapterMap) as TicketSource[];

export interface AdapterFetchResult {
  events: TicketEvent[];
  errors: string[];
  sourcesTotal: number;
  sourcesFailed: number;
}

export async function fetchEventsFromAdapters(
  sources: TicketSource[] = ALL_TICKET_SOURCES,
): Promise<AdapterFetchResult> {
  const tasks = sources.map(async (source) => {
    try {
      const events = await sourceAdapterMap[source]();
      return { source, events, error: null as string | null };
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      return { source, events: [] as TicketEvent[], error: message };
    }
  });

  const settled = await Promise.all(tasks);
  const errors: string[] = [];
  const events: TicketEvent[] = [];

  settled.forEach((result) => {
    if (result.error) {
      errors.push(`${result.source}: ${result.error}`);
      console.error('[ticket-monitor] source fetch failed:', result.source, result.error);
      return;
    }
    events.push(...result.events);
  });

  return {
    events,
    errors,
    sourcesTotal: sources.length,
    sourcesFailed: errors.length,
  };
}

export { sourceAdapterMap };
