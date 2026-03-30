import type { ArtCollection } from '../../types';
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

export type HttpMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';

export interface RequestOptions {
  url: string;
  method: HttpMethod;
  data?: unknown;
  headers?: Record<string, string>;
}

export type RequestExecutor = <T = any>(options: RequestOptions) => Promise<T>;

export type CollectionOverview = Omit<ArtCollection, 'pages'> & { pages?: ArtCollection['pages'] };

export interface ShowmasterpieceClient {
  getCollectionsOverview: () => Promise<CollectionOverview[]>;
  getCategories: () => Promise<CategoryOption[]>;
  getBookableCollections: () => Promise<CollectionSummary[]>;
  createBooking: (payload: CreateBookingRequest) => Promise<Booking>;
  batchBooking: (payload: BatchBookingRequest) => Promise<BatchBookingResponse>;
  getBookings: (params: BookingListParams) => Promise<BookingListResponse>;
  checkPopupConfigs: (params: {
    businessModule: string;
    businessScene: string;
    currentTime?: string;
  }) => Promise<PopupConfig[]>;
}

const joinUrl = (baseUrl: string, path: string): string => {
  if (!baseUrl) return path;
  return `${baseUrl.replace(/\/$/, '')}${path}`;
};

const toSearchParams = (params: BookingListParams): string => {
  const searchParams = new URLSearchParams();

  if (params.collectionId) searchParams.set('collectionId', String(params.collectionId));
  if (params.qqNumber) searchParams.set('qqNumber', params.qqNumber);
  if (params.phoneNumber) searchParams.set('phoneNumber', params.phoneNumber);
  if (params.status) searchParams.set('status', params.status);
  if (params.page) searchParams.set('page', String(params.page));
  if (params.limit) searchParams.set('limit', String(params.limit));

  return searchParams.toString();
};

const extractArrayData = <T>(data: any): T[] => {
  if (Array.isArray(data?.data)) return data.data as T[];
  if (Array.isArray(data?.collections)) return data.collections as T[];
  if (Array.isArray(data?.configs)) return data.configs as T[];
  if (Array.isArray(data?.data?.configs)) return data.data.configs as T[];
  if (Array.isArray(data)) return data as T[];
  return [];
};

export const createShowmasterpieceClient = (
  request: RequestExecutor,
  baseUrl: string,
): ShowmasterpieceClient => {
  return {
    getCollectionsOverview: async () => {
      const url = joinUrl(baseUrl, '/api/showmasterpiece/collections?overview=true');
      const data = await request<any>({ url, method: 'GET' });
      const collections = extractArrayData<CollectionOverview>(data);
      if (!Array.isArray(collections)) {
        throw new Error('API响应格式错误');
      }
      return collections;
    },

    getCategories: async () => {
      const url = joinUrl(baseUrl, '/api/showmasterpiece/categories');
      const data = await request<any>({ url, method: 'GET' });
      const categories = extractArrayData<CategoryOption>(data);
      if (!Array.isArray(categories)) {
        throw new Error('API响应格式错误');
      }
      return categories;
    },

    getBookableCollections: async () => {
      const url = joinUrl(baseUrl, '/api/showmasterpiece/bookings/collections');
      const data = await request<any>({ url, method: 'GET' });
      const collections = extractArrayData<CollectionSummary>(data);
      if (!Array.isArray(collections)) {
        throw new Error('API响应格式错误');
      }
      return collections;
    },

    createBooking: async (payload) => {
      const url = joinUrl(baseUrl, '/api/showmasterpiece/bookings');
      return request<Booking>({
        url,
        method: 'POST',
        data: payload,
      });
    },

    batchBooking: async (payload) => {
      const url = joinUrl(baseUrl, '/api/showmasterpiece/bookings/batch');
      return request<BatchBookingResponse>({
        url,
        method: 'POST',
        data: payload,
      });
    },

    getBookings: async (params) => {
      const query = toSearchParams(params);
      const path = query
        ? `/api/showmasterpiece/bookings?${query}`
        : '/api/showmasterpiece/bookings';
      const url = joinUrl(baseUrl, path);
      return request<BookingListResponse>({
        url,
        method: 'GET',
      });
    },

    checkPopupConfigs: async (params) => {
      const url = joinUrl(baseUrl, '/api/showmasterpiece/popup-configs/check');
      const data = await request<any>({
        url,
        method: 'POST',
        data: {
          businessModule: params.businessModule,
          businessScene: params.businessScene,
          currentTime: params.currentTime || new Date().toISOString(),
        },
      });
      return extractArrayData<PopupConfig>(data);
    },
  };
};
