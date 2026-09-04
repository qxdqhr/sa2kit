import type {
  ApiEnvelope,
  CalendarEvent,
  CreateEventRequest,
  EventFormData,
  UpdateEventRequest,
} from './types';
import { parseLocalISOString, toLocalISOString } from './dateUtils';

export type CalendarApiConfig = {
  /** 子应用根 URL（本地 :3001 或网关 /calendar） */
  apiBaseUrl: string;
  fetch?: typeof fetch;
  credentials?: RequestCredentials;
  getHeaders?: () => HeadersInit | Promise<HeadersInit>;
  onUnauthorized?: () => void;
};

const defaultFetch: typeof fetch = (input, init) => fetch(input, init);

function parseWireEvent(raw: Record<string, unknown>): CalendarEvent {
  return {
    ...(raw as Omit<CalendarEvent, 'startTime' | 'endTime' | 'createdAt' | 'updatedAt'>),
    startTime: parseLocalISOString(String(raw.startTime)),
    endTime: parseLocalISOString(String(raw.endTime)),
    createdAt: parseLocalISOString(String(raw.createdAt)),
    updatedAt: parseLocalISOString(String(raw.updatedAt)),
  };
}

async function parseJson<T>(response: Response): Promise<T> {
  const payload = (await response.json()) as ApiEnvelope<T> | T;
  if (!response.ok) {
    const err =
      payload && typeof payload === 'object' && 'error' in payload
        ? String((payload as { error: string }).error)
        : `请求失败: ${response.status}`;
    throw new Error(err);
  }
  if (payload && typeof payload === 'object' && 'success' in payload) {
    const wrapped = payload as ApiEnvelope<T>;
    if (!wrapped.success) {
      throw new Error(wrapped.error || '请求失败');
    }
    return wrapped.data as T;
  }
  return payload as T;
}

function formToCreateRequest(eventData: EventFormData): CreateEventRequest {
  return {
    title: eventData.title,
    description: eventData.description,
    startTime: toLocalISOString(eventData.startTime),
    endTime: toLocalISOString(eventData.endTime),
    allDay: eventData.allDay,
    location: eventData.location,
    color: eventData.color,
    priority: eventData.priority,
  };
}

function formToUpdateRequest(eventData: Partial<EventFormData>): UpdateEventRequest {
  const patch: UpdateEventRequest = {};
  if (eventData.title !== undefined) patch.title = eventData.title;
  if (eventData.description !== undefined) patch.description = eventData.description;
  if (eventData.startTime !== undefined) patch.startTime = toLocalISOString(eventData.startTime);
  if (eventData.endTime !== undefined) patch.endTime = toLocalISOString(eventData.endTime);
  if (eventData.allDay !== undefined) patch.allDay = eventData.allDay;
  if (eventData.location !== undefined) patch.location = eventData.location;
  if (eventData.color !== undefined) patch.color = eventData.color;
  if (eventData.priority !== undefined) patch.priority = eventData.priority;
  return patch;
}

export class CalendarApiClient {
  private readonly base: string;
  private readonly fetchFn: typeof fetch;
  private readonly credentials: RequestCredentials;
  private readonly getHeaders?: CalendarApiConfig['getHeaders'];
  private readonly onUnauthorized?: CalendarApiConfig['onUnauthorized'];

  constructor(config: CalendarApiConfig) {
    this.base = config.apiBaseUrl.replace(/\/+$/, '');
    this.fetchFn = config.fetch ?? defaultFetch;
    this.credentials = config.credentials ?? 'same-origin';
    this.getHeaders = config.getHeaders;
    this.onUnauthorized = config.onUnauthorized;
  }

  private async request(input: string, init?: RequestInit): Promise<Response> {
    const extraHeaders = this.getHeaders ? await this.getHeaders() : undefined;
    const headers = new Headers(init?.headers);
    if (extraHeaders) {
      new Headers(extraHeaders).forEach((value: string, key: string) => headers.set(key, value));
    }
    const response = await this.fetchFn(input, {
      ...init,
      credentials: init?.credentials ?? this.credentials,
      headers,
    });
    if (response.status === 401) {
      this.onUnauthorized?.();
    }
    return response;
  }

  private url(path: string): string {
    const trimmed = path.replace(/^\/+/, '');
    const [pathname, search] = trimmed.split('?', 2);
    const apiPath = pathname.startsWith('api/calendar')
      ? `/${pathname}`
      : `/api/calendar/${pathname}`;
    const withSlash = apiPath.endsWith('/') ? apiPath : `${apiPath}/`;
    return search ? `${this.base}${apiPath}?${search}` : `${this.base}${withSlash}`;
  }

  async fetchEvents(startDate: Date, endDate: Date): Promise<CalendarEvent[]> {
    const params = new URLSearchParams({
      startDate: toLocalISOString(startDate),
      endDate: toLocalISOString(endDate),
    });
    const response = await this.request(this.url(`events?${params.toString()}`), {
      cache: 'no-store',
    });
    const data = await parseJson<Array<Record<string, unknown>>>(response);
    return data.map(parseWireEvent);
  }

  async fetchEvent(eventId: number): Promise<CalendarEvent> {
    const response = await this.request(this.url(`events/${eventId}`), { cache: 'no-store' });
    const data = await parseJson<Record<string, unknown>>(response);
    return parseWireEvent(data);
  }

  async createEvent(eventData: EventFormData): Promise<CalendarEvent> {
    const response = await this.request(this.url('events'), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(formToCreateRequest(eventData)),
    });
    const data = await parseJson<Record<string, unknown>>(response);
    return parseWireEvent(data);
  }

  async updateEvent(eventId: number, eventData: Partial<EventFormData>): Promise<CalendarEvent> {
    const response = await this.request(this.url(`events/${eventId}`), {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(formToUpdateRequest(eventData)),
    });
    const data = await parseJson<Record<string, unknown>>(response);
    return parseWireEvent(data);
  }

  async deleteEvent(eventId: number, deleteAll = false): Promise<void> {
    const response = await this.request(this.url(`events/${eventId}`), {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ deleteAll }),
    });
    await parseJson(response);
  }

  async batchDeleteEvents(eventIds: number[]): Promise<void> {
    const response = await this.request(this.url('events/batchDelete'), {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ eventIds }),
    });
    await parseJson(response);
  }
}
