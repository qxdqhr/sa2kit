import type { TicketEvent } from '../../domain/types';
import { REQUEST_HEADERS, inferStatusByText, parseIsoFromDateText, statusFromDate, stripTags } from './shared';

const EPLUS_URL = 'https://eplus.jp/sf/live/anime';

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
  return `https://eplus.jp${src}`;
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

export async function eplusAdapter(): Promise<TicketEvent[]> {
  const fetchedAt = new Date().toISOString();

  const response = await fetch(EPLUS_URL, {
    headers: REQUEST_HEADERS,
    next: { revalidate: 300 },
  });

  if (!response.ok) {
    throw new Error(`eplus fetch failed: ${response.status}`);
  }

  const html = await response.text();

  const blocks = [...html.matchAll(/<a class="ticket-item[\s\S]*?<\/a>/g)].slice(0, 20);

  const events = blocks.map((match, index): TicketEvent | null => {
    const block = match[0];
    const href = block.match(/href="([^"]+)"/)?.[1];
    const coverImage = extractImage(block);
    const titleRaw = block.match(/<h3 class="ticket-item__title">([\s\S]*?)<\/h3>/)?.[1] || '';
    const dateRaw = block.match(/<p class="ticket-item__date">([\s\S]*?)<\/p>/)?.[1] || '';
    const venueRaw = block.match(/<div class="ticket-item__venue">([\s\S]*?)<\/div>/)?.[1] || '';
    const statusRaw = block.match(/<div class="ticket-item__status">([\s\S]*?)<\/div>/)?.[1] || '';

    const title = stripTags(titleRaw);
    if (!title || !href) return null;

    const ticketOpenAt = parseIsoFromDateText(dateRaw);
    const parsedStatus = inferStatusByText(statusRaw);

    return {
      id: `eplus-${index}-${encodeURIComponent(title).slice(0, 60)}`,
      title,
      source: 'eplus',
      ticketOpenAt,
      status: parsedStatus === 'unknown' ? statusFromDate(ticketOpenAt) : parsedStatus,
      eventUrl: href.startsWith('http') ? href : `https://eplus.jp${href}`,
      coverImage,
      location: stripTags(venueRaw) || undefined,
      tags: ['anime', '声优', 'eplus'],
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
