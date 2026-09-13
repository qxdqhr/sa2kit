import { ticketMonitorApiPath } from '../../../domain/ticketMonitorApiPath';
import type {
  SyncStatusSummary,
  TicketMonitorConfigDto,
  TicketSource,
} from '../../../domain/types';

const ADMIN_TOKEN_KEY = 'ticket-monitor-admin-token';

function adminHeaders(): HeadersInit {
  const token = typeof window !== 'undefined'
    ? sessionStorage.getItem(ADMIN_TOKEN_KEY)?.trim()
    : '';
  if (!token) return {};
  return { 'x-ticket-monitor-admin-token': token };
}

async function parseJson<T>(response: Response): Promise<T> {
  const data = await response.json();
  if (!response.ok) {
    throw new Error((data as { error?: string }).error || `request failed: ${response.status}`);
  }
  return data as T;
}

export function saveAdminToken(token: string) {
  sessionStorage.setItem(ADMIN_TOKEN_KEY, token.trim());
}

export function getAdminToken(): string {
  return sessionStorage.getItem(ADMIN_TOKEN_KEY)?.trim() || '';
}

export async function fetchTicketConfig(): Promise<TicketMonitorConfigDto & { availablePlatforms: TicketSource[] }> {
  const response = await fetch(ticketMonitorApiPath('config'), { cache: 'no-store' });
  const data = await parseJson<{ success: boolean; data: TicketMonitorConfigDto & { availablePlatforms: TicketSource[] } }>(response);
  return data.data;
}

export async function saveTicketConfig(payload: Record<string, unknown>): Promise<TicketMonitorConfigDto> {
  const response = await fetch(ticketMonitorApiPath('config'), {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      ...adminHeaders(),
    },
    body: JSON.stringify(payload),
  });
  const data = await parseJson<{ success: boolean; data: TicketMonitorConfigDto }>(response);
  return data.data;
}

export async function testFeishuNotification(payload: {
  feishuWebhookUrl?: string;
  feishuSignSecret?: string;
}): Promise<void> {
  const response = await fetch(ticketMonitorApiPath('notifications/test'), {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...adminHeaders(),
    },
    body: JSON.stringify(payload),
  });
  await parseJson(response);
}

export async function fetchSyncStatus(): Promise<SyncStatusSummary | null> {
  const response = await fetch(ticketMonitorApiPath('sync-status'), { cache: 'no-store' });
  const data = await parseJson<{ success: boolean; data: SyncStatusSummary | null }>(response);
  return data.data;
}
