/**
 * ShowMasterpiece 模块 - 添加到购物车按钮组件
 * 
 * 用于将画集添加到购物车的按钮组件
 * 
 * @fileoverview 添加到购物车按钮组件
 */

'use client';

import React, { useState, useEffect } from 'react';
import { ShoppingCart, Plus, Minus, Check } from 'lucide-react';
import { useCartContext } from '../hooks';
import { ArtCollection } from '../types';

/**
 * 添加到购物车按钮组件属性
 */
interface AddToCartButtonProps {
  /** 画集信息 */
  collection: ArtCollection;
  
  /** 用户ID */
  userId: number;
  
  /** 按钮样式类名 */
  className?: string;
  
  /** 按钮大小 */
  size?: 'sm' | 'md' | 'lg';
  
  /** 是否显示数量选择器 */
  showQuantitySelector?: boolean;
}

/**
 * 添加到购物车按钮组件
 * 
 * @param props 组件属性
 * @returns React组件
 */
export const AddToCartButton: React.FC<AddToCartButtonProps> = ({
  collection,
  userId,
  className = '',
  size = 'md',
  showQuantitySelector = false,
}) => {
  const { cart, addToCart: addToCartContext, updateCartItem: updateCartItemContext, removeFromCart: removeFromCartContext, loading } = useCartContext();
  const [quantity, setQuantity] = useState(1);
  const [isAdded, setIsAdded] = useState(false);

  // 检查当前画集是否已在购物车中
  const cartItem = cart.items.find(item => item.collectionId === collection.id);
  const isInCart = !!cartItem;
  const currentQuantity = cartItem?.quantity || 0;

  // 按钮尺寸样式
  const sizeStyles = {
    sm: 'px-2 py-1 text-sm',
    md: 'px-3 py-2',
    lg: 'px-4 py-3 text-lg',
  };

  // 当购物车数据更新时，同步本地状态
  useEffect(() => {
    if (cartItem) {
      setQuantity(cartItem.quantity);
      setIsAdded(true);
    } else {
      setQuantity(1);
      setIsAdded(false);
    }
  }, [cartItem]);

  /**
   * 处理添加到购物车
   */
  const handleAddToCart = async () => {
    try {
      if (isInCart) {
        // 如果已在购物车中，增加数量 (暂时简化为添加新项)
        // TODO: 实现数量更新逻辑
        await addToCartContext({
          collectionId: collection.id,
          quantity: quantity,
          collection // 传递完整的画集信息
        });
      } else {
        // 如果不在购物车中，添加新项
        await addToCartContext({
          collectionId: collection.id,
          quantity,
          collection // 传递完整的画集信息
        });
      }
      setIsAdded(true);
    } catch (error) {
      console.error('添加到购物车失败:', error);
    }
  };

  /**
   * 处理数量变化
   */
  const handleQuantityChange = (newQuantity: number) => {
    if (newQuantity >= 1) {
      setQuantity(newQuantity);
    }
  };

  /**
   * 处理购物车中商品数量变化
   */
  const handleCartQuantityChange = async (newQuantity: number) => {
    try {
      if (newQuantity <= 0) {
        // 如果数量为0或负数，从购物车中移除
        await removeFromCartContext({
          collectionId: collection.id
        });
      } else {
        // 否则更新数量
        await updateCartItemContext({
          collectionId: collection.id,
          quantity: newQuantity
        });
      }
    } catch (error) {
      console.error('更新购物车数量失败:', error);
    }
  };

  return (
    <div className={`flex flex-col gap-2 ${className}`}>
      {isInCart ? (
        // 已在购物车中的状态
        <div className="flex flex-col gap-2">
          {/* 已添加状态按钮 */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              // 点击"已加入购物车"按钮时不执行任何操作，只阻止事件冒泡
            }}
            disabled={loading}
            className={`flex items-center justify-center gap-2 rounded-lg font-medium transition-colors ${sizeStyles[size]} bg-green-600 text-white disabled:opacity-50`}
          >
            <Check size={16} />
            <span>已加入购物车</span>
          </button>
          
          {/* 数量控制控件 */}
          <div className="flex items-center justify-center border border-gray-300 rounded-lg bg-white">
            <button
              onClick={(e) => {
                e.stopPropagation();
                handleCartQuantityChange(currentQuantity - 1);
              }}
              disabled={loading}
              className="px-2 py-1 hover:bg-gray-50 disabled:opacity-50 transition-colors"
            >
              <Minus size={14} />
            </button>
            <span className="px-3 py-1 min-w-[2rem] text-center font-medium">
              {currentQuantity}
            </span>
            <button
              onClick={(e) => {
                e.stopPropagation();
                handleCartQuantityChange(currentQuantity + 1);
              }}
              disabled={loading}
              className="px-2 py-1 hover:bg-gray-50 transition-colors"
            >
              <Plus size={14} />
            </button>
          </div>
        </div>
      ) : (
        // 未在购物车中的状态
        <div className="flex flex-col gap-2">
          {/* 数量选择器 */}
          {showQuantitySelector && (
            <div className="flex items-center justify-center border border-gray-300 rounded-lg bg-white">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleQuantityChange(quantity - 1);
                }}
                disabled={quantity <= 1 || loading}
                className="px-2 py-1 hover:bg-gray-50 disabled:opacity-50 transition-colors"
              >
                <Minus size={14} />
              </button>
              <span className="px-3 py-1 min-w-[2rem] text-center font-medium">{quantity}</span>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleQuantityChange(quantity + 1);
                }}
                disabled={loading}
                className="px-2 py-1 hover:bg-gray-50 transition-colors"
              >
                <Plus size={14} />
              </button>
            </div>
          )}

          {/* 添加到购物车按钮 */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              handleAddToCart();
            }}
            disabled={loading}
            className={`flex items-center justify-center gap-2 rounded-lg font-medium transition-colors ${sizeStyles[size]} bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50`}
          >
            <ShoppingCart size={16} />
            <span>加入购物车</span>
          </button>
        </div>
      )}
    </div>
  );
}; 