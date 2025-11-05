import { describe, it, expect } from 'vitest';
import { validators } from '../../src/utils';

describe('validators', () => {
  describe('isValidEmail', () => {
    it('should validate valid emails', () => {
      expect(validators.isValidEmail('test@example.com')).toBe(true);
      expect(validators.isValidEmail('user.name@domain.co.uk')).toBe(true);
    });

    it('should reject invalid emails', () => {
      expect(validators.isValidEmail('invalid')).toBe(false);
      expect(validators.isValidEmail('invalid@')).toBe(false);
      expect(validators.isValidEmail('@domain.com')).toBe(false);
      expect(validators.isValidEmail('test@.com')).toBe(false);
    });
  });

  describe('isValidPassword', () => {
    it('should validate strong passwords', () => {
      const result = validators.isValidPassword('Abc123');
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should reject short passwords', () => {
      const result = validators.isValidPassword('Ab1');
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Password must be at least 6 characters');
    });

    it('should reject passwords without letters', () => {
      const result = validators.isValidPassword('123456');
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Password must contain at least one letter');
    });

    it('should reject passwords without numbers', () => {
      const result = validators.isValidPassword('abcdef');
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Password must contain at least one number');
    });
  });

  describe('isValidUsername', () => {
    it('should validate valid usernames', () => {
      expect(validators.isValidUsername('user123')).toBe(true);
      expect(validators.isValidUsername('john_doe')).toBe(true);
    });

    it('should reject invalid usernames', () => {
      expect(validators.isValidUsername('ab')).toBe(false); // Too short
      expect(validators.isValidUsername('user name')).toBe(false); // Contains space
      expect(validators.isValidUsername('user@name')).toBe(false); // Invalid character
    });
  });

  describe('isValidFileSize', () => {
    it('should validate file size', () => {
      expect(validators.isValidFileSize(1000, 2000)).toBe(true);
      expect(validators.isValidFileSize(2000, 2000)).toBe(true);
      expect(validators.isValidFileSize(3000, 2000)).toBe(false);
      expect(validators.isValidFileSize(0, 2000)).toBe(false);
    });
  });

  describe('isValidFileType', () => {
    it('should validate file types', () => {
      const audioTypes = ['audio/mp3', 'audio/wav'];
      expect(validators.isValidFileType('audio/mp3', audioTypes)).toBe(true);
      expect(validators.isValidFileType('video/mp4', audioTypes)).toBe(false);
    });
  });

  describe('isValidUrl', () => {
    it('should validate valid URLs', () => {
      expect(validators.isValidUrl('https://example.com')).toBe(true);
      expect(validators.isValidUrl('http://localhost:3000')).toBe(true);
    });

    it('should reject invalid URLs', () => {
      expect(validators.isValidUrl('not a url')).toBe(false);
      expect(validators.isValidUrl('example.com')).toBe(false);
    });
  });
});

