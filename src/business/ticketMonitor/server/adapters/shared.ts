import type { TicketStatus } from '../../domain/types';

export const REQUEST_HEADERS: HeadersInit = {
  'user-agent':
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
  accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
  'accept-language': 'ja,en-US;q=0.9,en;q=0.8',
};

export function stripTags(input: string): string {
  return input
    .replace(/<[^>]*>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/\s+/g, ' ')
    .trim();
}

export function inferStatusByText(raw: string): TicketStatus {
  const text = raw.toLowerCase();
  if (/受付中|販売中|on\s?sale|available/.test(text)) return 'on_sale';
  if (/終了|sold\s?out|closed/.test(text)) return 'ended';
  if (/先行|抽選|upcoming|予定/.test(text)) return 'upcoming';
  return 'unknown';
}

export function parseIsoFromDateText(raw: string): string {
  const text = stripTags(raw);

  // 2026年07月24日
  let m = text.match(/(20\d{2})\s*年\s*(\d{1,2})\s*月\s*(\d{1,2})\s*日/);
  if (m) {
    const y = Number(m[1]);
    const mo = Number(m[2]) - 1;
    const d = Number(m[3]);
    return new Date(Date.UTC(y, mo, d, 0, 0, 0)).toISOString();
  }

  // 2026/3/31
  m = text.match(/(20\d{2})\s*\/\s*(\d{1,2})\s*\/\s*(\d{1,2})/);
  if (m) {
    const y = Number(m[1]);
    const mo = Number(m[2]) - 1;
    const d = Number(m[3]);
    return new Date(Date.UTC(y, mo, d, 0, 0, 0)).toISOString();
  }

  // fallback: now
  return new Date().toISOString();
}

export function statusFromDate(iso: string): TicketStatus {
  const when = new Date(iso).getTime();
  if (!Number.isFinite(when)) return 'unknown';
  return when >= Date.now() ? 'upcoming' : 'ended';
}
