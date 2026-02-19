/**
 * EventAwareMasterpiecesService - 兼容层
 *
 * 为了向下兼容旧接口保留该服务，但已移除活动参数支持。
 */

import { MasterpiecesService } from './masterpiecesService';
import type { ArtCollection } from '../types';

/**
 * 活动感知的美术作品服务类
 */
export class EventAwareMasterpiecesService {
  /**
   * 获取所有画集数据
   *
   * @returns Promise<ArtCollection[]> 画集数组
   */
  static async getAllCollections(): Promise<ArtCollection[]> {
    return MasterpiecesService.getAllCollections();
  }

  /**
   * 根据ID获取特定画集
   *
   * @param id 画集ID
   * @returns Promise<ArtCollection | null> 画集对象或null
   */
  static async getCollectionById(id: number): Promise<ArtCollection | null> {
    return MasterpiecesService.getCollectionById(id);
  }

  /**
   * 根据分类获取画集
   *
   * @param category 分类名称
   * @returns Promise<ArtCollection[]> 指定分类的画集数组
   */
  static async getCollectionsByCategory(category: string): Promise<ArtCollection[]> {
    return MasterpiecesService.getCollectionsByCategory(category);
  }

  /**
   * 搜索画集
   *
   * @param query 搜索关键词
   * @returns Promise<ArtCollection[]> 搜索结果数组
   */
  static async searchCollections(query: string): Promise<ArtCollection[]> {
    return MasterpiecesService.searchCollections(query);
  }

  /**
   * 获取推荐画集
   *
   * @param currentCollectionId 当前画集ID
   * @param limit 推荐数量限制
   * @returns Promise<ArtCollection[]> 推荐画集数组
   */
  static async getRecommendedCollections(
    currentCollectionId: number,
    limit: number = 4
  ): Promise<ArtCollection[]> {
    return MasterpiecesService.getRecommendedCollections(currentCollectionId, limit);
  }
}

// 为了向下兼容，也导出原有的函数式接口
export const getEventAwareMasterpieces = async (): Promise<ArtCollection[]> => {
  return EventAwareMasterpiecesService.getAllCollections();
};
