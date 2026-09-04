/**
 * ShowMasterpiece 模块 - 预订功能类型定义
 * 
 * 定义了画集预订功能相关的TypeScript类型，包括：
 * - 预订数据模型
 * - API请求和响应类型
 * - 表单数据类型
 * - 状态枚举
 * 
 * @fileoverview 预订功能类型定义
 */

import { ArtCollection } from './index';

/**
 * 预订状态枚举
 */
export type BookingStatus = 'pending' | 'confirmed' | 'completed' | 'cancelled';

/**
 * 预订状态显示文本映射
 */
export const BOOKING_STATUS_LABELS: Record<BookingStatus, string> = {
  pending: '待确认',
  confirmed: '已确认',
  completed: '已完成',
  cancelled: '已取消'
};

/**
 * 预订状态颜色映射
 */
export const BOOKING_STATUS_COLORS: Record<BookingStatus, string> = {
  pending: 'bg-yellow-100 text-yellow-800',
  confirmed: 'bg-blue-100 text-blue-800',
  completed: 'bg-green-100 text-green-800',
  cancelled: 'bg-red-100 text-red-800'
};

/**
 * 预订数据模型
 */
export interface Booking {
  /** 预订ID */
  id: number;
  
  /** 画集ID */
  collectionId: number;
  
  /** 用户QQ号 */
  qqNumber: string;
  
  /** 用户手机号 */
  phoneNumber?: string;
  
  /** 预订数量 */
  quantity: number;
  
  /** 预订状态 */
  status: BookingStatus;
  
  /** 预订备注 */
  notes?: string;
  
  /** 管理员备注 */
  adminNotes?: string;
  
  /** 预订时间 */
  createdAt: string;
  
  /** 更新时间 */
  updatedAt: string;
  
  /** 确认时间 */
  confirmedAt?: string;
  
  /** 完成时间 */
  completedAt?: string;
  
  /** 取消时间 */
  cancelledAt?: string;
  
  /** 关联的画集信息 */
  collection?: ArtCollection;
}

/**
 * 创建预订请求数据
 */
export interface CreateBookingRequest {
  /** 画集ID */
  collectionId: number;
  
  /** 用户QQ号 */
  qqNumber: string;
  
  /** 用户手机号 */
  phoneNumber: string;
  
  /** 预订数量 */
  quantity: number;
  
  /** 预订备注 */
  notes?: string;
}

/**
 * 更新预订请求数据
 */
export interface UpdateBookingRequest {
  /** 预订状态 */
  status?: BookingStatus;
  
  /** 管理员备注 */
  adminNotes?: string;
}

/**
 * 预订列表查询参数
 */
export interface BookingListParams {
  /** 画集ID过滤 */
  collectionId?: number;
  
  /** QQ号过滤 */
  qqNumber?: string;
  
  /** 手机号过滤 */
  phoneNumber?: string;
  
  /** 状态过滤 */
  status?: BookingStatus;
  
  /** 页码 */
  page?: number;
  
  /** 每页数量 */
  limit?: number;
}

/**
 * 预订列表响应
 */
export interface BookingListResponse {
  /** 预订列表 */
  bookings: Booking[];
  
  /** 总数 */
  total: number;
  
  /** 当前页 */
  page: number;
  
  /** 每页数量 */
  limit: number;
  
  /** 总页数 */
  totalPages: number;
}

/**
 * 预订表单数据
 */
export interface BookingFormData {
  /** 画集ID */
  collectionId: number;
  
  /** 用户QQ号 */
  qqNumber: string;
  
  /** 用户手机号 */
  phoneNumber: string;
  
  /** 预订数量 */
  quantity: number;
  
  /** 预订备注 */
  notes: string;
}

/**
 * 画集简略信息（用于预订页面展示）
 */
export interface CollectionSummary {
  /** 画集ID */
  id: number;
  
  /** 画集标题 */
  title: string;
  
  /** 编号 */
  number: string;
  
  /** 封面图片 */
  coverImage: string;
  
  /** 价格（单位：元） */
  price?: number;
  
  /** 画集描述 */
  description?: string;
}

/**
 * 预订页面状态
 */
export interface BookingPageState {
  /** 画集列表 */
  collections: CollectionSummary[];
  
  /** 加载状态 */
  loading: boolean;
  
  /** 错误信息 */
  error?: string;
  
  /** 提交状态 */
  submitting: boolean;
  
  /** 提交成功状态 */
  submitted: boolean;
} 