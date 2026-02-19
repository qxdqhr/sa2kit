/**
 * ShowMasterpiece 模块 - 预订服务
 * 
 * 提供画集预订功能的前端API调用服务，包括：
 * - 创建预订
 * - 查询预订列表
 * - 更新预订状态
 * - 获取画集简略信息
 * 
 * @fileoverview 预订服务
 */

import { 
  Booking, 
  CreateBookingRequest, 
  UpdateBookingRequest, 
  BookingListParams, 
  BookingListResponse,
  CollectionSummary 
} from '../types/booking';

/**
 * 预订服务类
 * 
 * 提供预订功能相关的API调用方法，使用面向对象的方式封装HTTP请求。
 */
export class BookingService {
  private static readonly BASE_URL = '/api/showmasterpiece/bookings';

  /**
   * 创建新预订
   * 
   * @param data 预订数据
   * @returns 创建的预订信息
   */
  static async createBooking(data: CreateBookingRequest): Promise<Booking> {
    const response = await fetch(this.BASE_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: '创建预订失败' }));
      throw new Error(error.message || '创建预订失败');
    }

    return response.json();
  }

  /**
   * 获取预订列表
   * 
   * @param params 查询参数
   * @returns 预订列表和分页信息
   */
  static async getBookings(params: BookingListParams = {}): Promise<BookingListResponse> {
    const searchParams = new URLSearchParams();
    
    if (params.collectionId) {
      searchParams.append('collectionId', params.collectionId.toString());
    }
    if (params.qqNumber) {
      searchParams.append('qqNumber', params.qqNumber);
    }
    if (params.phoneNumber) {
      searchParams.append('phoneNumber', params.phoneNumber);
    }
    if (params.status) {
      searchParams.append('status', params.status);
    }
    if (params.page) {
      searchParams.append('page', params.page.toString());
    }
    if (params.limit) {
      searchParams.append('limit', params.limit.toString());
    }

    const url = `${this.BASE_URL}?${searchParams.toString()}`;
    const response = await fetch(url);

    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: '获取预订列表失败' }));
      throw new Error(error.message || '获取预订列表失败');
    }

    return response.json();
  }

  /**
   * 获取单个预订详情
   * 
   * @param id 预订ID
   * @returns 预订详情
   */
  static async getBooking(id: number): Promise<Booking> {
    const response = await fetch(`${this.BASE_URL}/${id}`);

    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: '获取预订详情失败' }));
      throw new Error(error.message || '获取预订详情失败');
    }

    return response.json();
  }

  /**
   * 更新预订状态
   * 
   * @param id 预订ID
   * @param data 更新数据
   * @returns 更新后的预订信息
   */
  static async updateBooking(id: number, data: UpdateBookingRequest): Promise<Booking> {
    const response = await fetch(`${this.BASE_URL}/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: '更新预订失败' }));
      throw new Error(error.message || '更新预订失败');
    }

    return response.json();
  }

  /**
   * 删除预订
   * 
   * @param id 预订ID
   */
  static async deleteBooking(id: number): Promise<void> {
    const response = await fetch(`${this.BASE_URL}/${id}`, {
      method: 'DELETE',
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: '删除预订失败' }));
      throw new Error(error.message || '删除预订失败');
    }
  }

  /**
   * 获取可预订的画集列表
   * 
   * @returns 画集简略信息列表
   */
  static async getBookableCollections(): Promise<CollectionSummary[]> {
    const url = `${this.BASE_URL}/collections`;
      
    console.log('📡 [BookingService] 获取可预订画集:', { url });
    
    const response = await fetch(url);

    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: '获取画集列表失败' }));
      throw new Error(error.message || '获取画集列表失败');
    }

    const data = await response.json();
    
    // 处理新的API响应格式
    if (data.success && Array.isArray(data.data)) {
      console.log(`✅ [BookingService] 获取到 ${data.data.length} 个可预订画集`);
      return data.data;
    }
    
    // 向下兼容旧格式
    if (Array.isArray(data)) {
      console.log(`✅ [BookingService] 获取到 ${data.length} 个可预订画集 (兼容格式)`);
      return data;
    }
    
    throw new Error('API响应格式错误');
  }
}

/**
 * 预订服务函数集
 * 
 * 提供函数式的API调用接口，作为服务类的补充。
 */

/**
 * 创建新预订
 * 
 * @param data 预订数据
 * @returns 创建的预订信息
 */
export const createBooking = (data: CreateBookingRequest): Promise<Booking> => {
  return BookingService.createBooking(data);
};

/**
 * 获取预订列表
 * 
 * @param params 查询参数
 * @returns 预订列表和分页信息
 */
export const getBookings = (params?: BookingListParams): Promise<BookingListResponse> => {
  return BookingService.getBookings(params);
};

/**
 * 获取单个预订详情
 * 
 * @param id 预订ID
 * @returns 预订详情
 */
export const getBooking = (id: number): Promise<Booking> => {
  return BookingService.getBooking(id);
};

/**
 * 更新预订状态
 * 
 * @param id 预订ID
 * @param data 更新数据
 * @returns 更新后的预订信息
 */
export const updateBooking = (id: number, data: UpdateBookingRequest): Promise<Booking> => {
  return BookingService.updateBooking(id, data);
};

/**
 * 删除预订
 * 
 * @param id 预订ID
 */
export const deleteBooking = (id: number): Promise<void> => {
  return BookingService.deleteBooking(id);
};

/**
 * 获取可预订的画集列表
 * 
 * @returns 画集简略信息列表
 */
export const getBookableCollections = (): Promise<CollectionSummary[]> => {
  return BookingService.getBookableCollections();
};
