import type { LearningRecord, LearningRecordSection } from '../types';
import { lessonTitleFromSlug } from '../routes';

const RECORD_FILENAME_PATTERN = /^(\d{4})-(.+)\.md$/i;

export function parseLearningRecordPath(relativePath: string): {
  order: number;
  slug: string;
} | null {
  const base = relativePath.split('/').pop() || relativePath;
  const match = base.match(RECORD_FILENAME_PATTERN);
  if (!match) return null;
  const order = Number.parseInt(match[1], 10);
  if (!Number.isFinite(order)) return null;
  return { order, slug: `${match[1]}-${match[2]}` };
}

function parseTitleLine(content: string): string {
  const line = content
    .split('\n')
    .map((l) => l.trim())
    .find((l) => l.startsWith('# '));
  if (!line) return '';
  return line.slice(2).trim();
}

function parseSections(content: string): LearningRecordSection[] {
  const sectionPattern = /^##\s+(.+)$/gm;
  const matches: Array<{ heading: string; start: number; end: number }> = [];
  let match: RegExpExecArray | null;
  while ((match = sectionPattern.exec(content)) !== null) {
    matches.push({
      heading: match[1].trim(),
      start: match.index + match[0].length,
      end: content.length,
    });
  }
  for (let i = 0; i < matches.length; i += 1) {
    matches[i].end = i + 1 < matches.length ? matches[i + 1].start : content.length;
  }

  if (matches.length === 0) {
    const body = content
      .split('\n')
      .filter((line) => !line.trim().startsWith('#'))
      .join('\n')
      .trim();
    return body ? [{ heading: '内容', content: body }] : [];
  }

  return matches.map((section) => ({
    heading: section.heading,
    content: content.slice(section.start, section.end).trim(),
  }));
}

export function parseLearningRecordMarkdown(
  content: string,
  relativePath: string,
): LearningRecord {
  const parsedPath = parseLearningRecordPath(relativePath);
  const order = parsedPath?.order ?? 0;
  const slug = parsedPath?.slug ?? relativePath;
  const title = parseTitleLine(content) || lessonTitleFromSlug(slug);

  return {
    order,
    slug,
    relativePath,
    title,
    sections: parseSections(content),
  };
}

export function recordSummary(record: LearningRecord, maxLength = 120): string {
  const first = record.sections.find((section) => section.content.trim());
  if (!first) return '暂无摘要';
  const text = first.content.replace(/\s+/g, ' ').trim();
  if (text.length <= maxLength) return text;
  return `${text.slice(0, maxLength)}…`;
}

export function composeLearningRecordMarkdown(record: LearningRecord): string {
  const title = record.title.trim() || lessonTitleFromSlug(record.slug);
  const lines = [`# ${title}`, ''];

  const sections = record.sections.filter(
    (section) => section.heading.trim() || section.content.trim(),
  );

  if (sections.length === 0) {
    lines.push('（暂无内容）', '');
    return lines.join('\n');
  }

  for (const section of sections) {
    lines.push(`## ${section.heading.trim() || '内容'}`, '', section.content.trim(), '');
  }

  return `${lines.join('\n').trimEnd()}\n`;
}

export function listReferenceSlugs(
  files: Array<{ relativePath: string }>,
): string[] {
  return files
    .filter(
      (f) => f.relativePath.startsWith('reference/') && f.relativePath.endsWith('.html'),
    )
    .map((f) => f.relativePath.replace(/^reference\//, '').replace(/\.html$/i, ''))
    .sort();
}
