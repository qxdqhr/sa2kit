import { describe, expect, it } from 'vitest';
import {
  buildBrowserNodeConditionalExport,
  buildExportEntry,
  buildNodeOnlyExport,
  generateExportsFromEntryKeys,
} from '../../scripts/generate-exports.mjs';

describe('generate-exports helpers', () => {
  it('maps entry keys to npm subpaths', async () => {
    const { entryKeyToSubpath } = await import('../../scripts/generate-exports.mjs');
    expect(entryKeyToSubpath('index')).toBe('.');
    expect(entryKeyToSubpath('common/file/index')).toBe('./common/file');
    expect(entryKeyToSubpath('calendar/server')).toBe('./calendar/server');
  });

  it('builds flat export triple', () => {
    expect(buildExportEntry('logger/index')).toEqual({
      types: './dist/logger/index.d.ts',
      import: './dist/logger/index.mjs',
      require: './dist/logger/index.js',
    });
  });

  it('builds browser/node conditional exports (R2-212)', () => {
    const entry = buildBrowserNodeConditionalExport(
      'common/auth/index',
      'common/auth/server/index',
    );
    expect(entry.browser?.import).toBe('./dist/common/auth/index.mjs');
    expect(entry.node?.import).toBe('./dist/common/auth/server/index.mjs');
    expect(entry.default?.import).toBe('./dist/common/auth/index.mjs');
  });

  it('builds node-only server subpath export', () => {
    const entry = buildNodeOnlyExport('common/file/server/index');
    expect(entry.node?.import).toBe('./dist/common/file/server/index.mjs');
    expect(entry.import).toBeUndefined();
  });

  it('merges browser/server pairs when generating exports map', () => {
    const map = generateExportsFromEntryKeys([
      'common/auth/index',
      'common/auth/server/index',
      'logger/index',
    ]);
    expect(map['./common/auth'].browser).toBeTruthy();
    expect(map['./common/auth/server'].node).toBeTruthy();
    expect(map['./logger'].import).toBe('./dist/logger/index.mjs');
  });
});
