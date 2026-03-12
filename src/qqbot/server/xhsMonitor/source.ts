import { XhsPost, XhsSource } from './types';

export interface XhsProfileHtmlSourceOptions {
  profileUrl: string;
  timeoutMs?: number;
  userAgent?: string;
}

function decodeHtmlEntities(input: string): string {
  return input
    .replace(/\\u003c/g, '<')
    .replace(/\\u003e/g, '>')
    .replace(/\\u0026/g, '&')
    .replace(/\\"/g, '"')
    .replace(/\\n/g, ' ')
    .trim();
}

function normalizeTitle(title: string): string {
  return decodeHtmlEntities(title).replace(/\s+/g, ' ').trim();
}

export class XhsProfileHtmlSource implements XhsSource {
  private readonly profileUrl: string;
  private readonly timeoutMs: number;
  private readonly userAgent: string;

  constructor(options: XhsProfileHtmlSourceOptions) {
    this.profileUrl = options.profileUrl;
    this.timeoutMs = options.timeoutMs ?? 12000;
    this.userAgent =
      options.userAgent ??
      'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/123.0 Safari/537.36';
  }

  async fetchLatestPosts(limit = 20): Promise<XhsPost[]> {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), this.timeoutMs);

    try {
      const response = await fetch(this.profileUrl, {
        method: 'GET',
        headers: {
          'User-Agent': this.userAgent,
          Accept: 'text/html,application/xhtml+xml',
        },
        signal: controller.signal,
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch profile page: HTTP ${response.status}`);
      }

      const html = await response.text();
      return this.parsePostsFromHtml(html, limit);
    } finally {
      clearTimeout(timer);
    }
  }

  private parsePostsFromHtml(html: string, limit: number): XhsPost[] {
    const idMatches = [...html.matchAll(/(?:\/explore\/|\"noteId\"\s*:\s*\")([a-zA-Z0-9_-]{8,32})/g)];
    const titleMatches = [...html.matchAll(/\"displayTitle\"\s*:\s*\"([^"]{1,120})\"/g)];

    const uniqueIds: string[] = [];
    const seen = new Set<string>();
    for (const match of idMatches) {
      const id = match[1];
      if (!id || seen.has(id)) {
        continue;
      }
      seen.add(id);
      uniqueIds.push(id);
      if (uniqueIds.length >= limit) {
        break;
      }
    }

    const titles = titleMatches.map((match) => normalizeTitle(match[1] ?? '')).filter(Boolean);

    return uniqueIds.map((id, index) => ({
      id,
      url: `https://www.xiaohongshu.com/explore/${id}`,
      title: titles[index],
    }));
  }
}
