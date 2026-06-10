import fs from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';

const BROWSER_ENTRIES = [
  'src/common/ossFile/client.ts',
  'src/common/ossFile/index.ts',
  'src/common/file/index.ts',
  'src/common/auth/index.ts',
  'src/common/auth/client/index.ts',
  'src/common/auth/hooks/index.ts',
  'src/common/auth/components/index.ts',
  'src/common/auth/rn/index.ts',
  'src/common/universalFile/client.ts',
];

const FORBIDDEN_PATTERNS = [
  /from\s+['"]ali-oss['"]/,
  /from\s+['"]postgres['"]/,
  /from\s+['"]node:crypto['"]/,
  /require\s*\(\s*['"]ali-oss['"]\s*\)/,
  /require\s*\(\s*['"]postgres['"]\s*\)/,
];

describe('common browser entries (R2-213)', () => {
  for (const relativePath of BROWSER_ENTRIES) {
    it(`${relativePath} must not statically import node-only deps`, () => {
      const absolutePath = path.join(process.cwd(), relativePath);
      const source = fs.readFileSync(absolutePath, 'utf8');
      for (const pattern of FORBIDDEN_PATTERNS) {
        expect(source).not.toMatch(pattern);
      }
    });
  }
});
