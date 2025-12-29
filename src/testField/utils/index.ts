/**
 * 实验田模块工具函数
 */

import type { ExperimentItem, ViewMode, TestFieldConfig, CompletionFilter } from '../types';

/**
 * 过滤实验项目
 */
export function filterExperiments(
  experiments: ExperimentItem[],
  config: Partial<TestFieldConfig>
): ExperimentItem[] {
  const {
    viewMode = 'all',
    searchQuery = '',
    completionFilter = 'all'
  } = config;

  return experiments.filter(experiment => {
    // 类别过滤
    const matchesViewMode = viewMode === 'all' || experiment.category === viewMode;
    
    // 搜索过滤
    const query = searchQuery.toLowerCase();
    const matchesSearch = !query || 
      experiment.title.toLowerCase().includes(query) ||
      experiment.description.toLowerCase().includes(query) ||
      experiment.tags.some(tag => tag.toLowerCase().includes(query));
    
    // 完成状态过滤
    const matchesCompletion = (() => {
      switch (completionFilter) {
        case 'completed':
          return experiment.isCompleted === true;
        case 'incomplete':
          return experiment.isCompleted !== true;
        case 'all':
        default:
          return true;
      }
    })();
    
    return matchesViewMode && matchesSearch && matchesCompletion;
  });
}

/**
 * 排序实验项目
 */
export function sortExperiments(
  experiments: ExperimentItem[],
  sortBy: TestFieldConfig['sortBy'] = 'title',
  sortOrder: TestFieldConfig['sortOrder'] = 'asc'
): ExperimentItem[] {
  return [...experiments].sort((a, b) => {
    let comparison = 0;
    
    switch (sortBy) {
      case 'title':
        comparison = a.title.localeCompare(b.title);
        break;
      case 'category':
        comparison = a.category.localeCompare(b.category);
        break;
      case 'completion':
        // 已完成的排在前面
        const aCompleted = a.isCompleted ? 1 : 0;
        const bCompleted = b.isCompleted ? 1 : 0;
        comparison = bCompleted - aCompleted;
        break;
      case 'createdAt':
        // 处理创建日期排序，确保没有日期的项目排在最后
        if (!a.createdAt && !b.createdAt) {
          comparison = 0;
        } else if (!a.createdAt) {
          comparison = 1; // a没有日期，排在后面
        } else if (!b.createdAt) {
          comparison = -1; // b没有日期，排在后面
        } else {
          // 日期字符串比较（假设格式为YYYY-MM-DD）
          comparison = new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
        }
        break;
      case 'updatedAt':
        // 处理更新日期排序，确保没有日期的项目排在最后
        if (!a.updatedAt && !b.updatedAt) {
          comparison = 0;
        } else if (!a.updatedAt) {
          comparison = 1; // a没有日期，排在后面
        } else if (!b.updatedAt) {
          comparison = -1; // b没有日期，排在后面
        } else {
          // 日期字符串比较（假设格式为YYYY-MM-DD）
          comparison = new Date(a.updatedAt).getTime() - new Date(b.updatedAt).getTime();
        }
        break;
      default:
        comparison = 0;
    }
    
    // 如果主要排序字段相同，使用ID作为第二排序键确保稳定性
    if (comparison === 0) {
      comparison = a.id.localeCompare(b.id);
    }
    
    return sortOrder === 'asc' ? comparison : -comparison;
  });
}

/**
 * 获取所有标签
 */
export function getAllTags(experiments: ExperimentItem[]): string[] {
  const allTags = experiments.flatMap(experiment => experiment.tags);
  return Array.from(new Set(allTags)).sort();
}

/**
 * 根据类别统计实验项目数量
 */
export function getExperimentCounts(experiments: ExperimentItem[]) {
  const counts = {
    all: experiments.length,
    utility: 0,
    leisure: 0,
    completed: 0,
    inProgress: 0
  };
  
  experiments.forEach(experiment => {
    if (experiment.category === 'utility') {
      counts.utility++;
    } else if (experiment.category === 'leisure') {
      counts.leisure++;
    }
    
    if (experiment.isCompleted) {
      counts.completed++;
    } else {
      counts.inProgress++;
    }
  });
  
  return counts;
}

/**
 * 验证实验项目数据
 */
export function validateExperiment(experiment: Partial<ExperimentItem>): boolean {
  return !!(
    experiment.id &&
    experiment.title &&
    experiment.description &&
    experiment.path &&
    experiment.category &&
    Array.isArray(experiment.tags)
  );
}

/**
 * 获取类别显示名称
 */
export function getCategoryDisplayName(category: ViewMode): string {
  switch (category) {
    case 'utility':
      return '实用工具';
    case 'leisure':
      return '休闲娱乐';
    case 'all':
    default:
      return '全部';
  }
}

/**
 * 获取类别颜色
 */
export function getCategoryColor(category: ExperimentItem['category']): string {
  switch (category) {
    case 'utility':
      return 'bg-blue-100 text-blue-800 border-blue-200';
    case 'leisure':
      return 'bg-purple-100 text-purple-800 border-purple-200';
    default:
      return 'bg-gray-100 text-gray-800 border-gray-200';
  }
}

/**
 * 获取完成状态显示名称
 */
export function getCompletionFilterDisplayName(filter: CompletionFilter): string {
  switch (filter) {
    case 'completed':
      return '已完成';
    case 'incomplete':
      return '进行中';
    case 'all':
    default:
      return '全部状态';
  }
}

/**
 * 获取完成状态标签样式
 */
export function getCompletionStatusColor(isCompleted?: boolean): string {
  if (isCompleted) {
    return 'bg-green-100 text-green-800 border-green-200';
  }
  return 'bg-yellow-100 text-yellow-800 border-yellow-200';
}

/**
 * 获取完成状态标签文本
 */
export function getCompletionStatusText(isCompleted?: boolean): string {
  return isCompleted ? '已完成' : '进行中';
}