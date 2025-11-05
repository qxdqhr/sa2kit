import { describe, it, expect } from 'vitest';
import { stringUtils } from '../../src/utils';

describe('stringUtils', () => {
  describe('truncate', () => {
    it('should truncate long text', () => {
      const text = 'This is a very long text that needs to be truncated';
      const result = stringUtils.truncate(text, 20);
      expect(result).toBe('This is a very lo...');
      expect(result.length).toBe(20);
    });

    it('should not truncate short text', () => {
      const text = 'Short';
      const result = stringUtils.truncate(text, 20);
      expect(result).toBe('Short');
    });

    it('should use custom suffix', () => {
      const text = 'This is a long text';
      const result = stringUtils.truncate(text, 15, '---');
      expect(result).toBe('This is a lo---');
    });
  });

  describe('capitalize', () => {
    it('should capitalize first letter', () => {
      expect(stringUtils.capitalize('hello')).toBe('Hello');
    });

    it('should handle already capitalized text', () => {
      expect(stringUtils.capitalize('Hello')).toBe('Hello');
    });

    it('should handle empty string', () => {
      expect(stringUtils.capitalize('')).toBe('');
    });

    it('should lowercase rest of the string', () => {
      expect(stringUtils.capitalize('hELLO')).toBe('Hello');
    });
  });

  describe('camelToSnake', () => {
    it('should convert camelCase to snake_case', () => {
      expect(stringUtils.camelToSnake('helloWorld')).toBe('hello_world');
      expect(stringUtils.camelToSnake('myVariableName')).toBe('my_variable_name');
    });

    it('should handle already snake_case', () => {
      expect(stringUtils.camelToSnake('hello_world')).toBe('hello_world');
    });
  });

  describe('snakeToCamel', () => {
    it('should convert snake_case to camelCase', () => {
      expect(stringUtils.snakeToCamel('hello_world')).toBe('helloWorld');
      expect(stringUtils.snakeToCamel('my_variable_name')).toBe('myVariableName');
    });

    it('should handle already camelCase', () => {
      expect(stringUtils.snakeToCamel('helloWorld')).toBe('helloWorld');
    });
  });

  describe('generateRandom', () => {
    it('should generate string of specified length', () => {
      const result = stringUtils.generateRandom(10);
      expect(result).toHaveLength(10);
    });

    it('should generate different strings', () => {
      const result1 = stringUtils.generateRandom(20);
      const result2 = stringUtils.generateRandom(20);
      expect(result1).not.toBe(result2);
    });

    it('should only contain alphanumeric characters', () => {
      const result = stringUtils.generateRandom(100);
      expect(result).toMatch(/^[a-zA-Z0-9]+$/);
    });
  });
});

