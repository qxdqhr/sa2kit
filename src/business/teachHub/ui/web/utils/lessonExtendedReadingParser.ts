/** 从课时 HTML 的「延伸阅读」区块提取外链 */

const SECTION_HEADING_RE =
  /<h([1-3])[^>]*>\s*([^<]*(?:延伸阅读|扩展阅读|Further\s*Reading)[^<]*)\s*<\/h\1>/i;

const ANCHOR_RE = /<a[^>]+href=["'](https?:\/\/[^"'#]+[^"']*)["'][^>]*>([\s\S]*?)<\/a>/gi;

const PLAIN_URL_RE = /(?<![="'])(https?:\/\/[^\s<>"']+)/g;

export type ExtendedReadingLink = {
  title: string;
  url: string;
};

function stripHtmlText(html: string): string {
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, '')
    .replace(/<style[\s\S]*?<\/style>/gi, '')
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function sliceExtendedReadingSection(html: string): string | null {
  const match = SECTION_HEADING_RE.exec(html);
  if (!match) return null;

  const level = Number(match[1]);
  const start = match.index + match[0].length;
  const rest = html.slice(start);
  const nextHeadingRe = new RegExp(`<h[1-${level}][^>]*>`, 'i');
  const nextMatch = nextHeadingRe.exec(rest);
  return nextMatch ? rest.slice(0, nextMatch.index) : rest;
}

function decodeAnchorTitle(inner: string): string {
  const text = stripHtmlText(inner);
  return text || '';
}

export function extractExtendedReadingLinks(html: string): ExtendedReadingLink[] {
  const section = sliceExtendedReadingSection(html);
  if (!section) return [];

  const seen = new Set<string>();
  const links: ExtendedReadingLink[] = [];

  const add = (url: string, title: string) => {
    const normalized = url.trim();
    if (!normalized || seen.has(normalized)) return;
    seen.add(normalized);
    const cleanTitle = title.trim() || normalized;
    links.push({ title: cleanTitle, url: normalized });
  };

  let anchorMatch: RegExpExecArray | null;
  const anchorSection = section;
  ANCHOR_RE.lastIndex = 0;
  while ((anchorMatch = ANCHOR_RE.exec(anchorSection)) !== null) {
    add(anchorMatch[1], decodeAnchorTitle(anchorMatch[2]));
  }

  const textOnly = stripHtmlText(section);
  PLAIN_URL_RE.lastIndex = 0;
  let urlMatch: RegExpExecArray | null;
  while ((urlMatch = PLAIN_URL_RE.exec(textOnly)) !== null) {
    const url = urlMatch[1];
    if (!seen.has(url)) {
      add(url, url);
    }
  }

  return links;
}
