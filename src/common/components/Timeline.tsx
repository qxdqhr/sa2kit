'use client';

import React from 'react';

// Timeline相关的类型定义
export interface TimelineItem {
  date: string;
  title: string;
  description: string;
}

export interface TimelineConfig {
  items: TimelineItem[];
}

interface TimelineProps {
  items?: TimelineItem[];
}

export const Timeline: React.FC<TimelineProps> = ({ items = [] }) => {
  if (!items || items.length === 0) {
    return null;
  }

  return (
    <div className="relative">
      {/* 时间线 */}
      <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-gray-200"></div>
      
      {/* 时间线项目 */}
      {items.map((item, index) => (
        <div key={index} className="relative pl-12 pb-8">
          {/* 时间点 */}
          <div className="absolute left-0 w-8 h-8 rounded-full bg-blue-500 border-4 border-white shadow-md flex items-center justify-center">
            <div className="w-2 h-2 rounded-full bg-white"></div>
          </div>
          
          {/* 内容 */}
          <div className="bg-white rounded-lg p-4 shadow-md">
            <div className="text-sm text-gray-500 mb-2">{item.date}</div>
            <h4 className="text-lg font-semibold mb-2">{item.title}</h4>
            <p className="text-gray-600">{item.description}</p>
          </div>
        </div>
      ))}
    </div>
  );
};

export default Timeline;
