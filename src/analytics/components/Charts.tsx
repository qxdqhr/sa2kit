/**
 * 图表组件
 * Charts Component
 */

import React from 'react';
import type { ChartDataPoint } from './types';

export interface PieChartProps {
  data: ChartDataPoint[];
  title?: string;
  className?: string;
}

export const PieChart: React.FC<PieChartProps> = ({ data, title, className = '' }) => {
  const total = data.reduce((sum, item) => sum + item.value, 0);

  const colors = [
    'bg-blue-500',
    'bg-green-500',
    'bg-purple-500',
    'bg-yellow-500',
    'bg-pink-500',
    'bg-indigo-500',
    'bg-red-500',
    'bg-cyan-500',
  ];

  return (
    <div className={`bg-white rounded-lg shadow-sm p-6 ${className}`}>
      {title && <h3 className="text-lg font-semibold text-gray-900 mb-4">{title}</h3>}
      <div className="space-y-3">
        {data.map((item, index) => {
          const percentage = total > 0 ? ((item.value / total) * 100).toFixed(1) : 0;
          return (
            <div key={index}>
              <div className="flex items-center justify-between text-sm mb-1">
                <span className="text-gray-700 font-medium">{item.name}</span>
                <span className="text-gray-600">
                  {item.value.toLocaleString()} ({percentage}%)
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className={`h-2 rounded-full ${colors[index % colors.length]}`}
                  style={{ width: `${percentage}%` }}
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export interface BarChartProps {
  data: ChartDataPoint[];
  title?: string;
  className?: string;
}

export const BarChart: React.FC<BarChartProps> = ({ data, title, className = '' }) => {
  const maxValue = Math.max(...data.map((item) => item.value), 1);

  return (
    <div className={`bg-white rounded-lg shadow-sm p-6 ${className}`}>
      {title && <h3 className="text-lg font-semibold text-gray-900 mb-4">{title}</h3>}
      <div className="space-y-4">
        {data.map((item, index) => {
          const percentage = (item.value / maxValue) * 100;
          return (
            <div key={index} className="flex items-center gap-4">
              <div className="w-32 text-sm text-gray-700 font-medium truncate">{item.name}</div>
              <div className="flex-1 flex items-center gap-2">
                <div className="flex-1 bg-gray-200 rounded-full h-8 relative overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-indigo-500 to-purple-600 flex items-center justify-end px-3"
                    style={{ width: `${percentage}%`, minWidth: '40px' }}
                  >
                    <span className="text-xs text-white font-semibold">
                      {item.value.toLocaleString()}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export interface LineChartProps {
  data: ChartDataPoint[];
  title?: string;
  className?: string;
}

export const LineChart: React.FC<LineChartProps> = ({ data, title, className = '' }) => {
  const maxValue = Math.max(...data.map((item) => item.value), 1);
  const height = 200;

  const points = data
    .map((item, index) => {
      const x = (index / (data.length - 1 || 1)) * 100;
      const y = height - (item.value / maxValue) * height;
      return `${x},${y}`;
    })
    .join(' ');

  return (
    <div className={`bg-white rounded-lg shadow-sm p-6 ${className}`}>
      {title && <h3 className="text-lg font-semibold text-gray-900 mb-4">{title}</h3>}
      <div className="relative" style={{ height: `${height}px` }}>
        <svg viewBox={`0 0 100 ${height}`} preserveAspectRatio="none" className="w-full h-full">
          {/* 网格线 */}
          {[0, 25, 50, 75, 100].map((y) => (
            <line
              key={y}
              x1="0"
              y1={y * (height / 100)}
              x2="100"
              y2={y * (height / 100)}
              stroke="#e5e7eb"
              strokeWidth="0.5"
            />
          ))}
          {/* 折线 */}
          <polyline
            points={points}
            fill="none"
            stroke="url(#gradient)"
            strokeWidth="2"
            vectorEffect="non-scaling-stroke"
          />
          {/* 渐变填充 */}
          <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#6366f1" />
            <stop offset="100%" stopColor="#8b5cf6" />
          </linearGradient>
          {/* 数据点 */}
          {data.map((item, index) => {
            const x = (index / (data.length - 1 || 1)) * 100;
            const y = height - (item.value / maxValue) * height;
            return (
              <circle
                key={index}
                cx={x}
                cy={y}
                r="1.5"
                fill="#6366f1"
                vectorEffect="non-scaling-stroke"
              />
            );
          })}
        </svg>
      </div>
      {/* X 轴标签 */}
      <div className="flex justify-between mt-4 text-xs text-gray-600">
        {data.map((item, index) => (
          <span key={index} className="truncate max-w-[60px]">
            {item.name}
          </span>
        ))}
      </div>
    </div>
  );
};
