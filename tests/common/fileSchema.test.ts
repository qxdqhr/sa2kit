import { describe, expect, it } from 'vitest';
import { fileMetadata, fileFolders } from '../../src/common/file/schema';

describe('common/file/schema (R2-206)', () => {
  it('exports drizzle table definitions', () => {
    expect(fileMetadata).toBeTruthy();
    expect(fileFolders).toBeTruthy();
  });
});
