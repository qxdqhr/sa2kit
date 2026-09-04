/** showmasterpiece domain — Phase F 占位（SMP1 继续充实） */

export type BookingStatus = 'pending' | 'confirmed' | 'completed' | 'cancelled';

export const BOOKING_STATUS_LABELS: Record<BookingStatus, string> = {
  pending: '待确认',
  confirmed: '已确认',
  completed: '已完成',
  cancelled: '已取消',
};

export interface CollectionSummary {
  id: number;
  title: string;
  number: string;
  coverImage: string;
  price?: number;
  description?: string;
}

export interface Booking {
  id: number;
  collectionId: number;
  qqNumber: string;
  phoneNumber?: string;
  quantity: number;
  status: BookingStatus;
  notes?: string;
  adminNotes?: string;
  createdAt: string;
  updatedAt: string;
  confirmedAt?: string;
  completedAt?: string;
  cancelledAt?: string;
  collection?: CollectionSummary;
}

export interface CreateBookingRequest {
  collectionId: number;
  qqNumber: string;
  phoneNumber: string;
  quantity: number;
  notes?: string;
}

export interface UpdateBookingRequest {
  status?: BookingStatus;
  notes?: string;
  adminNotes?: string;
  phoneNumber?: string;
  quantity?: number;
}

export interface BookingListParams {
  status?: BookingStatus;
  collectionId?: number;
  qqNumber?: string;
  phoneNumber?: string;
  page?: number;
  pageSize?: number;
}

export interface BookingListResponse {
  items: Booking[];
  total: number;
  page: number;
  pageSize: number;
}

export interface BookingFormData {
  collectionId: number;
  qqNumber: string;
  phoneNumber: string;
  quantity: number;
  notes: string;
}

export interface PopupTriggerConfig {
  deadlineTime?: string;
  advanceMinutes?: number;
  triggerType: 'after_deadline' | 'before_deadline' | 'always';
}

export interface PopupContentConfig {
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  showCancel?: boolean;
  theme?: 'warning' | 'info' | 'error' | 'success';
}

export interface PopupDisplayConfig {
  width?: number;
  height?: number | string;
  maskClosable?: boolean;
  autoCloseSeconds?: number;
}

export interface PopupConfig {
  id: string;
  name: string;
  description?: string | null;
  type: string;
  enabled?: boolean | null;
  triggerConfig: PopupTriggerConfig;
  contentConfig: PopupContentConfig;
  displayConfig?: PopupDisplayConfig | null;
  blockProcess?: boolean | null;
  businessModule: string;
  businessScene: string;
  sortOrder?: string | null;
  createdAt?: string | Date | null;
  updatedAt?: string | Date | null;
}

export type NewPopupConfig = Omit<PopupConfig, 'id' | 'createdAt' | 'updatedAt'>;

export {
  validatePublicBookingLookup,
  bookingMatchesLookup,
} from './bookingAccess';

export {
  buildDefaultHomeTabConfig,
  normalizeHomeTabConfig,
  normalizeMiniappFloatingButtonsConfig,
  defaultMiniappFloatingButtonsConfig,
  type HomeTabConfigItem,
  type MiniappFloatingButtonsConfig,
  type CollectionCategoryType,
} from './homeTabConfig';

/** 权限规则：完整校验在 server / 宿主 Guard（SMP1） */
export function isBookingCancellable(status: BookingStatus): boolean {
  return status === 'pending' || status === 'confirmed';
}
