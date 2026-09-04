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

export const DEFAULT_WEB_BASE_URL = '';

const extractErrorMessage = (data: any, fallback: string): string => {
  if (typeof data?.message === 'string' && data.message) return data.message;
  if (typeof data?.error === 'string' && data.error) return data.error;
  return fallback;
};

const createFetchExecutor = () => {
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
    const response = await fetch(url, {
      method,
      headers: {
        'Content-Type': 'application/json',
        ...headers,
      },
      body: data === undefined ? undefined : JSON.stringify(data),
    });

    const payload = await response.json().catch(() => null);

    if (response.ok) {
      return payload as T;
    }

    throw new Error(extractErrorMessage(payload, `请求失败 (${response.status})`));
  };
};

const createClient = (baseUrl = DEFAULT_WEB_BASE_URL) =>
  createShowmasterpieceClient(createFetchExecutor(), baseUrl);

export const getCollectionsOverview = async (baseUrl = DEFAULT_WEB_BASE_URL): Promise<CollectionOverview[]> =>
  createClient(baseUrl).getCollectionsOverview();

export const getBookableCollections = async (baseUrl = DEFAULT_WEB_BASE_URL): Promise<CollectionSummary[]> =>
  createClient(baseUrl).getBookableCollections();

export const createBooking = async (
  payload: CreateBookingRequest,
  baseUrl = DEFAULT_WEB_BASE_URL,
): Promise<Booking> => createClient(baseUrl).createBooking(payload);

export const batchBooking = async (
  payload: BatchBookingRequest,
  baseUrl = DEFAULT_WEB_BASE_URL,
): Promise<BatchBookingResponse> => createClient(baseUrl).batchBooking(payload);

export const getBookings = async (
  params: BookingListParams,
  baseUrl = DEFAULT_WEB_BASE_URL,
): Promise<BookingListResponse> => createClient(baseUrl).getBookings(params);

export const checkPopupConfigs = async (
  params: {
    businessModule: string;
    businessScene: string;
    currentTime?: string;
  },
  baseUrl = DEFAULT_WEB_BASE_URL,
): Promise<PopupConfig[]> => createClient(baseUrl).checkPopupConfigs(params);

export type { CollectionOverview };
