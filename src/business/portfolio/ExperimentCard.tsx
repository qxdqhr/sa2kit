'use client';

import React from 'react';
import Link from 'next/link';
import { cn } from '@/common/utils';

export interface ExperimentCardProps {
  href: string;
  title: string;
  description: string;
  tags: string[];
  category: 'utility' | 'leisure';
  isCompleted?: boolean;
  updatedAt?: string;
  createdAt?: string;
  className?: string;
}

export const ExperimentCard: React.FC<ExperimentCardProps> = ({ 
  href, 
  title, 
  description, 
  tags, 
  category, 
  isCompleted,
  updatedAt,
  createdAt,
  className
}) => {
  // 格式化日期显示
  const formatDate = (dateString?: string) => {
    if (!dateString) return '';
    
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('zh-CN', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit'
      });
    } catch (e) {
      return dateString;
    }
  };
  
  return (
    <Link href={href} className={cn("block group", className)}>
      <div className="w-full h-full bg-white rounded-2xl overflow-hidden shadow-md hover:shadow-2xl transition-all duration-300 transform group-hover:-translate-y-1 border border-gray-100 hover:border-gray-200">
        <div className="p-6">
          <div className="flex items-start justify-between mb-4">
            <h3 className="text-xl font-semibold text-gray-900 flex-1 pr-4 leading-tight">
              {title}
            </h3>
            <div className="flex flex-col gap-2 flex-shrink-0">
              <span className={cn(
                "px-3 py-1.5 text-xs font-medium rounded-full shadow-sm",
                category === 'utility' 
                  ? 'bg-gradient-to-r from-green-50 to-green-100 text-green-700 border border-green-200' 
                  : 'bg-gradient-to-r from-purple-50 to-purple-100 text-purple-700 border border-purple-200'
              )}>
                {category === 'utility' ? '🔧 实用工具' : '🎮 休闲娱乐'}
              </span>
              <span className={cn(
                "px-3 py-1.5 text-xs font-medium rounded-full shadow-sm border",
                isCompleted 
                  ? 'bg-gradient-to-r from-emerald-50 to-emerald-100 text-emerald-700 border border-emerald-200' 
                  : 'bg-gradient-to-r from-orange-50 to-orange-100 text-orange-700 border border-orange-200'
              )}>
                {isCompleted ? '✅ 已完成' : '🚧 进行中'}
              </span>
            </div>
          </div>
          <p className="text-gray-600 mb-4">{description}</p>
          
          {/* 显示更新时间 */}
          {updatedAt && (
            <div className="flex items-center gap-1 mb-3 text-xs text-gray-500">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span>更新于: {formatDate(updatedAt)}</span>
              {createdAt && createdAt !== updatedAt && (
                <span className="ml-2 text-gray-400">创建于: {formatDate(createdAt)}</span>
              )}
            </div>
          )}
          
          <div className="flex flex-wrap gap-2">
            {tags.map((tag) => (
              <span
                key={tag}
                className="px-3 py-1.5 text-xs font-medium bg-gradient-to-r from-gray-50 to-gray-100 text-gray-700 rounded-full border border-gray-200 shadow-sm hover:shadow-md transition-shadow duration-200"
              >
                #{tag}
              </span>
            ))}
          </div>
        </div>
      </div>
    </Link>
  );
};

export default ExperimentCard;

