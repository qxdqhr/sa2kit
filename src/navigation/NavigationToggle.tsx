 'use client';

import React from 'react';
import { NavigationPosition } from './types';

interface NavigationToggleProps {
  isOpen: boolean;
  onClick: () => void;
  position: NavigationPosition;
}

const NavigationToggle: React.FC<NavigationToggleProps> = ({
  isOpen,
  onClick,
  position
}) => {
  const getPositionClasses = () => {
    switch (position) {
      case 'top':
        return 'top-4 left-4';
      case 'bottom':
        return 'bottom-4 left-4';
      case 'left':
        return 'top-4 left-4';
      case 'right':
        return 'top-4 right-4';
      default:
        return 'top-4 left-4';
    }
  };

  return (
    <button
      onClick={onClick}
      className={`
        fixed ${getPositionClasses()} z-[100]
        p-3 rounded-xl
        bg-white/90 backdrop-blur-md
        shadow-lg hover:shadow-xl
        border border-gray-200/50
        transition-all duration-300 ease-in-out
        hover:scale-105 active:scale-95
        focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50
      `}
      aria-label={isOpen ? '关闭导航栏' : '打开导航栏'}
    >
      <div className="w-5 h-5 flex flex-col justify-center items-center">
        <span
          className={`
            block w-5 h-0.5 bg-gray-600 rounded-full
            transform transition-all duration-300 ease-in-out
            ${isOpen ? 'rotate-45 translate-y-0.5' : ''}
          `}
        />
        <span
          className={`
            block w-5 h-0.5 bg-gray-600 rounded-full
            transform transition-all duration-300 ease-in-out mt-1
            ${isOpen ? 'opacity-0 scale-0' : 'opacity-100 scale-100'}
          `}
        />
        <span
          className={`
            block w-5 h-0.5 bg-gray-600 rounded-full
            transform transition-all duration-300 ease-in-out mt-1
            ${isOpen ? '-rotate-45 -translate-y-2.5' : ''}
          `}
        />
      </div>
    </button>
  );
};

export default NavigationToggle;