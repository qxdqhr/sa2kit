/**
 * ticketMonitor 路由工厂（Phase H1b）
 */
import {
  createTicketMonitorDbService,
  getCachedTicketEvents,
  syncTicketMonitorEvents,
  type TicketMonitorDrizzleDb,
} from '../server';
import {
  isTicketSource,
  TICKET_SOURCES,
  type TicketSource,
  type TicketStatus,
} from '../domain/types';
import { buildTestMessage } from '../server/notifications/buildTicketMessage';
import { sendFeishuPostMessage } from 'sa2kit/common/feishu';

export type TicketMonitorSessionUser = { id: string };

export type TicketMonitorRouteConfig = {
  db: TicketMonitorDrizzleDb;
  getSessionUser: (request: Request) => Promise<TicketMonitorSessionUser | null>;
};

const validSources: TicketSource[] = ['eplus', 'asobistore', 'piapro', 'lawsonticket'];
const validStatuses: TicketStatus[] = ['upcoming', 'on_sale', 'ended', 'unknown'];

function json(data: unknown, status = 200) {
  return Response.json(data, { status });
}

function createDb(config: TicketMonitorRouteConfig) {
  return createTicketMonitorDbService(config.db);
}

export function isMaskedValue(value: string | null | undefined): boolean {
  return Boolean(value && value.includes('****'));
}

export function verifyCronSecret(request: Request): Response | null {
  const secret = process.env.TICKET_MONITOR_CRON_SECRET?.trim();
  if (!secret) {
    return json(
      { success: false, error: 'TICKET_MONITOR_CRON_SECRET is not configured' },
      503,
    );
  }

  const auth = request.headers.get('authorization') || '';
  const token = auth.startsWith('Bearer ') ? auth.slice(7).trim() : '';
  if (token !== secret) {
    return json({ success: false, error: 'Unauthorized' }, 401);
  }

  return null;
}

/**
 * Admin mutating ops: require configured admin token when set;
 * otherwise fall back to logged-in session (never open when unset).
 */
export async function requireTicketAdmin(
  config: TicketMonitorRouteConfig,
  request: Request,
): Promise<Response | null> {
  const required = process.env.TICKET_MONITOR_ADMIN_TOKEN?.trim();
  if (required) {
    const headerToken = request.headers.get('x-ticket-monitor-admin-token')?.trim()
      || (request.headers.get('authorization')?.startsWith('Bearer ')
        ? request.headers.get('authorization')!.slice(7).trim()
        : '');

    if (headerToken !== required) {
      return json({ success: false, error: 'Admin token required' }, 401);
    }
    return null;
  }

  const user = await config.getSessionUser(request);
  if (!user) {
    return json({ success: false, error: 'Unauthorized' }, 401);
  }
  return null;
}

function parseConfigBody(body: Record<string, unknown>) {
  const newEventPlatforms = Array.isArray(body.newEventPlatforms)
    ? body.newEventPlatforms.filter(
      (item): item is TicketSource => typeof item === 'string' && isTicketSource(item),
    )
    : undefined;

  const endingSoonDaysList = Array.isArray(body.endingSoonDaysList)
    ? body.endingSoonDaysList
      .map((item) => Number(item))
      .filter((item) => Number.isInteger(item) && item >= 1)
    : undefined;

  const feishuWebhookUrl = typeof body.feishuWebhookUrl === 'string'
    ? body.feishuWebhookUrl.trim()
    : body.feishuWebhookUrl === null
      ? null
      : undefined;

  const feishuSignSecret = typeof body.feishuSignSecret === 'string'
    ? body.feishuSignSecret.trim()
    : body.feishuSignSecret === null
      ? null
      : undefined;

  if (feishuWebhookUrl && !feishuWebhookUrl.startsWith('https://')) {
    throw new Error('feishuWebhookUrl must start with https://');
  }

  return {
    notificationsEnabled: typeof body.notificationsEnabled === 'boolean'
      ? body.notificationsEnabled
      : undefined,
    feishuWebhookUrl:
      feishuWebhookUrl !== undefined && !isMaskedValue(feishuWebhookUrl)
        ? feishuWebhookUrl
        : undefined,
    feishuSignSecret:
      feishuSignSecret !== undefined && !isMaskedValue(feishuSignSecret)
        ? feishuSignSecret
        : undefined,
    newEventEnabled: typeof body.newEventEnabled === 'boolean' ? body.newEventEnabled : undefined,
    newEventPlatforms,
    endingSoonEnabled: typeof body.endingSoonEnabled === 'boolean'
      ? body.endingSoonEnabled
      : undefined,
    endingSoonDaysList,
  };
}

function parseSources(searchParams: URLSearchParams): TicketSource[] | undefined {
  const fromMulti = searchParams.getAll('source');
  const fromComma = (searchParams.get('source') || '')
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean);
  const merged = Array.from(new Set([...fromMulti, ...fromComma]));
  const sources = merged.filter((item): item is TicketSource =>
    validSources.includes(item as TicketSource));
  return sources.length ? sources : undefined;
}

