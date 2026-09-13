import type { TicketEvent } from '../../domain/types';
import { REQUEST_HEADERS } from './shared';

const ASOBI_TICKET_API_URL = 'https://asobi-ticket.api.app.t-riple.com/api/v1/public/receptions';
const ASOBI_TICKET_BOOTHS_API_URL = 'https://asobi-ticket.api.app.t-riple.com/api/v1/public/booths';
const ASOBI_TICKET_BASE_URL = 'https://asobiticket2.asobistore.jp';

type ReceptionStatus = 'before_entry_period' | 'within_entry_period' | 'after_entry_period' | string;

interface AsobiReceptionItem {
  id: string;
  relationships?: {
    tour?: {
      data?: {
        id?: string;
      } | null;
    };
    booth?: {
      data?: {
        id?: string;
      } | null;
    };
    cover_image?: {
      data?: {
        id?: string;
      } | null;
    };
  };
  attributes?: {
    name?: string;
    entry_period_status?: ReceptionStatus;
    entry_period_starts_at?: string | null;
    entry_period_ends_at?: string | null;
    status?: string;
    entry_type?: string;
    winning_type?: string;
    top_body?: string;
    main_body?: string;
  };
}

interface AsobiBoothItem {
  id: string;
  attributes?: {
    name?: string;
  };
  relationships?: {
    cover_image?: {
      data?: {
        id?: string;
      } | null;
    };
  };
}

interface AsobiReceptionResponse {
  data?: AsobiReceptionItem[];
  included?: Array<
    {
      id: string;
      type: 'image';
      attributes?: {
        reading_urls?: {
          medium?: string;
          large?: string;
          original?: string;
          small?: string;
        };
      };
    }
    | {
      id: string;
      type: 'tour';
      attributes?: {
        name?: string;
      };
      relationships?: {
        booth?: {
          data?: {
            id?: string;
          } | null;
        };
      };
    }
  >;
}

interface AsobiBoothResponse {
  data?: AsobiBoothItem[];
  included?: Array<{
    id: string;
    type: string;
    attributes?: {
      reading_urls?: {
        medium?: string;
        large?: string;
        original?: string;
        small?: string;
      };
    };
  }>;
}

function mapReceptionStatus(status?: ReceptionStatus): TicketEvent['status'] {
  if (status === 'within_entry_period') return 'on_sale';
  if (status === 'before_entry_period') return 'upcoming';
  if (status === 'after_entry_period') return 'ended';
  return 'unknown';
}

function splitReceptionTitle(raw?: string): { receptionTitle?: string; seatInfo?: string } {
  const name = raw?.trim();
  if (!name) return {};

  const m = name.match(/^(.*?)\s*[【\[]\s*(.*?)\s*[】\]]\s*$/);
  if (m) {
    return {
      receptionTitle: m[1]?.trim() || name,
      seatInfo: m[2]?.trim() || undefined,
    };
  }

  return { receptionTitle: name };
}

function pickImageFromReadingUrls(urls?: {
  medium?: string;
  large?: string;
  original?: string;
  small?: string;
}): string | undefined {
  return urls?.medium || urls?.large || urls?.original || urls?.small;
}

function parseFirstImageFromHtml(raw?: string): string | undefined {
  if (!raw) return undefined;
  const src =
    raw.match(/<img[^>]+src="([^"]+)"/i)?.[1]
    || raw.match(/<img[^>]+data-src="([^"]+)"/i)?.[1]
    || raw.match(/<img[^>]+src='([^']+)'/i)?.[1]
    || raw.match(/<img[^>]+data-src='([^']+)'/i)?.[1];
  if (!src) return undefined;
  if (src.startsWith('http')) return src;
  if (src.startsWith('//')) return `https:${src}`;
  if (src.startsWith('/')) return `${ASOBI_TICKET_BASE_URL}${src}`;
  return src;
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

