import type { TicketEvent } from '../../domain/types';
import { REQUEST_HEADERS, parseIsoFromDateText, statusFromDate, stripTags } from './shared';

const PIAPRO_EVENT_URL = 'https://piapro.net/event';

function extractImage(block: string): string | undefined {
  const src =
    block.match(/<img[^>]+src="([^"]+)"/i)?.[1]
    || block.match(/<img[^>]+data-src="([^"]+)"/i)?.[1]
    || block.match(/<img[^>]+src='([^']+)'/i)?.[1]
    || block.match(/<img[^>]+data-src='([^']+)'/i)?.[1]
    || block.match(/<img[^>]+srcset="([^"]+)"/i)?.[1]?.split(',')?.[0]?.trim()?.split(/\s+/)?.[0];
  if (!src) return undefined;
  if (src.startsWith('http')) return src;
  if (src.startsWith('//')) return `https:${src}`;
  return `https://piapro.net${src}`;
}

function normalizeImageUrl(raw: string, baseUrl: string): string {
  if (raw.startsWith('http')) return raw;
  if (raw.startsWith('//')) return `https:${raw}`;
  try {
    return new URL(raw, baseUrl).toString();
  } catch {
    return raw;
  }
}

async function fetchDetailImage(url: string): Promise<string | undefined> {
  try {
    const response = await fetch(url, {
      headers: REQUEST_HEADERS,
      next: { revalidate: 300 },
      signal: AbortSignal.timeout(5000),
    });
    if (!response.ok) return undefined;
    const html = await response.text();
    const raw =
      html.match(/<meta[^>]+property=["']og:image["'][^>]+content=["']([^"']+)["']/i)?.[1]
      || html.match(/<meta[^>]+name=["']twitter:image["'][^>]+content=["']([^"']+)["']/i)?.[1]
      || html.match(/<link[^>]+rel=["']image_src["'][^>]+href=["']([^"']+)["']/i)?.[1]
      || html.match(/"image"\s*:\s*"([^"]+)"/i)?.[1];
    return raw ? normalizeImageUrl(raw, url) : undefined;
  } catch {
    return undefined;
  }
}

export async function piaproAdapter(): Promise<TicketEvent[]> {
  const fetchedAt = new Date().toISOString();

  const response = await fetch(PIAPRO_EVENT_URL, {
    headers: REQUEST_HEADERS,
    next: { revalidate: 300 },
  });

  if (!response.ok) {
    throw new Error(`piapro fetch failed: ${response.status}`);
  }

  const html = await response.text();

  const blocks = [...html.matchAll(/<li class="clearfix ev_concert">([\s\S]*?)<\/li>/g)].slice(0, 20);

  const events = blocks.map((match, index): TicketEvent | null => {
    const block = match[1];
    const coverImage = extractImage(block);
    const title = stripTags(block.match(/<h2 class="event_title">([\s\S]*?)<\/h2>/)?.[1] || '');
    const day = stripTags(block.match(/<p class="event_day">([\s\S]*?)<\/p>/)?.[1] || '');
    const venue = stripTags(block.match(/<p class="event_venue">([\s\S]*?)<\/p>/)?.[1] || '');
    const url = block.match(/<p class="event_link">[\s\S]*?<a href="([^"]+)"/)?.[1];

    if (!title || !url) return null;

    const ticketOpenAt = parseIsoFromDateText(day);

    return {
      id: `piapro-${index}-${encodeURIComponent(title).slice(0, 60)}`,
      title,
      source: 'piapro',
      ticketOpenAt,
      status: statusFromDate(ticketOpenAt),
      eventUrl: url,
      coverImage,
      location: venue.replace(/^会場：/, '').trim() || undefined,
      tags: ['piapro', '初音未来'],
      fetchedAt,
    };
  }).filter((item): item is TicketEvent => item !== null);

  const enriched = await Promise.all(
    events.map(async (event) => {
      if (event.coverImage) return event;
      const coverImage = await fetchDetailImage(event.eventUrl);
      return coverImage ? { ...event, coverImage } : event;
    }),
  );

  return enriched;
}
