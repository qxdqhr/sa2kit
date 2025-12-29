/**
 * 验证实验数据的唯一性和完整性
 */

import type { ExperimentItem } from '../types';
import { experiments } from './experimentData';

/**
 * 检查实验数据中的重复ID
 */
export function checkDuplicateIds(data: ExperimentItem[]): string[] {
  const seenIds = new Set<string>();
  const duplicates: string[] = [];
  
  data.forEach(item => {
    if (seenIds.has(item.id)) {
      duplicates.push(item.id);
    } else {
      seenIds.add(item.id);
    }
  });
  
  return duplicates;
}

/**
 * 检查实验数据中的重复路径
 */
export function checkDuplicatePaths(data: ExperimentItem[]): string[] {
  const seenPaths = new Set<string>();
  const duplicates: string[] = [];
  
  data.forEach(item => {
    if (seenPaths.has(item.path)) {
      duplicates.push(item.path);
    } else {
      seenPaths.add(item.path);
    }
  });
  
  return duplicates;
}

/**
 * 运行完整的数据验证
 */
export function validateExperimentData(): {
  isValid: boolean;
  duplicateIds: string[];
  duplicatePaths: string[];
  errors: string[];
} {
  const duplicateIds = checkDuplicateIds(experiments);
  const duplicatePaths = checkDuplicatePaths(experiments);
  const errors: string[] = [];
  
  if (duplicateIds.length > 0) {
    errors.push(`发现重复的ID: ${duplicateIds.join(', ')}`);
  }
  
  if (duplicatePaths.length > 0) {
    errors.push(`发现重复的路径: ${duplicatePaths.join(', ')}`);
  }
  
  // 检查必需字段
  experiments.forEach((item, index) => {
    if (!item.id || !item.title || !item.path || !item.category) {
      errors.push(`项目 ${index + 1} 缺少必需字段`);
    }
  });
  
  return {
    isValid: errors.length === 0,
    duplicateIds,
    duplicatePaths,
    errors
  };
}

// 在开发环境下运行验证
if (process.env.NODE_ENV === 'development') {
  const validation = validateExperimentData();
  if (!validation.isValid) {
    console.warn('实验数据验证失败:', validation.errors);
  }
}