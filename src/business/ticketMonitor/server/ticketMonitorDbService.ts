import { desc, eq } from 'drizzle-orm';
import {
  ticketMonitorConfig,
  ticketMonitorEvents,
  ticketMonitorNotifyLogs,
  ticketMonitorSyncRuns,
} from './schema';
import type {
  SyncRunStatus,
  TicketEvent,
  TicketEventsQuery,
  TicketMonitorConfigDto,
  TicketMonitorConfigInput,
  TicketSource,
  SyncStatusSummary,
} from '../domain/types';
import {
  DEFAULT_NEW_EVENT_PLATFORMS,
  resolveEndingSoonDaysList,
} from '../domain/types';
import { computeEventContentHash } from './contentHash';

const CONFIG_ROW_ID = 1;

type DbEventRow = typeof ticketMonitorEvents.$inferSelect;
type DbConfigRow = typeof ticketMonitorConfig.$inferSelect;

function toDate(value: string | Date | null | undefined): Date | null {
  if (!value) return null;
  const date = value instanceof Date ? value : new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

export function mapRowToTicketEvent(row: DbEventRow): TicketEvent {
  return {
    id: row.eventId,
    title: row.title,
    receptionTitle: row.receptionTitle ?? undefined,
    seatInfo: row.seatInfo ?? undefined,
    source: row.source as TicketSource,
    ticketOpenAt: row.ticketOpenAt.toISOString(),
    ticketEndAt: row.ticketEndAt?.toISOString(),
    status: row.status as TicketEvent['status'],
    eventUrl: row.eventUrl,
    coverImage: row.coverImage ?? undefined,
    location: row.location ?? undefined,
    tags: row.tags ?? undefined,
    fetchedAt: row.fetchedAt.toISOString(),
  };
}

function maskSecret(value: string | null): string | null {
  if (!value) return null;
  if (value.length <= 8) return '****';
  return `${value.slice(0, 4)}****${value.slice(-4)}`;
}

function maskWebhookUrl(value: string | null): string | null {
  if (!value) return null;
  if (value.length <= 16) return '****';
  return `${value.slice(0, 24)}****${value.slice(-4)}`;
}

export function mapConfigRowToDto(row: DbConfigRow, options?: { maskSensitive?: boolean }): TicketMonitorConfigDto {
  const mask = options?.maskSensitive ?? true;
  const endingSoonDaysList = row.endingSoonDaysList ?? [];

  return {
    notificationsEnabled: row.notificationsEnabled,
    feishuWebhookUrl: mask ? maskWebhookUrl(row.feishuWebhookUrl) : row.feishuWebhookUrl,
    feishuSignSecret: mask ? maskSecret(row.feishuSignSecret) : row.feishuSignSecret,
    newEventEnabled: row.newEventEnabled,
    newEventPlatforms: row.newEventPlatforms ?? [...DEFAULT_NEW_EVENT_PLATFORMS],
    endingSoonEnabled: row.endingSoonEnabled,
    endingSoonDaysList,
    effectiveEndingSoonDaysList: resolveEndingSoonDaysList(endingSoonDaysList),
    updatedAt: row.updatedAt?.toISOString(),
  };
}

export type TicketMonitorDrizzleDb = {
  select: (...args: any[]) => any;
  insert: (...args: any[]) => any;
  update: (...args: any[]) => any;
  delete: (...args: any[]) => any;
};

export class TicketMonitorDbService {
  constructor(private readonly db: TicketMonitorDrizzleDb) {}

  async getCachedEvents(query: TicketEventsQuery): Promise<TicketEvent[]> {
    const rows = await this.db.select().from(ticketMonitorEvents);
    let events = rows.map(mapRowToTicketEvent);

    const normalizedQ = query.q?.trim().toLowerCase();
    if (normalizedQ) {
      events = events.filter((event) => (
        event.title.toLowerCase().includes(normalizedQ)
        || event.tags?.some((tag) => tag.toLowerCase().includes(normalizedQ))
      ));
    }

    if (query.sources?.length) {
      events = events.filter((event) => query.sources!.includes(event.source));
    }

    if (query.status) {
      events = events.filter((event) => event.status === query.status);
    }

    events.sort((a, b) => {
      if (query.sortByEndAtDesc) {
        const aEnd = a.ticketEndAt ? new Date(a.ticketEndAt).getTime() : Number.NEGATIVE_INFINITY;
        const bEnd = b.ticketEndAt ? new Date(b.ticketEndAt).getTime() : Number.NEGATIVE_INFINITY;
        return bEnd - aEnd;
      }
      return new Date(a.ticketOpenAt).getTime() - new Date(b.ticketOpenAt).getTime();
    });

    const limit = query.limit && query.limit > 0 ? query.limit : 50;
    return events.slice(0, limit);
  }

  async getAllStoredEvents(): Promise<TicketEvent[]> {
    const rows = await this.db.select().from(ticketMonitorEvents);
    return rows.map(mapRowToTicketEvent);
  }

  async upsertEvent(event: TicketEvent): Promise<{ isNew: boolean; stored: TicketEvent }> {
    const now = new Date();
    const contentHash = computeEventContentHash(event);
    const existing = await db
      .select()
      .from(ticketMonitorEvents)
      .where(eq(ticketMonitorEvents.eventId, event.id))
      .limit(1);

    if (!existing.length) {
      const [inserted] = await db
        .insert(ticketMonitorEvents)
        .values({
          eventId: event.id,
          source: event.source,
          title: event.title,
          receptionTitle: event.receptionTitle ?? null,
          seatInfo: event.seatInfo ?? null,
          ticketOpenAt: toDate(event.ticketOpenAt)!,
          ticketEndAt: toDate(event.ticketEndAt),
          status: event.status,
          eventUrl: event.eventUrl,
          coverImage: event.coverImage ?? null,
          location: event.location ?? null,
          tags: event.tags ?? [],
          contentHash,
          firstSeenAt: now,
          fetchedAt: toDate(event.fetchedAt) ?? now,
          updatedAt: now,
        })
        .returning();

      return { isNew: true, stored: mapRowToTicketEvent(inserted) };
    }

    const [updated] = await db
      .update(ticketMonitorEvents)
      .set({
        source: event.source,
        title: event.title,
        receptionTitle: event.receptionTitle ?? null,
        seatInfo: event.seatInfo ?? null,
        ticketOpenAt: toDate(event.ticketOpenAt)!,
        ticketEndAt: toDate(event.ticketEndAt),
        status: event.status,
        eventUrl: event.eventUrl,
        coverImage: event.coverImage ?? null,
        location: event.location ?? null,
        tags: event.tags ?? [],
        contentHash,
        fetchedAt: toDate(event.fetchedAt) ?? now,
        updatedAt: now,
      })
      .where(eq(ticketMonitorEvents.eventId, event.id))
      .returning();

    return { isNew: false, stored: mapRowToTicketEvent(updated) };
  }

  async getConfigRow(): Promise<DbConfigRow | null> {
    const rows = await db
      .select()
      .from(ticketMonitorConfig)
      .where(eq(ticketMonitorConfig.id, CONFIG_ROW_ID))
      .limit(1);
    return rows[0] ?? null;
  }

  async getOrCreateConfig(): Promise<DbConfigRow> {
    const existing = await this.getConfigRow();
    if (existing) return existing;

    const envWebhook = process.env.TICKET_MONITOR_FEISHU_WEBHOOK_URL?.trim() || null;

    const [created] = await db
      .insert(ticketMonitorConfig)
      .values({
        id: CONFIG_ROW_ID,
        notificationsEnabled: false,
        feishuWebhookUrl: envWebhook,
        feishuSignSecret: null,
        newEventEnabled: true,
        newEventPlatforms: [...DEFAULT_NEW_EVENT_PLATFORMS],
        endingSoonEnabled: true,
        endingSoonDaysList: [],
        updatedAt: new Date(),
      })
      .onConflictDoNothing()
      .returning();

    if (created) return created;

    const fallback = await this.getConfigRow();
    if (!fallback) {
      throw new Error('Failed to initialize ticket monitor config');
    }
    return fallback;
  }

  async getConfigDto(maskSensitive = true): Promise<TicketMonitorConfigDto> {
    const row = await this.getOrCreateConfig();
    return mapConfigRowToDto(row, { maskSensitive });
  }

  async updateConfig(input: TicketMonitorConfigInput): Promise<TicketMonitorConfigDto> {
    const current = await this.getOrCreateConfig();

    const nextPlatforms = input.newEventPlatforms ?? current.newEventPlatforms ?? [...DEFAULT_NEW_EVENT_PLATFORMS];
    const nextDaysList = input.endingSoonDaysList !== undefined
      ? resolveEndingSoonDaysList(input.endingSoonDaysList)
      : (current.endingSoonDaysList ?? []);

    const [updated] = await db
      .update(ticketMonitorConfig)
      .set({
        notificationsEnabled: input.notificationsEnabled ?? current.notificationsEnabled,
        feishuWebhookUrl: input.feishuWebhookUrl !== undefined
          ? (input.feishuWebhookUrl?.trim() || null)
          : current.feishuWebhookUrl,
        feishuSignSecret: input.feishuSignSecret !== undefined
          ? (input.feishuSignSecret?.trim() || null)
          : current.feishuSignSecret,
        newEventEnabled: input.newEventEnabled ?? current.newEventEnabled,
        newEventPlatforms: nextPlatforms,
        endingSoonEnabled: input.endingSoonEnabled ?? current.endingSoonEnabled,
        endingSoonDaysList: input.endingSoonDaysList !== undefined
          ? input.endingSoonDaysList.filter((d) => Number.isInteger(d) && d >= 1)
          : current.endingSoonDaysList,
        updatedAt: new Date(),
      })
      .where(eq(ticketMonitorConfig.id, CONFIG_ROW_ID))
      .returning();

    return mapConfigRowToDto(updated, { maskSensitive: false });
  }

  async getConfigForNotify(): Promise<DbConfigRow> {
    return this.getOrCreateConfig();
  }

  async hasNotifyDedupeKey(dedupeKey: string): Promise<boolean> {
    const rows = await db
      .select({ id: ticketMonitorNotifyLogs.id })
      .from(ticketMonitorNotifyLogs)
      .where(eq(ticketMonitorNotifyLogs.dedupeKey, dedupeKey))
      .limit(1);
    return rows.length > 0;
  }

  async insertNotifyLog(input: {
    eventId?: string;
    triggerType: string;
    dedupeKey: string;
    source?: string;
    title?: string;
    payload?: Record<string, unknown>;
    feishuStatus: 'success' | 'failed';
    errorMessage?: string;
  }): Promise<void> {
    await this.db.insert(ticketMonitorNotifyLogs).values({
      eventId: input.eventId ?? null,
      triggerType: input.triggerType,
      dedupeKey: input.dedupeKey,
      source: input.source ?? null,
      title: input.title ?? null,
      payload: input.payload ?? null,
      feishuStatus: input.feishuStatus,
      errorMessage: input.errorMessage ?? null,
    });
  }

  async createSyncRun(sourcesTotal: number): Promise<number> {
    const [row] = await db
      .insert(ticketMonitorSyncRuns)
      .values({
        startedAt: new Date(),
        sourcesTotal,
        status: 'running',
      })
      .returning({ id: ticketMonitorSyncRuns.id });
    return row.id;
  }

  async finishSyncRun(
    runId: number,
    input: {
      sourcesFailed: number;
      eventsUpserted: number;
      newEventsFound: number;
      endingSoonTriggered: number;
      notificationsSent: number;
      errors: string[];
      status: SyncRunStatus;
      startedAt: Date;
    },
  ): Promise<void> {
    const finishedAt = new Date();
    await db
      .update(ticketMonitorSyncRuns)
      .set({
        finishedAt,
        durationMs: finishedAt.getTime() - input.startedAt.getTime(),
        sourcesFailed: input.sourcesFailed,
        eventsUpserted: input.eventsUpserted,
        newEventsFound: input.newEventsFound,
        endingSoonTriggered: input.endingSoonTriggered,
        notificationsSent: input.notificationsSent,
        errors: input.errors,
        status: input.status,
      })
      .where(eq(ticketMonitorSyncRuns.id, runId));
  }

  async getLatestSyncRun(): Promise<SyncStatusSummary | null> {
    const rows = await db
      .select()
      .from(ticketMonitorSyncRuns)
      .orderBy(desc(ticketMonitorSyncRuns.startedAt))
      .limit(1);

    const row = rows[0];
    if (!row) return null;

    return {
      id: row.id,
      startedAt: row.startedAt.toISOString(),
      finishedAt: row.finishedAt?.toISOString() ?? null,
      durationMs: row.durationMs,
      sourcesTotal: row.sourcesTotal,
      sourcesFailed: row.sourcesFailed,
      eventsUpserted: row.eventsUpserted,
      newEventsFound: row.newEventsFound,
      endingSoonTriggered: row.endingSoonTriggered,
      notificationsSent: row.notificationsSent,
      errors: row.errors ?? [],
      status: row.status as SyncRunStatus,
    };
  }

  async getLastSyncAt(): Promise<string | null> {
    const latest = await this.getLatestSyncRun();
    return latest?.finishedAt ?? latest?.startedAt ?? null;
  }
}

export function createTicketMonitorDbService(db: TicketMonitorDrizzleDb) {
  return new TicketMonitorDbService(db);
}
