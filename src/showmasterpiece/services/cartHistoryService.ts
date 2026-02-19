/**
 * ShowMasterpiece 模块 - 购物车历史记录服务
 * 
 * 提供用户购物车历史记录功能，包括：
 * - 保存用户提交的购物车数据
 * - 获取用户历史记录
 * - 更新预订状态
 * - 本地存储管理
 * 
 * @fileoverview 购物车历史记录服务
 */

import { 
  CartHistoryItem, 
  CartHistory, 
  CartItem,
  BatchBookingResponse 
} from '../types/cart';

/**
 * 购物车历史记录本地存储键名基础
 */
const CART_HISTORY_STORAGE_KEY_BASE = 'showmasterpiece_cart_history';

/**
 * 默认的购物车历史记录存储键（向后兼容）
 */
const CART_HISTORY_STORAGE_KEY = CART_HISTORY_STORAGE_KEY_BASE;


/**
 * 购物车历史记录服务类
 * 
 * 提供购物车历史记录相关的本地存储操作方法
 */
export class CartHistoryService {
  /**
   * 生成唯一ID
   */
  // static generateId(): string {
  //   return `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  // }

  /**
   * 获取用户购物车历史记录
   * 
   * @param qqNumber 用户QQ号
   * @param phoneNumber 用户手机号
   * @returns 购物车历史记录
   */
  static async getCartHistory(qqNumber: string, phoneNumber: string): Promise<CartHistory> {
    try {
      const historyData = localStorage.getItem(CART_HISTORY_STORAGE_KEY);
      if (historyData) {
        const allHistory: CartHistoryItem[] = JSON.parse(historyData);
        
        // 过滤当前用户的历史记录
        const userHistory = allHistory.filter(record => 
          record.qqNumber === qqNumber && record.phoneNumber === phoneNumber
        );

        // 将字符串日期转换为Date对象
        const processedHistory = userHistory.map(record => ({
          ...record,
          submittedAt: new Date(record.submittedAt),
          items: record.items.map((item: any) => ({
            ...item,
            addedAt: new Date(item.addedAt)
          }))
        }));

        // 按提交时间倒序排列
        processedHistory.sort((a, b) => b.submittedAt.getTime() - a.submittedAt.getTime());

        return {
          records: processedHistory,
          totalRecords: processedHistory.length
        };
      }
    } catch (error) {
      console.error('读取购物车历史记录失败:', error);
    }
    
    return {
      records: [],
      totalRecords: 0
    };
  }

