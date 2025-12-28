import React from 'react';

// ==================== 公共类型定义 ====================

/** 基础网格项接口 */
export interface GridItem {
    id: string;
    [key: string]: any; // 允许额外的属性
  }
  
  /** 网格列数配置 */
  export interface GridColumns {
    /** 小屏幕列数 (640px+) */
    sm?: number;
    /** 中等屏幕列数 (768px+) */
    md?: number;
    /** 大屏幕列数 (1024px+) */
    lg?: number;
    /** 超大屏幕列数 (1280px+) */
    xl?: number;
  }
  
  /** 网格间距类型 */
  export type GridGap = 'sm' | 'md' | 'lg' | 'xl';
  
  // ==================== 公共工具函数 ====================
  
  /** 构建网格列数类名 */
  export function buildGridColsClasses(columns: GridColumns): string {
    return [
      'grid-cols-1', // 默认单列
      columns.sm ? `sm:grid-cols-${columns.sm}` : '',
      columns.md ? `md:grid-cols-${columns.md}` : 'md:grid-cols-2',
      columns.lg ? `lg:grid-cols-${columns.lg}` : 'lg:grid-cols-3',
      columns.xl ? `xl:grid-cols-${columns.xl}` : ''
    ].filter(Boolean).join(' ');
  }
  
  /** 获取间距类名 */
  export function getGapClassName(gap: GridGap): string {
    const gapClasses: Record<GridGap, string> = {
      sm: 'gap-3',
      md: 'gap-6',
      lg: 'gap-8',
      xl: 'gap-10'
    };
    return gapClasses[gap];
  }
  
  // ==================== 通用网格组件 ====================
  
  /** 通用网格组件 Props */
  export interface GridProps<T extends GridItem> {
    /** 数据项数组 */
    items: T[];
    /** 渲染函数 */
    renderItem: (item: T, index: number) => React.ReactNode;
    /** 网格列数配置 */
    columns?: GridColumns;
    /** 间距配置 */
    gap?: GridGap;
    /** 额外的容器类名 */
    className?: string;
    /** 容器样式 */
    style?: React.CSSProperties;
  }
  
  /** 通用网格组件 */
  export function Grid<T extends GridItem>({
    items,
    renderItem,
    columns = { md: 2, lg: 3 },
    gap = 'md',
    className = '',
    style
  }: GridProps<T>) {
    const gridColsClasses = buildGridColsClasses(columns);
    const gapClass = getGapClassName(gap);
  
    return (
      <div 
        className={`grid ${gridColsClasses} ${gapClass} ${className}`.trim()}
        style={style}
      >
        {items.map((item, index) => (
          <div key={item.id}>
            {renderItem(item, index)}
          </div>
        ))}
      </div>
    );
  }