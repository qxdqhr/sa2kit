import Taro from '@tarojs/taro';
import type { CategoryOption } from '../../types';
import type {
  Booking,
  BookingListParams,
  BookingListResponse,
  CollectionSummary,
  CreateBookingRequest,
} from '../../types/booking';
import type { BatchBookingRequest, BatchBookingResponse } from '../../types/cart';
import type { PopupConfig } from '../../types/popup';
import { createShowmasterpieceClient, type CollectionOverview } from '../api';

export const DEFAULT_BASE_URL = 'https://qhr062.top';

const extractErrorMessage = (data: any, fallback: string): string => {
  if (typeof data?.message === 'string' && data.message) return data.message;
  if (typeof data?.error === 'string' && data.error) return data.error;
  return fallback;
};

const createTaroExecutor = () => {
  return async <T>({
    url,
    method,
    data,
    headers,
  }: {
    url: string;
    method: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
    data?: unknown;
    headers?: Record<string, string>;
  }): Promise<T> => {
    const response = await Taro.request({
      url,
      method,
      data,
      header: {
        'Content-Type': 'application/json',
        ...headers,
      },
    });

    if (response.statusCode >= 200 && response.statusCode < 300) {
      return response.data as T;
    }

    throw new Error(extractErrorMessage(response.data, `请求失败 (${response.statusCode})`));
  };
};

const createClient = (baseUrl = DEFAULT_BASE_URL) =>
  createShowmasterpieceClient(createTaroExecutor(), baseUrl);

export const getCollectionsOverview = async (baseUrl = DEFAULT_BASE_URL): Promise<CollectionOverview[]> =>
  createClient(baseUrl).getCollectionsOverview();

export const getCategories = async (baseUrl = DEFAULT_BASE_URL): Promise<CategoryOption[]> =>
  createClient(baseUrl).getCategories();

export const getBookableCollections = async (baseUrl = DEFAULT_BASE_URL): Promise<CollectionSummary[]> =>
  createClient(baseUrl).getBookableCollections();

export const createBooking = async (
  payload: CreateBookingRequest,
  baseUrl = DEFAULT_BASE_URL,
): Promise<Booking> => createClient(baseUrl).createBooking(payload);

export const batchBooking = async (
  payload: BatchBookingRequest,
  baseUrl = DEFAULT_BASE_URL,
): Promise<BatchBookingResponse> => createClient(baseUrl).batchBooking(payload);

export const getBookings = async (
  params: BookingListParams,
  baseUrl = DEFAULT_BASE_URL,
): Promise<BookingListResponse> => createClient(baseUrl).getBookings(params);

export const checkPopupConfigs = async (
  params: {
    businessModule: string;
    businessScene: string;
    currentTime?: string;
  },
  baseUrl = DEFAULT_BASE_URL,
): Promise<PopupConfig[]> => createClient(baseUrl).checkPopupConfigs(params);

export type { CollectionOverview };
