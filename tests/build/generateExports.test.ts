import { describe, expect, it } from 'vitest';
import {
  buildExportEntry,
  entryKeyToDistBase,
  entryKeyToSubpath,
} from '../../scripts/generate-exports.mjs';

describe('generate-exports helpers', () => {
  it('maps entry keys to npm subpaths', () => {
    expect(entryKeyToSubpath('index')).toBe('.');
    expect(entryKeyToSubpath('common/file/index')).toBe('./common/file');
    expect(entryKeyToSubpath('calendar/server')).toBe('./calendar/server');
  });

  it('maps entry keys to dist bases', () => {
    expect(entryKeyToDistBase('ossFile/server/index')).toBe(
      'dist/ossFile/server/index',
    );
    expect(entryKeyToDistBase('calendar/server')).toBe('dist/calendar/server');
  });

  it('builds conditional export triple', () => {
    expect(buildExportEntry('logger/index')).toEqual({
      types: './dist/logger/index.d.ts',
      import: './dist/logger/index.mjs',
      require: './dist/logger/index.js',
    });
  });
});
