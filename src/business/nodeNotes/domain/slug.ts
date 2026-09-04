export function slugifyTitle(title: string): string {
  const base = title
    .trim()
    .toLowerCase()
    .replace(/[^\p{L}\p{N}]+/gu, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80);
  return base || 'document';
}

export function uniqueSlug(base: string, existing: Set<string>): string {
  let slug = base;
  let i = 1;
  while (existing.has(slug)) {
    slug = `${base}-${i}`;
    i += 1;
  }
  existing.add(slug);
  return slug;
}
