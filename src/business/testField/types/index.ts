/**
 * 实验田模块类型定义
 */

/**
 * 实验项目类别
 */
export type ExperimentCategory = 'utility' | 'leisure';

/**
 * 实验项目接口
 */
export interface ExperimentItem {
  /** 项目唯一标识 */
  id: string;
  
  /** 项目标题 */
  title: string;
  
  /** 项目描述 */
  description: string;
  
  /** 项目路径 */
  path: string;
  
  /** 项目标签 */
  tags: string[];
  
  /** 项目类别 */
  category: ExperimentCategory;
  
  /** 是否已完成 */
  isCompleted?: boolean;
  
  /** 创建时间 */
  createdAt?: string;
  
  /** 更新时间 */
  updatedAt?: string;

  /** 用户自定义排序索引 */
  userOrder?: number;
}

/**
 * 实验田视图模式
 */
export type ViewMode = 'all' | 'utility' | 'leisure';

/**
 * 完成状态筛选选项
 */
export type CompletionFilter = 'all' | 'completed' | 'incomplete';

/**
 * 排序模式
 */
export type SortMode = 'auto' | 'manual';

/**
 * 实验田搜索和筛选配置
 */
export interface TestFieldConfig {
  /** 当前视图模式 */
  viewMode: ViewMode;
  
  /** 搜索查询 */
  searchQuery: string;
  
  /** 完成状态筛选 */
  completionFilter: CompletionFilter;
  
  /** 排序方式 */
  sortBy: 'title' | 'category' | 'createdAt' | 'updatedAt' | 'completion';
  
  /** 排序方向 */
  sortOrder: 'asc' | 'desc';

  /** 排序模式 */
  sortMode: SortMode;
}

/**
 * 实验田页面属性
 */
export interface TestFieldPageProps {
  /** 初始配置 */
  initialConfig?: Partial<TestFieldConfig>;
  
  /** 实验项目列表 */
  experiments?: ExperimentItem[];
}