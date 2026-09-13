import type { TicketEvent } from '../../domain/types';
import { REQUEST_HEADERS, inferStatusByText, parseIsoFromDateText, statusFromDate, stripTags } from './shared';

const LAWSON_TICKET_URL = 'https://l-tike.com/';

function toAbsoluteUrl(raw: string): string {
  if (raw.startsWith('http')) return raw;
  if (raw.startsWith('//')) return `https:${raw}`;
  try {
    return new URL(raw, LAWSON_TICKET_URL).toString();
  } catch {
    return LAWSON_TICKET_URL;
  }
}

export async function lawsonTicketAdapter(): Promise<TicketEvent[]> {
  const fetchedAt = new Date().toISOString();

  const response = await fetch(LAWSON_TICKET_URL, {
    headers: REQUEST_HEADERS,
    next: { revalidate: 300 },
    signal: AbortSignal.timeout(8000),
  });

  if (!response.ok) {
    throw new Error(`lawsonticket fetch failed: ${response.status}`);
  }

  const html = await response.text();
  const anchorMatches = [...html.matchAll(/<a[^>]+href="([^"]+)"[^>]*>([\s\S]*?)<\/a>/gi)];

  const seen = new Set<string>();
  const events: TicketEvent[] = [];

  for (const match of anchorMatches) {
    if (events.length >= 20) break;

    const href = match[1] || '';
    const body = match[2] || '';
    const text = stripTags(body);

    if (!text || text.length < 6 || text.length > 120) continue;
    if (!/(先行|受付|発売|公演|ライブ|コンサート|チケット|イベント)/.test(text)) continue;
    if (!/(\/order\/|\/concert\/|\/event\/|\/playguide\/|\/ticket\/)/.test(href)) continue;

    const eventUrl = toAbsoluteUrl(href);
    const uniqueKey = `${text}::${eventUrl}`;
    if (seen.has(uniqueKey)) continue;
    seen.add(uniqueKey);

    const imageRaw = body.match(/<img[^>]+src="([^"]+)"/i)?.[1];
    const dateRaw = body.match(/(20\d{2}[\/年]\s*\d{1,2}[\/月]\s*\d{1,2})/)?.[1] || text;
    const ticketOpenAt = parseIsoFromDateText(dateRaw);
    const parsedStatus = inferStatusByText(text);

    events.push({
      id: `lawsonticket-${encodeURIComponent(uniqueKey).slice(0, 80)}`,
      title: text,
      source: 'lawsonticket',
      ticketOpenAt,
      status: parsedStatus === 'unknown' ? statusFromDate(ticketOpenAt) : parsedStatus,
      eventUrl,
      coverImage: imageRaw ? toAbsoluteUrl(imageRaw) : undefined,
      tags: ['lawsonticket'],
      fetchedAt,
    });
  }

  if (!events.length) {
    throw new Error('lawsonticket parse failed: no events found');
  }

  return events;
}
