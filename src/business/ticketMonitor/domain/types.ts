export type TicketSource = 'eplus' | 'asobistore' | 'piapro' | 'lawsonticket';

export type TicketStatus = 'upcoming' | 'on_sale' | 'ended' | 'unknown';

export type NotifyTriggerType = 'new_event' | 'ending_soon';

export type SyncRunStatus = 'running' | 'success' | 'partial' | 'failed';

export const TICKET_SOURCES: TicketSource[] = ['eplus', 'asobistore', 'piapro', 'lawsonticket'];

export const DEFAULT_ENDING_SOON_DAYS_LIST = [3] as const;

export const DEFAULT_NEW_EVENT_PLATFORMS: TicketSource[] = ['asobistore'];

export interface TicketEvent {
  id: string;
  title: string;
  receptionTitle?: string;
  seatInfo?: string;
  source: TicketSource;
  ticketOpenAt: string;
  ticketEndAt?: string;
  status: TicketStatus;
  eventUrl: string;
  coverImage?: string;
  location?: string;
  tags?: string[];
  fetchedAt: string;
}

export interface TicketEventsQuery {
  q?: string;
  sources?: TicketSource[];
  status?: TicketStatus;
  sortByEndAtDesc?: boolean;
  limit?: number;
}

export interface TicketEventsResult {
  events: TicketEvent[];
  errors: string[];
  lastSyncAt?: string;
}

export interface TicketMonitorConfigDto {
  notificationsEnabled: boolean;
  feishuWebhookUrl: string | null;
  feishuSignSecret: string | null;
  newEventEnabled: boolean;
  newEventPlatforms: TicketSource[];
  endingSoonEnabled: boolean;
  endingSoonDaysList: number[];
  effectiveEndingSoonDaysList: number[];
  updatedAt?: string;
}

export interface TicketMonitorConfigInput {
  notificationsEnabled?: boolean;
  feishuWebhookUrl?: string | null;
  feishuSignSecret?: string | null;
  newEventEnabled?: boolean;
  newEventPlatforms?: TicketSource[];
  endingSoonEnabled?: boolean;
  endingSoonDaysList?: number[];
}

export interface SyncStatusSummary {
  id: number;
  startedAt: string;
  finishedAt: string | null;
  durationMs: number | null;
  sourcesTotal: number;
  sourcesFailed: number;
  eventsUpserted: number;
  newEventsFound: number;
  endingSoonTriggered: number;
  notificationsSent: number;
  errors: string[];
  status: SyncRunStatus;
}

export interface SyncEventsResult {
  runId: number;
  eventsUpserted: number;
  newEventsFound: number;
  endingSoonTriggered: number;
  notificationsSent: number;
  errors: string[];
  status: SyncRunStatus;
}

export function resolveEndingSoonDaysList(raw: number[] | null | undefined): number[] {
  const filtered = (raw ?? []).filter((d) => Number.isInteger(d) && d >= 1);
  if (!filtered.length) return [...DEFAULT_ENDING_SOON_DAYS_LIST];
  return [...new Set(filtered)].sort((a, b) => b - a);
}

export function isTicketSource(value: string): value is TicketSource {
  return TICKET_SOURCES.includes(value as TicketSource);
}

export const SOURCE_LABEL_MAP: Record<TicketSource, string> = {
  eplus: 'eplus',
  asobistore: 'asobistore',
  piapro: 'piapro',
  lawsonticket: 'LawsonTicket',
};

export const STATUS_LABEL_MAP: Record<TicketStatus, string> = {
  upcoming: '未开票',
  on_sale: '售卖中',
  ended: '已结束',
  unknown: '未知',
};
