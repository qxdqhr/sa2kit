/**
 * ShowMasterpiece 模块 - 预订服务
 */

import {
  Booking,
  CreateBookingRequest,
  UpdateBookingRequest,
  BookingListParams,
  BookingListResponse,
  CollectionSummary,
} from '../../types/booking';
import {
  createBooking as createBookingBySharedClient,
  getBookableCollections as getBookableCollectionsBySharedClient,
  getBookings as getBookingsBySharedClient,
} from '../web/client';

export type BookingCredentials = Pick<BookingListParams, 'qqNumber' | 'phoneNumber'>;

function appendBookingCredentials(
  path: string,
  credentials?: BookingCredentials,
): string {
  if (!credentials?.qqNumber?.trim() || !credentials?.phoneNumber?.trim()) {
    return path;
  }
  const params = new URLSearchParams({
    qqNumber: credentials.qqNumber.trim(),
    phoneNumber: credentials.phoneNumber.trim(),
  });
  return `${path}?${params.toString()}`;
}

function bookingCredentialsBody(credentials?: BookingCredentials): string | undefined {
  if (!credentials?.qqNumber?.trim() || !credentials?.phoneNumber?.trim()) {
    return undefined;
  }
  return JSON.stringify({
    qqNumber: credentials.qqNumber.trim(),
    phoneNumber: credentials.phoneNumber.trim(),
  });
}

async function parseErrorMessage(response: Response, fallback: string): Promise<string> {
  const data = await response.json().catch(() => ({}));
  if (typeof data?.error === 'string' && data.error) return data.error;
  if (typeof data?.message === 'string' && data.message) return data.message;
  return fallback;
}

export class BookingService {
  private static readonly BASE_URL = '/api/showmasterpiece/bookings';

  static async createBooking(data: CreateBookingRequest): Promise<Booking> {
    return createBookingBySharedClient(data);
  }

  static async getBookings(params: BookingListParams = {}): Promise<BookingListResponse> {
    return getBookingsBySharedClient(params);
  }

  static async getBooking(
    id: number,
    credentials?: BookingCredentials,
  ): Promise<Booking> {
    const url = appendBookingCredentials(`${this.BASE_URL}/${id}`, credentials);
    const response = await fetch(url);

    if (!response.ok) {
      throw new Error(await parseErrorMessage(response, '获取预订详情失败'));
    }

    return response.json();
  }

  static async updateBooking(id: number, data: UpdateBookingRequest): Promise<Booking> {
    const response = await fetch(`${this.BASE_URL}/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      throw new Error(await parseErrorMessage(response, '更新预订失败'));
    }

    return response.json();
  }

  /**
   * 删除预订（须携带与下单一致的 QQ + 手机号，与 profile-v1 API 约定一致）
   */
  static async deleteBooking(
    id: number,
    credentials: BookingCredentials,
  ): Promise<void> {
    const url = appendBookingCredentials(`${this.BASE_URL}/${id}`, credentials);
    const body = bookingCredentialsBody(credentials);

    const response = await fetch(url, {
      method: 'DELETE',
      headers: body ? { 'Content-Type': 'application/json' } : undefined,
      body,
    });

    if (!response.ok) {
      throw new Error(await parseErrorMessage(response, '删除预订失败'));
    }
  }

  static async getBookableCollections(): Promise<CollectionSummary[]> {
    return getBookableCollectionsBySharedClient();
  }
}

export const createBooking = (data: CreateBookingRequest): Promise<Booking> =>
  BookingService.createBooking(data);

export const getBookings = (params?: BookingListParams): Promise<BookingListResponse> =>
  BookingService.getBookings(params);

export const getBooking = (
  id: number,
  credentials?: BookingCredentials,
): Promise<Booking> => BookingService.getBooking(id, credentials);

export const updateBooking = (id: number, data: UpdateBookingRequest): Promise<Booking> =>
  BookingService.updateBooking(id, data);

export const deleteBooking = (
  id: number,
  credentials: BookingCredentials,
): Promise<void> => BookingService.deleteBooking(id, credentials);

export const getBookableCollections = (): Promise<CollectionSummary[]> =>
  BookingService.getBookableCollections();
