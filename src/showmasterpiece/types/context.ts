/**
 * ShowMasterpiece 模块 - 上下文类型定义
 * 
 * 这个文件定义了ShowMasterpiece模块中所有上下文相关的TypeScript类型。
 * 将类型定义独立出来可以避免循环依赖问题。
 * 
 * @fileoverview 上下文类型定义
 */

import { Cart, AddToCartRequest, UpdateCartItemRequest, RemoveFromCartRequest, BatchBookingRequest, BatchBookingResponse } from './cart';

/**
 * 购物车上下文状态接口
 */
export interface CartContextState {
  /** 购物车数据 */
  cart: Cart;
  
  /** 加载状态 */
  loading: boolean;
  
  /** 错误信息 */
  error: string | undefined;
  
  /** 刷新购物车数据 */
  refreshCart: () => Promise<void>;
  
  /** 添加商品到购物车（活动感知） */
  addToCart: (request: AddToCartRequest & { collection?: any }) => Promise<void>;
  
  /** 更新购物车商品数量（活动感知） */
  updateCartItem: (request: UpdateCartItemRequest) => Promise<void>;
  
  /** 从购物车移除商品（活动感知） */
  removeFromCart: (request: RemoveFromCartRequest) => Promise<void>;
  
  /** 批量预订购物车商品（活动感知） */
  batchBooking: (request: BatchBookingRequest) => Promise<BatchBookingResponse>;
  
  /** 清空购物车（活动感知） */
  clearCart: () => Promise<void>;
}
