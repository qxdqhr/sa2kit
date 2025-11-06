/**
 * 统计卡片组件
 * Statistics Card Component
 */

import React from 'react';

export interface StatCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon?: React.ReactNode;
  trend?: {
    value: number;
    isPositive: boolean;
  };
  className?: string;
}

export const StatCard: React.FC<StatCardProps> = ({
  title,
  value,
  subtitle,
  icon,
  trend,
  className = '',
}) => {
  return (
    <div
      className={`bg-white rounded-lg shadow-sm p-6 border border-gray-200 hover:shadow-md transition-shadow ${className}`}
    >
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <p className="text-sm font-medium text-gray-600 mb-1">{title}</p>
          <p className="text-3xl font-bold text-gray-900">{value.toLocaleString()}</p>
          {subtitle && <p className="text-sm text-gray-500 mt-2">{subtitle}</p>}
          {trend && (
            <div className="flex items-center mt-2">
              <span
                className={`text-sm font-medium ${
                  trend.isPositive ? 'text-green-600' : 'text-red-600'
                }`}
              >
                {trend.isPositive ? '↑' : '↓'} {Math.abs(trend.value)}%
              </span>
              <span className="text-sm text-gray-500 ml-2">vs 上周</span>
            </div>
          )}
        </div>
        {icon && (
          <div className="flex-shrink-0 bg-gradient-to-br from-purple-500 to-indigo-600 rounded-lg p-3">
            <div className="text-white text-2xl">{icon}</div>
          </div>
        )}
      </div>
    </div>
  );
};