export async function asobistoreAdapter(): Promise<TicketEvent[]> {
  const fetchedAt = new Date().toISOString();

  const [response, boothsResponse] = await Promise.all([
    fetch(ASOBI_TICKET_API_URL, {
      headers: REQUEST_HEADERS,
      next: { revalidate: 300 },
    }),
    fetch(ASOBI_TICKET_BOOTHS_API_URL, {
      headers: REQUEST_HEADERS,
      next: { revalidate: 300 },
    }).catch(() => null),
  ]);

  if (!response.ok) {
    throw new Error(`asobiticket2 receptions fetch failed: ${response.status}`);
  }

  const payload = (await response.json()) as AsobiReceptionResponse;
  const data = Array.isArray(payload.data) ? payload.data : [];
  const included = Array.isArray(payload.included) ? payload.included : [];
  const receptionImageById = new Map<string, string>();
  const tourToBoothId = new Map<string, string>();
  const tourNameById = new Map<string, string>();

  included.forEach((item) => {
    if (item.type === 'tour') {
      const boothId = item.relationships?.booth?.data?.id;
      if (item.id && boothId) {
        tourToBoothId.set(item.id, boothId);
      }
      // Tour name is the real performance title we want to show on cards.
      const tourName = item.attributes?.name?.trim();
      if (item.id && tourName) {
        tourNameById.set(item.id, tourName);
      }
      return;
    }

    if (item.type === 'image' && item.id) {
      const cover = pickImageFromReadingUrls(item.attributes?.reading_urls);
      if (cover) {
        receptionImageById.set(item.id, cover);
      }
    }
  });

  const boothCoverByBoothId = new Map<string, string>();
  const boothNameById = new Map<string, string>();
  if (boothsResponse?.ok) {
    const boothsPayload = (await boothsResponse.json()) as AsobiBoothResponse;
    const booths = Array.isArray(boothsPayload.data) ? boothsPayload.data : [];
    const boothIncluded = Array.isArray(boothsPayload.included) ? boothsPayload.included : [];
    const boothImageById = new Map<string, string>();

    boothIncluded.forEach((item) => {
      if (item.type !== 'image' || !item.id) return;
      const cover = pickImageFromReadingUrls(item.attributes?.reading_urls);
      if (cover) {
        boothImageById.set(item.id, cover);
      }
    });

    booths.forEach((booth) => {
      const boothName = booth.attributes?.name?.trim();
      if (booth.id && boothName) {
        boothNameById.set(booth.id, boothName);
      }

      const boothCoverId = booth.relationships?.cover_image?.data?.id;
      if (!boothCoverId || !booth.id) return;
      const boothCover = boothImageById.get(boothCoverId);
      if (boothCover) {
        boothCoverByBoothId.set(booth.id, boothCover);
      }
    });
  }

  const events = data
    .map((item): TicketEvent | null => {
      const receptionName = item.attributes?.name?.trim();

      const ticketOpenAt = item.attributes?.entry_period_starts_at || fetchedAt;
      const ticketEndAt = item.attributes?.entry_period_ends_at || undefined;
      const entryType = item.attributes?.entry_type;
      const winningType = item.attributes?.winning_type;
      const publishStatus = item.attributes?.status;
      const coverImageId = item.relationships?.cover_image?.data?.id;
      const directBoothId = item.relationships?.booth?.data?.id;
      const tourId = item.relationships?.tour?.data?.id;
      const boothIdFromTour = tourId ? tourToBoothId.get(tourId) : undefined;
      const tourName = tourId ? tourNameById.get(tourId) : undefined;
      const boothName = (directBoothId ? boothNameById.get(directBoothId) : undefined)
        || (boothIdFromTour ? boothNameById.get(boothIdFromTour) : undefined);
      const title = tourName || boothName || receptionName;
      if (!title) return null;
      const receptionParts = splitReceptionTitle(receptionName);

      const coverImage = (
        (coverImageId ? receptionImageById.get(coverImageId) : undefined)
        || (directBoothId ? boothCoverByBoothId.get(directBoothId) : undefined)
        || (boothIdFromTour ? boothCoverByBoothId.get(boothIdFromTour) : undefined)
        || parseFirstImageFromHtml(item.attributes?.top_body)
        || parseFirstImageFromHtml(item.attributes?.main_body)
      );

      return {
        id: `asobiticket2-reception-${item.id}`,
        title,
        receptionTitle: receptionParts.receptionTitle,
        seatInfo: receptionParts.seatInfo,
        source: 'asobistore',
        ticketOpenAt,
        ticketEndAt,
        status: mapReceptionStatus(item.attributes?.entry_period_status),
        eventUrl: `${ASOBI_TICKET_BASE_URL}/receptions/${item.id}`,
        coverImage,
        tags: [
          'asobiticket2',
          'reception',
          entryType,
          winningType,
          publishStatus,
          receptionName ? `reception:${receptionName}` : undefined,
        ].filter((tag): tag is string => Boolean(tag)),
        fetchedAt,
      };
    })
    .filter((item): item is TicketEvent => item !== null);

  const enriched = await Promise.all(
    events.map(async (event) => {
      if (event.coverImage) return event;
      const coverImage = await fetchDetailImage(event.eventUrl);
      return coverImage ? { ...event, coverImage } : event;
    }),
  );

  return enriched;
}
