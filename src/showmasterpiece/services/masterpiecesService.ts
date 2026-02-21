/**
 * MasterpiecesService - 美术作品前端API服务
 * 
 * 这个文件提供了客户端与美术作品相关API的通信接口。
 * 主要用于前端组件和Hook中调用后端API，获取和操作画集数据。
 * 
 * 主要功能：
 * - 画集数据的获取和查询
 * - 搜索和筛选功能
 * - 分类和标签管理
 * - 推荐算法
 * 
 * 设计特点：
 * - 使用静态方法，无需实例化
 * - 统一的错误处理
 * - 支持多种查询方式
 * - TypeScript类型安全
 * 
 * @module MasterpiecesService
 */

import type { ArtCollection } from '../types';

/**
 * 获取美术作品画集列表（函数式API）
 * 
 * 这是一个简单的函数式接口，用于获取所有画集数据。
 * 主要为了保持向后兼容性而保留。
 * 
 * @returns Promise<ArtCollection[]> 画集数组
 * @throws {Error} 当API请求失败时抛出错误
 * 
 * @deprecated 建议使用 MasterpiecesService.getAllCollections() 代替
 */
export const getMasterpieces = async (): Promise<ArtCollection[]> => {
  const response = await fetch('/api/showmasterpiece/collections');
  if (!response.ok) {
    throw new Error('获取画集失败');
  }
  return await response.json();
};

/**
 * 美术作品服务类
 * 
 * 提供完整的美术作品数据访问接口，包括画集的获取、搜索、筛选等功能。
 * 所有方法都是静态方法，可以直接调用，无需实例化。
 * 
 * @example
 * ```typescript
 * // 获取所有画集
 * const collections = await MasterpiecesService.getAllCollections();
 * 
 * // 搜索画集
 * const results = await MasterpiecesService.searchCollections('油画');
 * 
 * // 按分类获取
 * const paintings = await MasterpiecesService.getCollectionsByCategory('油画');
 * ```
 */
export class MasterpiecesService {
  /**
   * 获取所有画集
   * 
   * 从后端API获取所有可用的画集数据。
   * 返回的数据包含完整的画集信息和作品页面。
   * 
   * @returns Promise<ArtCollection[]> 所有画集的数组
   * @throws {Error} 当API请求失败时抛出错误
   * 
   * @example
   * ```typescript
   * try {
   *   const collections = await MasterpiecesService.getAllCollections();
   *   console.log(`共加载了 ${collections.length} 个画集`);
   * } catch (error) {
   *   console.error('加载失败:', error.message);
   * }
   * ```
   */
  static async getAllCollections(): Promise<ArtCollection[]> {
    const response = await fetch('/api/showmasterpiece/collections');
    if (!response.ok) {
      throw new Error('获取画集失败');
    }
    const payload = await response.json();
    const collections = Array.isArray(payload)
      ? payload
      : (payload?.collections ?? payload?.data ?? []);

    if (!Array.isArray(collections)) {
      throw new Error('画集数据格式不正确');
    }

    return collections;
  }

  /**
   * 根据ID获取特定画集
   * 
   * 通过画集ID获取单个画集的详细信息。
   * 内部实现是先获取所有画集，然后筛选出指定ID的画集。
   * 
   * @param id - 画集的唯一标识符
   * @returns Promise<ArtCollection | null> 找到的画集对象，如果不存在则返回null
   * 
   * @example
   * ```typescript
   * const collection = await MasterpiecesService.getCollectionById(1);
   * if (collection) {
   *   console.log(`找到画集: ${collection.title}`);
   * } else {
   *   console.log('画集不存在');
   * }
   * ```
   */
  static async getCollectionById(id: number): Promise<ArtCollection | null> {
    const collections = await this.getAllCollections();
    return collections.find(c => c.id === id) || null;
  }

