'use client';

import { useContext } from 'react';
import { CartContext } from '../contexts/CartContext';
import type { CartContextState } from '../../types/context';

/**
 * 购物车上下文 Hook
 *
 * 必须在 CartProvider 内使用，否则抛出错误。
 */
export const useCartContext = (): CartContextState => {
  const context = useContext(CartContext) as CartContextState | undefined;
  if (context === undefined) {
    throw new Error('useCartContext must be used within a CartProvider');
  }
  return context;
};
