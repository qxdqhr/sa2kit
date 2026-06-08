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
import { useCartContext } from '../../../logic/hooks';
import { sm, smCn } from '../../shared/theme';

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
      className={smCn(
        'relative flex items-center gap-2 px-4 py-2 text-white',
        sm.webBtnPrimary,
        className,
      )}
    >
      <ShoppingCart size={16} />
      <span>购物车</span>
      
      {/* 商品数量徽章 */}
      {showBadge && cart.totalQuantity > 0 && (
        <span className="absolute -right-2 -top-2 flex h-5 w-5 items-center justify-center rounded-full bg-rose-500 text-xs font-semibold tabular-nums text-white shadow-sm">
          {cart.totalQuantity > 99 ? '99+' : cart.totalQuantity}
        </span>
      )}
    </button>
  );
}; 
