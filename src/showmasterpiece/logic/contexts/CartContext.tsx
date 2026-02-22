/**
 * ShowMasterpiece 模块 - 购物车上下文
 * 
 * 提供购物车状态的全局管理，包括：
 * - 购物车数据状态
 * - 购物车数据刷新
 * - 购物车更新通知
 * 
 * @fileoverview 购物车上下文
 */

'use client';

import * as React from 'react';
import type { ReactNode } from 'react';
import { Cart, AddToCartRequest, UpdateCartItemRequest, RemoveFromCartRequest, BatchBookingRequest, BatchBookingResponse } from '../../types/cart';
import { getCart, addToCart, updateCartItem, removeFromCart, batchBooking, clearCart } from '../../services/cartService';
import { cartUpdateEvents, CART_UPDATE_EVENT } from '../hooks';
import type { CartContextState } from '../../types/context';

/**
 * 购物车上下文类型
 */
export const CartContext = React.createContext<CartContextState | undefined>(undefined);

/**
 * 购物车上下文提供者属性
 */
interface CartProviderProps {
  children: ReactNode;
  userId: number;
}

/**
 * 购物车上下文提供者组件
 * 
 * @param props 组件属性
 * @returns React组件
 */
export const CartProvider: React.FC<CartProviderProps> = ({ children, userId }) => {
  const [state, setState] = React.useState<CartContextState>({
    cart: {
      items: [],
      totalQuantity: 0,
      totalPrice: 0
    },
    loading: false,
    error: undefined,
    refreshCart: async () => {},
    addToCart: async () => {},
    updateCartItem: async () => {},
    removeFromCart: async () => {},
    batchBooking: async () => ({ successCount: 0, failCount: 0, bookingIds: [], failures: [] }),
    clearCart: async () => {}
  });

  /**
   * 刷新购物车数据
   */
  const refreshCart = React.useCallback(async () => {
    if (!userId) return;

    setState(prev => ({ ...prev, loading: true, error: undefined }));
    
    try {
      const cartData = await getCart(userId);
      setState(prev => ({ 
        ...prev, 
        cart: cartData,
        loading: false 
      }));
    } catch (error) {
      console.error('刷新购物车失败:', error);
      setState(prev => ({ 
        ...prev, 
        loading: false, 
        error: error instanceof Error ? error.message : '刷新购物车失败' 
      }));
    }
  }, [userId]);

  /**
   * 添加商品到购物车
   */
  const addToCartWithEvent = React.useCallback(async (request: AddToCartRequest & { collection?: any }) => {
    setState(prev => ({ ...prev, loading: true, error: undefined }));
    
    try {
      console.log('🛒 [CartContext] 添加到购物车:', { request, userId });
      
      await addToCart({ ...request, userId });
      
      // 刷新购物车数据
      await refreshCart();
      
      setState(prev => ({ ...prev, loading: false }));
    } catch (error) {
      console.error('添加到购物车失败:', error);
      setState(prev => ({ 
        ...prev, 
        loading: false, 
        error: error instanceof Error ? error.message : '添加到购物车失败' 
      }));
    }
  }, [refreshCart, userId]);

  /**
   * 更新购物车商品数量
   */
  const updateCartItemWithEvent = React.useCallback(async (request: UpdateCartItemRequest) => {
    setState(prev => ({ ...prev, loading: true, error: undefined }));
    
    try {
      console.log('🔢 [CartContext] 更新购物车数量:', { request, userId });
      
      await updateCartItem({ ...request, userId });
      
      // 刷新购物车数据
      await refreshCart();
      
      setState(prev => ({ ...prev, loading: false }));
    } catch (error) {
      console.error('更新购物车数量失败:', error);
      setState(prev => ({ 
        ...prev, 
        loading: false, 
        error: error instanceof Error ? error.message : '更新购物车数量失败' 
      }));
    }
  }, [refreshCart, userId]);

  /**
   * 从购物车移除商品
   */
  const removeFromCartWithEvent = React.useCallback(async (request: RemoveFromCartRequest) => {
    setState(prev => ({ ...prev, loading: true, error: undefined }));
    
    try {
      console.log('🗑️ [CartContext] 移除商品:', { request, userId });
      
      await removeFromCart({ ...request, userId });
      
      // 刷新购物车数据
      await refreshCart();
      
      setState(prev => ({ ...prev, loading: false }));
    } catch (error) {
      console.error('移除商品失败:', error);
      setState(prev => ({ 
        ...prev, 
        loading: false, 
        error: error instanceof Error ? error.message : '移除商品失败' 
      }));
    }
  }, [refreshCart, userId]);

  /**
   * 批量预订购物车商品
   */
  const batchBookingWithEvent = React.useCallback(async (request: BatchBookingRequest): Promise<BatchBookingResponse> => {
    setState(prev => ({ ...prev, loading: true, error: undefined }));
    
    try {
      console.log('📋 [CartContext] 批量预订:', { request, userId });
      
      const result = await batchBooking(request, state.cart);
      
      // 预订成功后刷新购物车（可能需要清空）
      await refreshCart();
      
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
  }, [refreshCart, userId, state.cart]);

  /**
   * 清空购物车
   */
  const clearCartWithEvent = React.useCallback(async () => {
    setState(prev => ({ ...prev, loading: true, error: undefined }));
    
    try {
      console.log('🗑️ [CartContext] 清空购物车:', { userId });
      
      await clearCart(userId);
      
      // 刷新购物车数据
      await refreshCart();
      
      setState(prev => ({ ...prev, loading: false }));
    } catch (error) {
      console.error('清空购物车失败:', error);
      setState(prev => ({ 
        ...prev, 
        loading: false, 
        error: error instanceof Error ? error.message : '清空购物车失败' 
      }));
    }
  }, [refreshCart, userId]);

  // 初始化时加载购物车数据
  React.useEffect(() => {
    refreshCart();
  }, [refreshCart]);

  // 监听购物车更新事件
  React.useEffect(() => {
    const handleCartUpdate = () => {
      refreshCart();
    };

    cartUpdateEvents.addEventListener(CART_UPDATE_EVENT, handleCartUpdate);

    return () => {
      cartUpdateEvents.removeEventListener(CART_UPDATE_EVENT, handleCartUpdate);
    };
  }, [refreshCart]);

  const contextValue: CartContextState = {
    ...state,
    refreshCart,
    addToCart: addToCartWithEvent,
    updateCartItem: updateCartItemWithEvent,
    removeFromCart: removeFromCartWithEvent,
    batchBooking: batchBookingWithEvent,
    clearCart: clearCartWithEvent
  };

  return <CartContext.Provider value={contextValue}>{children}</CartContext.Provider>;
};
