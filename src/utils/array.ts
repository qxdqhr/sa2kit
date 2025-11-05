/**
 * 数组和对象工具
 */

export const arrayUtils = {
  /**
   * 数组去重
   */
  unique<T>(array: T[]): T[] {
    return [...new Set(array)];
  },

  /**
   * 数组分组
   */
  groupBy<T>(array: T[], key: keyof T): Record<string, T[]> {
    return array.reduce(
      (groups, item) => {
        const groupKey = String(item[key]);
        const group = groups[groupKey] || [];
        group.push(item);
        groups[groupKey] = group;
        return groups;
      },
      {} as Record<string, T[]>
    );
  },

  /**
   * 数组分页
   */
  paginate<T>(
    array: T[],
    page: number,
    limit: number
  ): {
    data: T[];
    total: number;
    page: number;
    pages: number;
    hasNext: boolean;
    hasPrev: boolean;
  } {
    const total = array.length;
    const pages = Math.ceil(total / limit);
    const start = (page - 1) * limit;
    const end = start + limit;
    const data = array.slice(start, end);

    return {
      data,
      total,
      page,
      pages,
      hasNext: page < pages,
      hasPrev: page > 1,
    };
  },

  /**
   * 数组随机排序
   */
  shuffle<T>(array: T[]): T[] {
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j]!, shuffled[i]!];
    }
    return shuffled;
  },
};

