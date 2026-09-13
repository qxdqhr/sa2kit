import type { 
  IdeaListWithItems, 
  IdeaListFormData, 
  IdeaItemFormData, 
  IdeaItem,
  IdeaListsResponse,
  IdeaListResponse,
  IdeaItemsResponse,
  IdeaItemResponse
} from '../../../domain/types';

/**
 * 想法清单服务类
 * 封装与后端API的通信逻辑
 */
import { ideaListApiPath } from '../../../domain/ideaListApiPath';

export class IdeaListService {

  // ===== 想法清单操作 =====

  /**
   * 获取所有想法清单
   */
  static async getAllLists(): Promise<IdeaListWithItems[]> {
    const response = await fetch(ideaListApiPath('lists'));
    const result: IdeaListsResponse = await response.json();
    
    if (!result.success) {
      throw new Error(result.message || '获取想法清单失败');
    }
    
    return result.data || [];
  }

  /**
   * 创建新的想法清单
   */
  static async createList(data: IdeaListFormData): Promise<any> {
    console.log('🌐 [IdeaListService] createList 开始:', data);
    console.log('🌐 [IdeaListService] 请求URL:', ideaListApiPath('lists'));
    
    const response = await fetch(ideaListApiPath('lists'), {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });

    console.log('🌐 [IdeaListService] 响应状态:', response.status);
    const result: IdeaListResponse = await response.json();
    console.log('🌐 [IdeaListService] 响应数据:', result);
    
    if (!result.success) {
      throw new Error(result.message || '创建想法清单失败');
    }
    
    return result.data; // 返回新创建的清单数据
  }

  /**
   * 更新想法清单
   */
  static async updateList(id: number, data: Partial<IdeaListFormData>): Promise<void> {
    const response = await fetch(ideaListApiPath(`lists/${id}`), {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });

    const result: IdeaListResponse = await response.json();
    
    if (!result.success) {
      throw new Error(result.message || '更新想法清单失败');
    }
  }

  /**
   * 删除想法清单
   */
  static async deleteList(id: number): Promise<void> {
    const response = await fetch(ideaListApiPath(`lists/${id}`), {
      method: 'DELETE',
    });

    const result: IdeaListResponse = await response.json();
    
    if (!result.success) {
      throw new Error(result.message || '删除想法清单失败');
    }
  }

  // ===== 想法项目操作 =====

  /**
   * 获取指定清单的所有项目
   */
  static async getItemsByListId(listId: number): Promise<IdeaItem[]> {
    const response = await fetch(ideaListApiPath(`items?listId=${listId}`));
    const result: IdeaItemsResponse = await response.json();
    
    if (!result.success) {
      throw new Error(result.message || '获取想法项目失败');
    }
    
    return result.data || [];
  }

  /**
   * 创建新的想法项目
   */
  static async createItem(listId: number, data: IdeaItemFormData): Promise<void> {
    console.log('🌐 [IdeaListService] createItem 开始:', { listId, data });
    console.log('🌐 [IdeaListService] 请求URL:', ideaListApiPath('items'));
    
    const requestBody = { listId, ...data };
    console.log('🌐 [IdeaListService] 请求体:', requestBody);
    
    const response = await fetch(ideaListApiPath('items'), {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody),
    });

    console.log('🌐 [IdeaListService] 响应状态:', response.status);
    const result: IdeaItemResponse = await response.json();
    console.log('🌐 [IdeaListService] 响应数据:', result);
    
    if (!result.success) {
      throw new Error(result.message || '创建想法项目失败');
    }
  }

  /**
   * 更新想法项目
   */
  static async updateItem(id: number, data: Partial<IdeaItemFormData>): Promise<void> {
    const response = await fetch(ideaListApiPath(`items/${id}`), {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });

    const result: IdeaItemResponse = await response.json();
    
    if (!result.success) {
      throw new Error(result.message || '更新想法项目失败');
    }
  }

  /**
   * 删除想法项目
   */
  static async deleteItem(id: number): Promise<void> {
    const response = await fetch(ideaListApiPath(`items/${id}`), {
      method: 'DELETE',
    });

    const result: IdeaItemResponse = await response.json();
    
    if (!result.success) {
      throw new Error(result.message || '删除想法项目失败');
    }
  }

  /**
   * 切换想法项目的完成状态
   */
  static async toggleItemComplete(id: number): Promise<IdeaItem> {
    const response = await fetch(ideaListApiPath(`items/${id}/toggle`), {
      method: 'POST',
    });

    const result: IdeaItemResponse = await response.json();
    
    if (!result.success || !result.data) {
      throw new Error(result.message || '切换状态失败');
    }

    return result.data;
  }

  /**
   * 将想法转换为新的清单
   */
  static async convertToList(itemId: number, data: { name: string; description?: string; color?: string; deleteOriginal: boolean }): Promise<any> {
    const response = await fetch(ideaListApiPath(`items/${itemId}/convert-to-list`), {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        itemId,
        ...data,
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || '转换为清单失败');
    }

    return response.json();
  }
}