function parseStatus(value: string | null): TicketStatus | undefined {
  if (!value) return undefined;
  if (!validStatuses.includes(value as TicketStatus)) return undefined;
  return value as TicketStatus;
}

function parseLimit(value: string | null): number | undefined {
  if (!value) return undefined;
  const parsed = Number(value);
  if (!Number.isFinite(parsed) || parsed <= 0) return undefined;
  return Math.min(parsed, 100);
}

function parseSortByEndAtDesc(value: string | null): boolean | undefined {
  if (!value) return undefined;
  const normalized = value.toLowerCase();
  if (normalized === '1' || normalized === 'true' || normalized === 'yes') return true;
  if (normalized === '0' || normalized === 'false' || normalized === 'no') return false;
  return undefined;
}

export function createGetConfigHandler(config: TicketMonitorRouteConfig) {
  const ticketMonitorDb = createDb(config);
  return async () => {
    const cfg = await ticketMonitorDb.getConfigDto(true);
    return json({
      success: true,
      data: {
        ...cfg,
        availablePlatforms: TICKET_SOURCES,
      },
    });
  };
}

export function createUpdateConfigHandler(config: TicketMonitorRouteConfig) {
  const ticketMonitorDb = createDb(config);
  return async (request: Request) => {
    const unauthorized = await requireTicketAdmin(config, request);
    if (unauthorized) return unauthorized;

    try {
      const body = (await request.json()) as Record<string, unknown>;
      const parsed = parseConfigBody(body);
      await ticketMonitorDb.updateConfig(parsed);
      const masked = await ticketMonitorDb.getConfigDto(true);

      return json({
        success: true,
        data: {
          ...masked,
          availablePlatforms: TICKET_SOURCES,
        },
      });
    } catch (error) {
      return json(
        { success: false, error: error instanceof Error ? error.message : String(error) },
        400,
      );
    }
  };
}

export function createGetEventsHandler(config: TicketMonitorRouteConfig) {
  const ticketMonitorDb = createDb(config);
  return async (request: Request) => {
    const { searchParams } = new URL(request.url);

    const result = await getCachedTicketEvents(
      {
        q: searchParams.get('q')?.trim() || undefined,
        sources: parseSources(searchParams),
        status: parseStatus(searchParams.get('status')),
        sortByEndAtDesc: parseSortByEndAtDesc(searchParams.get('sortByEndAtDesc')),
        limit: parseLimit(searchParams.get('limit')),
      },
      ticketMonitorDb,
    );

    return json({
      success: true,
      data: result.events,
      meta: {
        total: result.events.length,
        errors: result.errors,
        fetchedAt: new Date().toISOString(),
        lastSyncAt: result.lastSyncAt ?? null,
        cacheHit: true,
      },
    });
  };
}

export function createCronSyncHandler(config: TicketMonitorRouteConfig) {
  const ticketMonitorDb = createDb(config);
  return async (request: Request) => {
    const unauthorized = verifyCronSecret(request);
    if (unauthorized) return unauthorized;

    const result = await syncTicketMonitorEvents(ticketMonitorDb);
    return json({ success: true, data: result });
  };
}

export function createGetSyncStatusHandler(config: TicketMonitorRouteConfig) {
  const ticketMonitorDb = createDb(config);
  return async () => {
    const latest = await ticketMonitorDb.getLatestSyncRun();
    return json({ success: true, data: latest });
  };
}

export function createTestNotificationHandler(config: TicketMonitorRouteConfig) {
  const ticketMonitorDb = createDb(config);
  return async (request: Request) => {
    const unauthorized = await requireTicketAdmin(config, request);
    if (unauthorized) return unauthorized;

    const cfg = await ticketMonitorDb.getConfigForNotify();
    let body: { feishuWebhookUrl?: string; feishuSignSecret?: string } = {};

    try {
      body = await request.json();
    } catch {
      body = {};
    }

    const webhookUrl = body.feishuWebhookUrl?.trim()
      || (isMaskedValue(cfg.feishuWebhookUrl) ? '' : cfg.feishuWebhookUrl?.trim())
      || '';

    if (!webhookUrl || !webhookUrl.startsWith('https://')) {
      return json({ success: false, error: '请提供有效的飞书 Webhook URL' }, 400);
    }

    const signSecret = body.feishuSignSecret?.trim()
      || (isMaskedValue(cfg.feishuSignSecret) ? undefined : cfg.feishuSignSecret);

    const result = await sendFeishuPostMessage(
      webhookUrl,
      buildTestMessage(),
      signSecret,
    );

    if (!result.success) {
      return json(
        { success: false, error: result.errorMessage || '发送失败' },
        502,
      );
    }

    return json({ success: true, data: { status: result.status } });
  };
}
