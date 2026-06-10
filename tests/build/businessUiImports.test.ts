import fs from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';

const BUSINESS_DIRS = [
  'src/business',
  'src/business/calendar',
  'src/business/portfolio',
  'src/business/profile',
  'src/business/testField',
];

const BARREL_IMPORT = /from\s+['"]@\/components['"]/;

function collectTsFiles(dir: string): string[] {
  const abs = path.join(process.cwd(), dir);
  if (!fs.existsSync(abs)) {
    return [];
  }
  const out: string[] = [];
  for (const entry of fs.readdirSync(abs, { withFileTypes: true })) {
    const child = path.join(abs, entry.name);
    if (entry.isDirectory()) {
      out.push(...collectTsFiles(path.relative(process.cwd(), child)));
    } else if (/\.(ts|tsx)$/.test(entry.name)) {
      out.push(path.relative(process.cwd(), child));
    }
  }
  return out;
}

describe('business UI imports (R2-404)', () => {
  it('business 子域不得整包 import @/components', () => {
    const offenders: string[] = [];
    for (const dir of BUSINESS_DIRS) {
      for (const file of collectTsFiles(dir)) {
        if (file.includes('/ui/defaultComponents')) {
          continue;
        }
        const source = fs.readFileSync(path.join(process.cwd(), file), 'utf8');
        if (BARREL_IMPORT.test(source)) {
          offenders.push(file);
        }
      }
    }
    expect(offenders).toEqual([]);
  });
});
