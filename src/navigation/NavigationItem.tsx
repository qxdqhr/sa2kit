 'use client';

import React from 'react';
import { NavigationItem, NavigationDirection } from './types';

interface NavigationItemProps {
  item: NavigationItem;
  direction: NavigationDirection;
  isActive?: boolean;
  onClick: (item: NavigationItem) => void;
}

const NavigationItemComponent: React.FC<NavigationItemProps> = ({
  item,
  direction,
  isActive,
  onClick
}) => {
  const handleClick = (e: React.MouseEvent) => {
    e.preventDefault();
    onClick(item);
  };

  const getItemClasses = () => {
    const baseClasses = `
      group relative flex items-center gap-3
      transition-all duration-300 ease-in-out
      focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50
      rounded-lg
    `;

    const directionClasses = direction === 'vertical'
      ? 'px-4 py-3 w-full justify-start'
      : 'px-3 py-2 justify-center';

    const stateClasses = isActive
      ? 'bg-blue-500 text-white shadow-lg'
      : item.isExternal
        ? 'text-gray-700 hover:bg-purple-50 hover:text-purple-600 border border-purple-200'
        : 'text-gray-700 hover:bg-blue-50 hover:text-blue-600';

    return `${baseClasses} ${directionClasses} ${stateClasses}`;
  };

  return (
    <a
      href={item.href}
      onClick={handleClick}
      target={item.target}
      rel={item.isExternal ? 'noopener noreferrer' : undefined}
      className={getItemClasses()}
    >
      {/* 图标 */}
      {item.icon && (
        <span className="flex-shrink-0">
          {item.icon}
        </span>
      )}

      {/* 标签 */}
      <span className={`font-medium ${direction === 'vertical' ? 'text-sm' : 'text-xs'}`}>
        {item.label}
      </span>

      {/* 外链图标 */}
      {item.isExternal && (
        <svg
          className="w-3 h-3 opacity-60 group-hover:opacity-100 transition-opacity"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
          />
        </svg>
      )}

      {/* 活动状态指示器 */}
      {direction === 'vertical' && isActive && (
        <div className="absolute left-1 top-1/2 transform -translate-y-1/2 w-1 h-6 bg-white rounded-full" />
      )}
    </a>
  );
};

export default NavigationItemComponent;