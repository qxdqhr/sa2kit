'use client';

import React from 'react';
import type { TabData } from '../../../domain/types';

interface TabNavigationProps {
  tabs: TabData[];
  activeTab: string;
  onTabChange: (tabId: string) => void;
  className?: string;
}

const TabButton: React.FC<{
  tab: TabData;
  isActive: boolean;
  onClick: () => void;
}> = ({ tab, isActive, onClick }) => {
  const baseStyle = {
    padding: '16px 20px',
    fontSize: '14px',
    fontWeight: isActive ? '600' : '500',
    borderBottomWidth: '3px',
    transition: 'all 200ms ease',
    minWidth: 'max-content',
    flexShrink: 0,
    whiteSpace: 'nowrap' as const,
  };

  const activeStyle = {
    borderBottomColor: '#ff7849',
    color: '#ea580c',
    backgroundColor: 'rgba(255, 120, 73, 0.05)',
  };

  const inactiveStyle = {
    borderBottomColor: 'transparent',
    color: '#475569',
    backgroundColor: 'transparent',
  };

  return (
    <button
      onClick={onClick}
      style={{
        ...baseStyle,
        ...(isActive ? activeStyle : inactiveStyle),
      }}
      className={`${
        isActive ? '' : 'hover:text-orange-500 hover:bg-gray-50'
      } transition-all duration-200`}
    >
      {tab.text}
    </button>
  );
};

export const TabNavigation: React.FC<TabNavigationProps> = ({
  tabs,
  activeTab,
  onTabChange,
  className = '',
}) => {
  return (
    <div
      className={`bg-white w-full ${className}`}
      style={{
        borderBottomWidth: '1px',
        borderBottomColor: '#f1f5f9',
      }}
    >
      <div
        className="flex overflow-x-auto overflow-y-hidden tab-scroll-container"
        style={{
          padding: '0 12px',
          width: '100%',
        }}
      >
        {tabs.map((tab) => (
          <TabButton
            key={tab.id}
            tab={tab}
            isActive={activeTab === tab.id}
            onClick={() => onTabChange(tab.id)}
          />
        ))}
      </div>

      <style jsx>{`
        .tab-scroll-container {
          -webkit-overflow-scrolling: touch;
          scrollbar-width: none;
          -ms-overflow-style: none;
        }
        .tab-scroll-container::-webkit-scrollbar {
          display: none;
          width: 0;
          height: 0;
        }
      `}</style>
    </div>
  );
};