  /**
   * 保存购物车历史记录
   * 
   * @param historyItem 历史记录项
   */
  static async saveCartHistory(historyItem: Omit<CartHistoryItem, 'id'>): Promise<CartHistoryItem> {
    try {
      // 直接在函数内生成ID，避免this上下文问题
      const generateId = () => `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      
      const newHistoryItem: CartHistoryItem = {
        ...historyItem,
        id: generateId(),
        submittedAt: new Date()
      };

      // 获取现有历史记录
      const existingData = localStorage.getItem(CART_HISTORY_STORAGE_KEY);
      const allHistory: CartHistoryItem[] = existingData ? JSON.parse(existingData) : [];

      // 添加新记录
      allHistory.push(newHistoryItem);

      // 保存到本地存储
      localStorage.setItem(CART_HISTORY_STORAGE_KEY, JSON.stringify(allHistory));

      console.log('✅ 购物车历史记录保存成功:', { 
        id: newHistoryItem.id,
        qqNumber: newHistoryItem.qqNumber,
        itemCount: newHistoryItem.items.length
      });

      return newHistoryItem;
    } catch (error) {
      console.error('保存购物车历史记录失败:', error);
      throw new Error('保存购物车历史记录失败');
    }
  }

  /**
   * 更新预订状态
   * 
   * @param qqNumber 用户QQ号
   * @param phoneNumber 用户手机号
   * @param historyId 历史记录ID
   * @param status 新状态
   * @param bookingIds 预订ID列表
   */
  static async updateBookingStatus(
    qqNumber: string, 
    phoneNumber: string, 
    historyId: string, 
    status: CartHistoryItem['status'],
    bookingIds?: number[]
  ): Promise<void> {
    try {
      const historyData = localStorage.getItem(CART_HISTORY_STORAGE_KEY);
      if (historyData) {
        const allHistory: CartHistoryItem[] = JSON.parse(historyData);
        
        // 找到并更新指定记录
        const recordIndex = allHistory.findIndex(record => 
          record.id === historyId && 
          record.qqNumber === qqNumber && 
          record.phoneNumber === phoneNumber
        );

        if (recordIndex !== -1) {
          const record = allHistory[recordIndex];
          if (!record) {
            return;
          }
          record.status = status;
          if (bookingIds) {
            record.bookingIds = bookingIds;
          }

          // 保存更新后的数据
          localStorage.setItem(CART_HISTORY_STORAGE_KEY, JSON.stringify(allHistory));

          console.log('✅ 预订状态更新成功:', { 
            historyId, 
            status, 
            bookingIds 
          });
        }
      }
    } catch (error) {
      console.error('更新预订状态失败:', error);
      throw new Error('更新预订状态失败');
    }
  }

  /**
   * 删除历史记录
   * 
   * @param qqNumber 用户QQ号
   * @param phoneNumber 用户手机号
   * @param historyId 历史记录ID
   */
  static async deleteHistoryRecord(
    qqNumber: string, 
    phoneNumber: string, 
    historyId: string
  ): Promise<void> {
    try {
      const historyData = localStorage.getItem(CART_HISTORY_STORAGE_KEY);
      if (historyData) {
        const allHistory: CartHistoryItem[] = JSON.parse(historyData);
        
        // 过滤掉要删除的记录
        const filteredHistory = allHistory.filter(record => 
          !(record.id === historyId && 
            record.qqNumber === qqNumber && 
            record.phoneNumber === phoneNumber)
        );

        // 保存过滤后的数据
        localStorage.setItem(CART_HISTORY_STORAGE_KEY, JSON.stringify(filteredHistory));

        console.log('✅ 历史记录删除成功:', { historyId });
      }
    } catch (error) {
      console.error('删除历史记录失败:', error);
      throw new Error('删除历史记录失败');
    }
  }

  /**
   * 清空用户所有历史记录
   * 
   * @param qqNumber 用户QQ号
   * @param phoneNumber 用户手机号
   */
  static async clearUserHistory(qqNumber: string, phoneNumber: string): Promise<void> {
    try {
      const historyData = localStorage.getItem(CART_HISTORY_STORAGE_KEY);
      if (historyData) {
        const allHistory: CartHistoryItem[] = JSON.parse(historyData);
        
        // 过滤掉当前用户的所有记录
        const filteredHistory = allHistory.filter(record => 
          !(record.qqNumber === qqNumber && record.phoneNumber === phoneNumber)
        );

        // 保存过滤后的数据
        localStorage.setItem(CART_HISTORY_STORAGE_KEY, JSON.stringify(filteredHistory));

        console.log('✅ 用户历史记录清空成功:', { qqNumber, phoneNumber });
      }
    } catch (error) {
      console.error('清空用户历史记录失败:', error);
      throw new Error('清空用户历史记录失败');
    }
  }

  /**
   * 获取所有历史记录（管理员功能）
   */
  static async getAllHistory(): Promise<CartHistoryItem[]> {
    try {
      const historyData = localStorage.getItem(CART_HISTORY_STORAGE_KEY);
      if (historyData) {
        const allHistory: CartHistoryItem[] = JSON.parse(historyData);
        
        // 将字符串日期转换为Date对象
        return allHistory.map(record => ({
          ...record,
          submittedAt: new Date(record.submittedAt),
          items: record.items.map((item: any) => ({
            ...item,
            addedAt: new Date(item.addedAt)
          }))
        }));
      }
    } catch (error) {
      console.error('读取所有历史记录失败:', error);
    }
    
    return [];
  }

  /**
   * 获取统计数据
   */
  static async getStatistics(): Promise<{
    totalRecords: number;
    totalUsers: number;
    totalItems: number;
    totalRevenue: number;
  }> {
    try {
      const allHistory = await this.getAllHistory();
      
      const totalRecords = allHistory.length;
      const uniqueUsers = new Set(
        allHistory.map(record => `${record.qqNumber}_${record.phoneNumber}`)
      );
      const totalUsers = uniqueUsers.size;
      
      let totalItems = 0;
      let totalRevenue = 0;
      
      allHistory.forEach(record => {
        totalItems += record.totalQuantity;
        totalRevenue += record.totalPrice;
      });

      return {
        totalRecords,
        totalUsers,
        totalItems,
        totalRevenue
      };
    } catch (error) {
      console.error('获取统计数据失败:', error);
      return {
        totalRecords: 0,
        totalUsers: 0,
        totalItems: 0,
        totalRevenue: 0
      };
    }
  }
}

// 导出单独的函数，方便直接导入使用
export const getCartHistory = CartHistoryService.getCartHistory;
export const updateBookingStatus = CartHistoryService.updateBookingStatus;
export const deleteHistoryRecord = CartHistoryService.deleteHistoryRecord;
export const clearUserHistory = CartHistoryService.clearUserHistory;
export const getAllHistory = CartHistoryService.getAllHistory;
export const getStatistics = CartHistoryService.getStatistics;

// 独立的saveCartHistory函数，避免类方法绑定问题
export const saveCartHistory = async (historyItem: Omit<CartHistoryItem, 'id'>): Promise<CartHistoryItem> => {
  try {
    // 生成唯一ID
    const generateId = () => `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    const newHistoryItem: CartHistoryItem = {
      ...historyItem,
      id: generateId(),
      submittedAt: new Date()
    };

    // 获取现有历史记录
    const existingData = localStorage.getItem(CART_HISTORY_STORAGE_KEY);
    const allHistory: CartHistoryItem[] = existingData ? JSON.parse(existingData) : [];

    // 添加新记录
    allHistory.push(newHistoryItem);

    // 保存到本地存储
    localStorage.setItem(CART_HISTORY_STORAGE_KEY, JSON.stringify(allHistory));

    console.log('✅ 购物车历史记录保存成功:', { 
      id: newHistoryItem.id,
      qqNumber: newHistoryItem.qqNumber,
      itemCount: newHistoryItem.items.length
    });

    return newHistoryItem;
  } catch (error) {
    console.error('保存购物车历史记录失败:', error);
    throw new Error('保存购物车历史记录失败');
  }
}; 
