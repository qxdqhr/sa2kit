export type SkillFrontmatterData = {
  name: string;
  description: string;
  tags: string;
};

export function parseSkillFrontmatter(content: string): { data: SkillFrontmatterData; body: string; hasFrontmatter: boolean } {
  const defaultData: SkillFrontmatterData = {
    name: '',
    description: '',
    tags: '',
  };

  if (!content.startsWith('---\n')) {
    return { data: defaultData, body: content, hasFrontmatter: false };
  }

  const endIndex = content.indexOf('\n---\n', 4);
  if (endIndex === -1) {
    return { data: defaultData, body: content, hasFrontmatter: false };
  }

  const fmText = content.slice(4, endIndex);
  const body = content.slice(endIndex + 5);
  const data = { ...defaultData };

  for (const line of fmText.split('\n')) {
    const idx = line.indexOf(':');
    if (idx <= 0) continue;
    const key = line.slice(0, idx).trim();
    const value = line.slice(idx + 1).trim();
    if (key === 'name') data.name = value;
    if (key === 'description') data.description = value;
    if (key === 'tags') data.tags = value;
  }

  return { data, body, hasFrontmatter: true };
}

export function validateSkillFrontmatter(data: SkillFrontmatterData): string | null {
  const name = data.name.trim();
  const description = data.description.trim();
  if (!name) return 'frontmatter.name 不能为空';
  if (!/^[a-z0-9-]{1,64}$/.test(name)) return 'frontmatter.name 需符合 ^[a-z0-9-]{1,64}$';
  if (!description) return 'frontmatter.description 不能为空';
  if (description.length > 1024) return 'frontmatter.description 长度不能超过 1024';
  return null;
}

export function validateSkillMarkdownContent(content: string): string | null {
  if (!content.trim()) return 'SKILL.md 内容不能为空';
  if (content.length > 500_000) return 'SKILL.md 内容过大，超过 500KB';
  const parsed = parseSkillFrontmatter(content);
  if (!parsed.hasFrontmatter) return 'SKILL.md 必须包含合法的 frontmatter（--- 包裹）';
  return validateSkillFrontmatter(parsed.data);
}
