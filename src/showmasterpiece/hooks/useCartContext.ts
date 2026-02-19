/**
 * ShowMasterpiece 模块 - 购物车上下文Hook
 * 
 * 提供购物车上下文状态的访问Hook，用于在组件中获取购物车相关的状态和操作。
 * 这个Hook必须在CartProvider包装的组件内使用。
 * 
 * 主要功能：
 * - 获取购物车数据
 * - 获取加载状态
 * - 获取错误信息
 * - 提供刷新购物车的方法
 * 
 * @fileoverview 购物车上下文Hook
 */

'use client';

import { useContext } from 'react';
import type { CartContextState } from '../types/context';

/**
 * 使用购物车上下文Hook
 * 
 * 这个Hook用于在组件中访问购物车上下文状态。
 * 必须在CartProvider包装的组件内使用，否则会抛出错误。
 * 
 * @returns 购物车上下文状态，包含购物车数据、加载状态、错误信息和刷新方法
 * @throws {Error} 当在CartProvider外部使用时抛出错误
 * 
 * @example
 * ```tsx
 * function CartButton() {
 *   const { cart, loading, error, refreshCart } = useCartContext();
 *   
 *   if (loading) return <div>加载中...</div>;
 *   if (error) return <div>错误: {error}</div>;
 *   
 *   return (
 *     <button onClick={refreshCart}>
 *       购物车 ({cart.totalQuantity})
 *     </button>
 *   );
 * }
 * ```
 */
export const useCartContext = (): CartContextState => {
  // 动态导入 CartContext 以避免循环依赖
  let CartContext: any;
  try {
    const contextModule = require('../contexts/CartContext');
    CartContext = contextModule.CartContext;
  } catch (error) {
    throw new Error('Failed to load CartContext. Make sure CartProvider is properly set up.');
  }
  
  const context = useContext(CartContext) as unknown as CartContextState | undefined;
  if (context === undefined) {
    throw new Error('useCartContext must be used within a CartProvider');
  }
  return context;
};
