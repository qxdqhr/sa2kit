/**
 * ShowMasterpiece 模块 - 购物车功能Hook
 * 
 * 提供购物车功能相关的状态管理和业务逻辑，包括：
 * - 购物车状态管理
 * - 购物车操作（添加、更新、移除、清空）
 * - 批量预订处理
 * - 错误处理和加载状态
 * 
 * @fileoverview 购物车功能Hook
 */

import { useState, useEffect, useCallback } from 'react';
import { 
  Cart, 
  CartItem, 
  CartState,
  AddToCartRequest,
  UpdateCartItemRequest,
  RemoveFromCartRequest,
  BatchBookingRequest,
  BatchBookingResponse
} from '../types/cart';
import { 
  getCart, 
  addToCart, 
  updateCartItem, 
  removeFromCart, 
  clearCart, 
  batchBooking 
} from '../services';

// 创建一个全局事件系统来通知购物车更新
export const cartUpdateEvents = new EventTarget();
export const CART_UPDATE_EVENT = 'cart-updated';

export const notifyCartUpdate = () => {
  cartUpdateEvents.dispatchEvent(new Event(CART_UPDATE_EVENT));
};

/**
 * 购物车Hook
 * 
 * 管理购物车的状态和业务逻辑
 * 
 * @param userId 用户ID
 * @returns 购物车状态和操作方法
 */
export function useCart(userId: number) {
  const [state, setState] = useState<CartState>({
    cart: {
      items: [],
      totalQuantity: 0,
      totalPrice: 0
    },
    loading: false,
    error: undefined,
    isCartOpen: false
  });

  /**
   * 加载购物车数据
   */
  const loadCart = useCallback(async () => {
    setState(prev => ({ ...prev, loading: true, error: undefined }));
    
    try {
      const cartData = await getCart(userId);
      setState(prev => ({ 
        ...prev, 
        cart: cartData,
        loading: false 
      }));
    } catch (error) {
      console.error('加载购物车失败:', error);
      setState(prev => ({ 
        ...prev, 
        loading: false, 
        error: error instanceof Error ? error.message : '加载购物车失败' 
      }));
    }
  }, [userId]);

  /**
   * 添加商品到购物车
   * 
   * @param request 添加商品请求数据
   */
  const addItemToCart = useCallback(async (request: AddToCartRequest & { userId: number; collection?: any }) => {
    setState(prev => ({ ...prev, loading: true, error: undefined }));
    
    try {
      const updatedCart = await addToCart(request);
      setState(prev => ({ 
        ...prev, 
        cart: updatedCart,
        loading: false 
      }));
      // 通知其他组件购物车已更新
      notifyCartUpdate();
    } catch (error) {
      console.error('添加到购物车失败:', error);
      setState(prev => ({ 
        ...prev, 
        loading: false, 
        error: error instanceof Error ? error.message : '添加到购物车失败' 
      }));
    }
  }, [userId]);

  /**
   * 更新购物车商品数量
   * 
   * @param collectionId 画集ID
   * @param quantity 新数量
   */
  const updateItemQuantity = useCallback(async (collectionId: number, quantity: number) => {
    if (quantity <= 0) {
      await removeItemFromCart(collectionId);
      return;
    }

    setState(prev => ({ ...prev, loading: true, error: undefined }));
    
    try {
      const request: UpdateCartItemRequest & { userId: number } = {
        userId,
        collectionId,
        quantity
      };

      const updatedCart = await updateCartItem(request);
      setState(prev => ({ 
        ...prev, 
        cart: updatedCart,
        loading: false 
      }));
      // 通知其他组件购物车已更新
      notifyCartUpdate();
    } catch (error) {
      console.error('更新购物车失败:', error);
      setState(prev => ({ 
        ...prev, 
        loading: false, 
        error: error instanceof Error ? error.message : '更新购物车失败' 
      }));
    }
  }, [userId]);

  /**
   * 从购物车移除商品
   * 
   * @param collectionId 画集ID
   */
  const removeItemFromCart = useCallback(async (collectionId: number) => {
    setState(prev => ({ ...prev, loading: true, error: undefined }));
    
    try {
      const request: RemoveFromCartRequest & { userId: number } = {
        userId,
        collectionId
      };

      const updatedCart = await removeFromCart(request);
      setState(prev => ({ 
        ...prev, 
        cart: updatedCart,
        loading: false 
      }));
      // 通知其他组件购物车已更新
      notifyCartUpdate();
    } catch (error) {
      console.error('从购物车移除失败:', error);
      setState(prev => ({ 
        ...prev, 
        loading: false, 
        error: error instanceof Error ? error.message : '从购物车移除失败' 
      }));
    }
  }, [userId]);

  /**
   * 清空购物车
   */
  const clearCartItems = useCallback(async () => {
    setState(prev => ({ ...prev, loading: true, error: undefined }));
    
    try {
      await clearCart(userId);
      setState(prev => ({ 
        ...prev, 
        cart: { items: [], totalQuantity: 0, totalPrice: 0 },
        loading: false 
      }));
      // 通知其他组件购物车已更新
      notifyCartUpdate();
    } catch (error) {
      console.error('清空购物车失败:', error);
      setState(prev => ({ 
        ...prev, 
        loading: false, 
        error: error instanceof Error ? error.message : '清空购物车失败' 
      }));
    }
  }, [userId]);

  /**
   * 批量预订购物车中的商品
   * 
   * @param qqNumber QQ号
   * @param phoneNumber 手机号
   * @param notes 备注
   * @param pickupMethod 领取方式
   */
  const checkoutCart = useCallback(async (qqNumber: string, phoneNumber: string, notes?: string, pickupMethod: string = ''): Promise<BatchBookingResponse> => {
    setState(prev => ({ ...prev, loading: true, error: undefined }));
    
    try {
      const request: BatchBookingRequest = {
        qqNumber,
        phoneNumber,
        items: state.cart.items.map(item => ({
          collectionId: item.collectionId,
          quantity: item.quantity
        })),
        notes,
        pickupMethod
      };

      const result = await batchBooking(request, state.cart);
      
      // 预订成功后清空购物车
      if (result.successCount > 0) {
        await clearCartItems();
      }
      
      setState(prev => ({ ...prev, loading: false }));
      return result;
    } catch (error) {
      console.error('批量预订失败:', error);
      setState(prev => ({ 
        ...prev, 
        loading: false, 
        error: error instanceof Error ? error.message : '批量预订失败' 
      }));
      throw error;
    }
  }, [state.cart.items, clearCartItems]);

  /**
   * 打开购物车弹窗
   */
  const openCart = useCallback(() => {
    setState(prev => ({ ...prev, isCartOpen: true }));
  }, []);

  /**
   * 关闭购物车弹窗
   */
  const closeCart = useCallback(() => {
    setState(prev => ({ ...prev, isCartOpen: false }));
  }, []);

  /**
   * 清除错误信息
   */
  const clearError = useCallback(() => {
    setState(prev => ({ ...prev, error: undefined }));
  }, []);

  // 组件挂载时加载购物车数据
  useEffect(() => {
    if (userId) {
      loadCart();
    }
  }, [userId, loadCart]);

  return {
    // 状态
    cart: state.cart,
    loading: state.loading,
    error: state.error,
    isCartOpen: state.isCartOpen,
    
    // 操作方法
    loadCart,
    addItemToCart,
    updateItemQuantity,
    removeItemFromCart,
    clearCartItems,
    checkoutCart,
    openCart,
    closeCart,
    clearError,
  };
} 