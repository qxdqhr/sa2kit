import { describe, expect, it } from 'vitest';
import {
  buildModuleUploadPath,
  resolveUploadFolderPath,
  resolveUploadFolderPathFromFormData,
} from '../../src/ossFile/shared/path';

describe('resolveUploadFolderPath', () => {
  it('prefers folderPath over customPath', () => {
    expect(
      resolveUploadFolderPath({
        moduleId: 'm',
        fileName: 'a.jpg',
        folderPath: ' explicit/folder ',
        customPath: 'legacy/path',
      }),
    ).toBe('explicit/folder');
  });

  it('falls back to customPath when folderPath is empty', () => {
    expect(
      resolveUploadFolderPath({
        moduleId: 'm',
        fileName: 'a.jpg',
        folderPath: '   ',
        customPath: 'legacy/path',
      }),
    ).toBe('legacy/path');
  });

  it('generates module path when both aliases are missing', () => {
    const path = resolveUploadFolderPath({
      moduleId: 'showmasterpiece',
      businessId: 'artwork',
      fileName: 'photo.png',
    });
    expect(path.startsWith('showmasterpiece/artwork/')).toBe(true);
    expect(path.endsWith('.png')).toBe(true);
  });

  it('reads folderPath or customPath from FormData', () => {
    const formData = new FormData();
    formData.append('customPath', 'from-form/custom');
    expect(
      resolveUploadFolderPathFromFormData(formData, {
        moduleId: 'm',
        businessId: 'b',
        fileName: 'x.txt',
      }),
    ).toBe('from-form/custom');
  });
});

describe('buildModuleUploadPath', () => {
  it('includes module and business segments', () => {
    const path = buildModuleUploadPath({
      moduleId: 'fitnessPlan',
      businessId: 'diet',
      fileName: 'meal.jpeg',
    });
    expect(path).toMatch(/^fitnessPlan\/diet\/\d+_[a-z0-9]+\.jpeg$/);
  });
});
