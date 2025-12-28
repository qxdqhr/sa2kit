 'use client';

import React from 'react';
import NavigationItem from './NavigationItem';
import { NavigationProps } from './types';

const Navigation: React.FC<NavigationProps> = ({
  config,
  isOpen,
  activeItemId,
  onItemClick,
  className = ''
}) => {
  const { direction, position, items, avatar, logo } = config;

  // 获取导航栏位置和尺寸样式
  const getContainerClasses = () => {
    const baseClasses = `
      fixed z-[90]
      bg-white/95 backdrop-blur-lg
      border border-gray-200/50
      shadow-2xl
      transition-all duration-500 ease-in-out
    `;

    // 根据方向和位置确定样式
    if (direction === 'vertical') {
      const verticalClasses = 'h-screen w-64 flex flex-col';
      const positionClasses = position === 'left' 
        ? `left-0 top-0 ${isOpen ? 'translate-x-0' : '-translate-x-full'}`
        : `right-0 top-0 ${isOpen ? 'translate-x-0' : 'translate-x-full'}`;
      
      return `${baseClasses} ${verticalClasses} ${positionClasses}`;
    } else {
      const horizontalClasses = 'w-full h-16 flex items-center';
      const positionClasses = position === 'top'
        ? `top-0 left-0 right-0 ${isOpen ? 'translate-y-0' : '-translate-y-full'}`
        : `bottom-0 left-0 right-0 ${isOpen ? 'translate-y-0' : 'translate-y-full'}`;
      
      return `${baseClasses} ${horizontalClasses} ${positionClasses}`;
    }
  };

  // 获取内容布局样式
  const getContentClasses = () => {
    if (direction === 'vertical') {
      return 'flex flex-col h-full p-4';
    } else {
      return 'flex items-center justify-between w-full px-6';
    }
  };

  // 获取导航项列表样式
  const getItemsListClasses = () => {
    if (direction === 'vertical') {
      return 'flex flex-col gap-2 flex-1 overflow-y-auto mt-4';
    } else {
      return 'flex items-center gap-4';
    }
  };

  const handleItemClick = (item: any) => {
    // 处理页面跳转
    if (item.isExternal) {
      // 外链跳转
      window.open(item.href, item.target || '_blank');
    } else if (item.href.startsWith('#')) {
      // 锚点跳转
      const element = document.getElementById(item.id);
      if (element) {
        element.scrollIntoView({ behavior: 'smooth' });
      }
    } else {
      // 内部页面跳转
      window.location.href = item.href;
    }

    // 触发回调
    onItemClick?.(item);
  };

  if (!isOpen) return null;

  return (
    <nav className={`${getContainerClasses()} ${className}`}>
      <div className={getContentClasses()}>
        {/* Logo 区域 */}
        {logo && (
          <div className="flex items-center justify-center mb-4">
            <img
              src={logo.src}
              alt={logo.alt || 'Logo'}
              className="h-8 w-auto"
            />
          </div>
        )}

        {/* 顶部空间占位（为切换按钮预留） */}
        {direction === 'vertical' && (
          <div className="h-12 flex-shrink-0" />
        )}

        {/* 导航项列表 */}
        <div className={getItemsListClasses()}>
          {items.map((item) => (
            <NavigationItem
              key={item.id}
              item={item}
              direction={direction}
              isActive={activeItemId === item.id}
              onClick={handleItemClick}
            />
          ))}
        </div>

        {/* 头像区域 */}
        {avatar && direction === 'vertical' && (
          <div className="flex items-center justify-center mt-auto pt-4">
            <img
              src={avatar.src}
              alt={avatar.alt || 'Avatar'}
              className="w-10 h-10 rounded-full border-2 border-gray-200"
            />
          </div>
        )}

        {/* 水平布局的头像 */}
        {avatar && direction === 'horizontal' && (
          <div className="flex items-center">
            <img
              src={avatar.src}
              alt={avatar.alt || 'Avatar'}
              className="w-8 h-8 rounded-full border-2 border-gray-200"
            />
          </div>
        )}
      </div>
    </nav>
  );
};

export default Navigation;