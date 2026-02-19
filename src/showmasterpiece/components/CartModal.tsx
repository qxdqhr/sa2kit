/**
 * ShowMasterpiece 模块 - 购物车弹窗组件
 *
 * @fileoverview 购物车弹窗组件
 */

'use client';

import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';
import { CartPage } from './CartPage';

/**
 * 购物车弹窗组件属性
 */
interface CartModalProps {
  /** 用户ID */
  userId: number;
  
  /** 是否显示弹窗 */
  isOpen: boolean;
  
  /** 关闭弹窗回调 */
  onClose: () => void;
  
  /** 弹窗标题 */
  title?: string;
  
  /** 弹窗宽度 */
  width?: number | string;
  
  /** 弹窗高度 */
  height?: number | string;
  
}

/**
 * 购物车弹窗组件
 *
 * @param props 组件属性
 * @returns React组件
 */
export const CartModal: React.FC<CartModalProps> = ({
  userId,
  isOpen,
  onClose,
  title = '购物车',
  width = '90vw',
  height = '90vh',
}) => {
  const [mounted, setMounted] = useState(false);

  // 确保在客户端渲染
  useEffect(() => {
    setMounted(true);
  }, []);

  // 弹窗显示/隐藏时控制底层页面滚动
  useEffect(() => {
    if (isOpen && mounted) {
      // 弹窗打开时，禁止底层页面滚动
      document.body.style.overflow = 'hidden';
      document.body.style.paddingRight = 'var(--scrollbar-width, 0px)';
    } else {
      // 弹窗关闭时，恢复底层页面滚动
      document.body.style.overflow = '';
      document.body.style.paddingRight = '';
    }

    // 组件卸载时恢复
    return () => {
      document.body.style.overflow = '';
      document.body.style.paddingRight = '';
    };
  }, [isOpen, mounted]);

  // 处理遮罩层点击
  const handleOverlayClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  // 拦截滚轮事件穿透
  const handleWheelPrevent = (e: React.WheelEvent) => {
    const target = e.target as HTMLElement;

    // 检查是否滚动到顶部/底部
    const isAtTop = target.scrollTop === 0;
    const isAtBottom = target.scrollHeight - target.scrollTop === target.clientHeight;

    // 如果在顶部向上滚动 或 在底部向下滚动，阻止事件默认行为
    if ((isAtTop && e.deltaY < 0) || (isAtBottom && e.deltaY > 0)) {
      e.preventDefault();
      e.stopPropagation();
    }
  };

  // 拦截触摸滚动事件穿透
  const handleTouchPrevent = (e: React.TouchEvent) => {
    const target = e.target as HTMLElement;

    // 检查是否滚动到顶部/底部
    const isAtTop = target.scrollTop === 0;
    const isAtBottom = target.scrollHeight - target.scrollTop === target.clientHeight;

    // 如果已经到顶或到底，阻止触摸移动事件穿透
    if (isAtTop || isAtBottom) {
      e.stopPropagation();
    }
  };

  // 如果未挂载或未打开，不渲染
  if (!isOpen || !mounted) return null;

  return (
    <>
      {/* 遮罩层 */}
      <div
        className="fixed top-0 left-0 right-0 bottom-0 w-screen h-screen bg-black/50 backdrop-blur-sm flex items-center justify-center z-[999] p-4"
        style={{ margin: 0 }}
        onClick={handleOverlayClick}
        // 拦截遮罩层的滚动事件
        onWheel={(e) => {
          e.preventDefault();
          e.stopPropagation();
        }}
      >
        {/* 模态框主体 */}
        <div
          className="bg-white rounded-2xl shadow-xl w-full max-w-6xl max-h-[95vh] overflow-hidden relative flex flex-col"
          onClick={(e) => e.stopPropagation()}
        >
          {/* 头部 */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
            <h2 className="text-xl font-semibold text-gray-800">{title}</h2>
            {/* 关闭按钮 */}
            <button
              className="bg-transparent border-none text-gray-500 cursor-pointer p-2 rounded-lg transition-all hover:bg-gray-100 hover:text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 min-w-9 min-h-9 flex items-center justify-center"
              onClick={onClose}
            >
              <X size={20} />
            </button>
          </div>

          {/* 内容区域 - 增加滚动事件拦截 */}
          <div
            className="flex-1 overflow-auto"  // 改为 overflow-auto 更合适
            onWheel={handleWheelPrevent}    // 拦截滚轮穿透
            onTouchMove={handleTouchPrevent} // 处理移动端触摸滚动
          >
            <CartPage userId={userId} onClose={onClose} />
          </div>
        </div>
      </div>
    </>
  );
};
