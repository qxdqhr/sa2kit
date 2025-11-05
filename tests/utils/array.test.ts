import { describe, it, expect } from 'vitest';
import { arrayUtils } from '../../src/utils';

describe('arrayUtils', () => {
  describe('unique', () => {
    it('should remove duplicates from array', () => {
      const arr = [1, 2, 2, 3, 3, 4, 5, 5];
      const result = arrayUtils.unique(arr);
      expect(result).toEqual([1, 2, 3, 4, 5]);
    });

    it('should handle empty array', () => {
      const result = arrayUtils.unique([]);
      expect(result).toEqual([]);
    });

    it('should handle array with no duplicates', () => {
      const arr = [1, 2, 3, 4, 5];
      const result = arrayUtils.unique(arr);
      expect(result).toEqual([1, 2, 3, 4, 5]);
    });
  });

  describe('groupBy', () => {
    it('should group array items by key', () => {
      const items = [
        { category: 'fruit', name: 'apple' },
        { category: 'fruit', name: 'banana' },
        { category: 'vegetable', name: 'carrot' },
      ];
      const result = arrayUtils.groupBy(items, 'category');
      expect(result).toEqual({
        fruit: [
          { category: 'fruit', name: 'apple' },
          { category: 'fruit', name: 'banana' },
        ],
        vegetable: [{ category: 'vegetable', name: 'carrot' }],
      });
    });

    it('should handle empty array', () => {
      const result = arrayUtils.groupBy([], 'category');
      expect(result).toEqual({});
    });
  });

  describe('paginate', () => {
    it('should paginate array correctly', () => {
      const arr = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
      const result = arrayUtils.paginate(arr, 1, 3);
      expect(result).toEqual({
        data: [1, 2, 3],
        total: 10,
        page: 1,
        pages: 4,
        hasNext: true,
        hasPrev: false,
      });
    });

    it('should handle last page', () => {
      const arr = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
      const result = arrayUtils.paginate(arr, 4, 3);
      expect(result).toEqual({
        data: [10],
        total: 10,
        page: 4,
        pages: 4,
        hasNext: false,
        hasPrev: true,
      });
    });

    it('should handle empty array', () => {
      const result = arrayUtils.paginate([], 1, 10);
      expect(result).toEqual({
        data: [],
        total: 0,
        page: 1,
        pages: 0,
        hasNext: false,
        hasPrev: false,
      });
    });
  });

  describe('shuffle', () => {
    it('should shuffle array', () => {
      const arr = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
      const result = arrayUtils.shuffle(arr);
      expect(result).toHaveLength(arr.length);
      expect(result).toEqual(expect.arrayContaining(arr));
    });

    it('should not modify original array', () => {
      const arr = [1, 2, 3, 4, 5];
      const original = [...arr];
      arrayUtils.shuffle(arr);
      expect(arr).toEqual(original);
    });
  });
});