  /**
   * 搜索画集
   * 
   * 根据关键词在画集的多个字段中进行搜索，包括：
   * - 画集标题
   * - 艺术家姓名
   * - 画集描述
   * - 画集分类
   * - 画集标签
   * 
   * 搜索是大小写不敏感的，支持部分匹配。
   * 
   * @param query - 搜索关键词
   * @returns Promise<ArtCollection[]> 匹配的画集数组
   * 
   * @example
   * ```typescript
   * // 搜索包含"山水"的画集
   * const results = await MasterpiecesService.searchCollections('山水');
   * console.log(`找到 ${results.length} 个相关画集`);
   * ```
   */
  static async searchCollections(query: string): Promise<ArtCollection[]> {
    const collections = await this.getAllCollections();
    const searchTerm = query.toLowerCase();
    
    return collections.filter((collection: ArtCollection) => 
      collection.title.toLowerCase().includes(searchTerm) ||
              collection.number.toLowerCase().includes(searchTerm) ||
      collection.description.toLowerCase().includes(searchTerm) ||
      (collection.category && collection.category.toLowerCase().includes(searchTerm)) ||
      (collection.tags && collection.tags.some((tag: string) => tag.toLowerCase().includes(searchTerm)))
    );
  }

  /**
   * 根据分类获取画集
   * 
   * 获取属于指定分类的所有画集。
   * 支持特殊值 'all' 来获取所有画集。
   * 
   * @param category - 分类名称，或 'all' 表示所有分类
   * @returns Promise<ArtCollection[]> 该分类下的画集数组
   * 
   * @example
   * ```typescript
   * // 获取油画分类的画集
   * const paintings = await MasterpiecesService.getCollectionsByCategory('油画');
   * 
   * // 获取所有画集
   * const allCollections = await MasterpiecesService.getCollectionsByCategory('all');
   * ```
   */
  static async getCollectionsByCategory(category: string): Promise<ArtCollection[]> {
    const collections = await this.getAllCollections();
    
    if (category === 'all') {
      return collections;
    }
    
    return collections.filter((collection: ArtCollection) => collection.category === category);
  }

  /**
   * 获取推荐画集
   * 
   * 基于简单的推荐算法获取推荐的画集。
   * 当前算法：优先选择已发布的画集，按作品数量降序排列。
   * 
   * @param limit - 返回的推荐画集数量，默认为3个
   * @returns Promise<ArtCollection[]> 推荐的画集数组
   * 
   * @example
   * ```typescript
   * // 获取3个推荐画集
   * const recommended = await MasterpiecesService.getRecommendedCollections();
   * 
   * // 获取5个推荐画集
   * const moreRecommended = await MasterpiecesService.getRecommendedCollections(5);
   * ```
   */
  static async getRecommendedCollections(limit: number = 3): Promise<ArtCollection[]> {
    const collections = await this.getAllCollections();
    
    // 简单的推荐逻辑：返回已发布的画集，按作品数量排序
    return collections
      .filter((collection: ArtCollection) => collection.isPublished !== false)
      .sort((a: ArtCollection, b: ArtCollection) => b.pages.length - a.pages.length)
      .slice(0, limit);
  }

  /**
   * 获取所有可用分类
   * 
   * 从后端API获取所有已定义的画集分类列表。
   * 用于构建分类筛选器和下拉菜单。
   * 
   * @returns Promise<Array<{ name: string; description?: string | null }>> 分类名称数组
   * @throws {Error} 当API请求失败时抛出错误
   * 
   * @example
   * ```typescript
   * const categories = await MasterpiecesService.getCategories();
   * console.log('可用分类:', categories);
   * ```
   */
  static async getCategories(): Promise<Array<{ name: string; description?: string | null }>> {
    const response = await fetch('/api/showmasterpiece/categories');
    if (!response.ok) {
      throw new Error('获取分类失败');
    }
    const payload = await response.json();
    return Array.isArray(payload) ? payload : payload?.data ?? [];
  }

  /**
   * 获取所有可用标签
   * 
   * 从后端API获取所有已定义的画集标签列表。
   * 用于构建标签筛选器和标签云。
   * 
   * @returns Promise<string[]> 标签名称数组
   * @throws {Error} 当API请求失败时抛出错误
   * 
   * @example
   * ```typescript
   * const tags = await MasterpiecesService.getTags();
   * console.log('可用标签:', tags);
   * ```
   */
  static async getTags(): Promise<string[]> {
    const response = await fetch('/api/showmasterpiece/tags');
    if (!response.ok) {
      throw new Error('获取标签失败');
    }
    return await response.json();
  }
} 
