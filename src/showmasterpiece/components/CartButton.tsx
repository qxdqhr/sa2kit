/**
 * ShowMasterpiece 模块 - 购物车按钮组件
 * 
 * 显示购物车图标和商品数量的按钮组件，点击可打开购物车弹窗
 * 
 * @fileoverview 购物车按钮组件
 */

'use client';

import React from 'react';
import { ShoppingCart } from 'lucide-react';
import { useCartContext } from '../hooks';

/**
 * 购物车按钮组件属性
 */
interface CartButtonProps {
  /** 用户ID */
  userId: number;
  
  /** 点击回调 */
  onClick: () => void;
  
  /** 按钮样式类名 */
  className?: string;
  
  /** 是否显示商品数量 */
  showBadge?: boolean;
}

/**
 * 购物车按钮组件
 * 
 * @param props 组件属性
 * @returns React组件
 */
export const CartButton: React.FC<CartButtonProps> = ({
  userId,
  onClick,
  className = '',
  showBadge = true,
}) => {
  const { cart } = useCartContext();

  return (
    <button
      onClick={onClick}
      className={`relative bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2 ${className}`}
    >
      <ShoppingCart size={16} />
      <span>购物车</span>
      
      {/* 商品数量徽章 */}
      {showBadge && cart.totalQuantity > 0 && (
        <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center font-medium">
          {cart.totalQuantity > 99 ? '99+' : cart.totalQuantity}
        </span>
      )}
    </button>
  );
}; 