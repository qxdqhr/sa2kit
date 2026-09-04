import type { MissionFormData } from '../domain';

export function parseMissionMarkdown(content: string): MissionFormData {
  const result: MissionFormData = {
    why: '',
    successLooksLike: [],
    constraints: [],
    outOfScope: [],
  };

  const sectionPattern = /^##\s+(.+)$/gm;
  const sections: Array<{ name: string; start: number; end: number }> = [];
  let match: RegExpExecArray | null;
  while ((match = sectionPattern.exec(content)) !== null) {
    sections.push({
      name: match[1].trim().toLowerCase(),
      start: match.index + match[0].length,
      end: content.length,
    });
  }
  for (let i = 0; i < sections.length; i += 1) {
    sections[i].end = i + 1 < sections.length ? sections[i + 1].start : content.length;
  }

  const readSection = (aliases: string[]): string => {
    const section = sections.find((s) => aliases.some((a) => s.name.includes(a)));
    if (!section) return '';
    return content.slice(section.start, section.end).trim();
  };

  const readList = (aliases: string[]): string[] => {
    const body = readSection(aliases);
    return body
      .split('\n')
      .map((line) => line.trim())
      .filter((line) => line.startsWith('- '))
      .map((line) => line.slice(2).trim())
      .filter(Boolean);
  };

  result.why = readSection(['why', '为何', '为什么']);
  result.successLooksLike = readList(['success']);
  result.constraints = readList(['constraints', '约束']);
  result.outOfScope = readList(['out of scope', '范围外', '不涵盖']);

  return result;
}

export function extractMissionWhySummary(content: string): string {
  const parsed = parseMissionMarkdown(content);
  const why = parsed.why.trim();
  if (why) return why.slice(0, 280);
  const firstLine = content
    .split('\n')
    .map((l) => l.trim())
    .find((l) => l && !l.startsWith('#'));
  return firstLine?.slice(0, 280) || '';
}
