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
} from '../../types/booking';
import {
  createBooking as createBookingBySharedClient,
  getBookableCollections as getBookableCollectionsBySharedClient,
  getBookings as getBookingsBySharedClient,
} from '../web/client';

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
    return createBookingBySharedClient(data);
  }

  /**
   * 获取预订列表
   * 
   * @param params 查询参数
   * @returns 预订列表和分页信息
   */
  static async getBookings(params: BookingListParams = {}): Promise<BookingListResponse> {
    return getBookingsBySharedClient(params);
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
    return getBookableCollectionsBySharedClient();
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
