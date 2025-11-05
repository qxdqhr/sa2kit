import { describe, it, expect } from 'vitest';
import { fileUtils } from '../../src/utils';

describe('fileUtils', () => {
  describe('formatFileSize', () => {
    it('should format bytes correctly', () => {
      expect(fileUtils.formatFileSize(0)).toBe('0 Bytes');
      expect(fileUtils.formatFileSize(1024)).toBe('1 KB');
      expect(fileUtils.formatFileSize(1536000)).toBe('1.46 MB');
      expect(fileUtils.formatFileSize(1073741824)).toBe('1 GB');
    });
  });

  describe('getFileExtension', () => {
    it('should extract file extension', () => {
      expect(fileUtils.getFileExtension('document.pdf')).toBe('pdf');
      expect(fileUtils.getFileExtension('image.jpg')).toBe('jpg');
      expect(fileUtils.getFileExtension('archive.tar.gz')).toBe('gz');
    });

    it('should handle files without extension', () => {
      expect(fileUtils.getFileExtension('README')).toBe('');
    });
  });

  describe('generateUniqueFileName', () => {
    it('should generate unique filename', () => {
      const original = 'test.pdf';
      const result = fileUtils.generateUniqueFileName(original);
      expect(result).toContain('.pdf');
      expect(result).toContain('test');
    });

    it('should generate different names on each call', () => {
      const result1 = fileUtils.generateUniqueFileName('test.pdf');
      const result2 = fileUtils.generateUniqueFileName('test.pdf');
      expect(result1).not.toBe(result2);
    });
  });

  describe('isValidFilename', () => {
    it('should validate valid filenames', () => {
      expect(fileUtils.isValidFilename('document.pdf')).toBe(true);
      expect(fileUtils.isValidFilename('my-file_123.txt')).toBe(true);
    });

    it('should reject invalid filenames', () => {
      expect(fileUtils.isValidFilename('file<name>.txt')).toBe(false);
      expect(fileUtils.isValidFilename('file|name.txt')).toBe(false);
      expect(fileUtils.isValidFilename('')).toBe(false);
    });
  });
});

