/**
 * 筛选面板组件
 * Filter Panel Component
 */

import React, { useState } from 'react';
import type { FilterOptions } from './types';
import { clsx } from 'clsx';

export interface FilterPanelProps {
  onFilterChange: (filters: FilterOptions) => void;
  initialFilters?: FilterOptions;
  className?: string;
}

export const FilterPanel: React.FC<FilterPanelProps> = ({
  onFilterChange,
  initialFilters = {},
  className = '',
}) => {
  const [filters, setFilters] = useState<FilterOptions>(initialFilters);

  const handleDatePreset = (preset: string) => {
    const now = new Date();
    let startDate = new Date();

    switch (preset) {
      case 'today':
        startDate.setHours(0, 0, 0, 0);
        break;
      case 'yesterday':
        startDate.setDate(now.getDate() - 1);
        startDate.setHours(0, 0, 0, 0);
        now.setDate(now.getDate() - 1);
        now.setHours(23, 59, 59, 999);
        break;
      case 'week':
        startDate.setDate(now.getDate() - 7);
        break;
      case 'month':
        startDate.setMonth(now.getMonth() - 1);
        break;
      default:
        return;
    }

    const newFilters = {
      ...filters,
      dateRange: {
        startDate: startDate.toISOString(),
        endDate: now.toISOString(),
      },
    };
    setFilters(newFilters);
    onFilterChange(newFilters);
  };

  const handleFilterChange = (key: keyof FilterOptions, value: any) => {
    const newFilters = {
      ...filters,
      [key]: value || undefined,
    };
    setFilters(newFilters);
    onFilterChange(newFilters);
  };

  const handleReset = () => {
    const emptyFilters: FilterOptions = {};
    setFilters(emptyFilters);
    onFilterChange(emptyFilters);
  };

  return (
    <div className={clsx('bg-white rounded-xl shadow-sm border border-gray-200', className)}>
      <div className="flex items-center justify-between mb-4 p-4 bg-gradient-to-r from-gray-50 to-gray-100 -m-6 mb-4 rounded-t-xl border-b border-gray-200">
        <div className="flex items-center gap-2">
          <svg
            className="w-5 h-5 text-indigo-600"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z"
            />
          </svg>
          <h3 className="text-sm font-semibold text-gray-900">筛选条件</h3>
        </div>
        <button
          onClick={handleReset}
          className="text-xs px-3 py-1 text-gray-600 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
        >
          重置
        </button>
      </div>
      <div className="p-4 space-y-4">
        {/* 时间范围快捷选择 */}
        <div>
          <label className="block text-xs font-semibold text-gray-700 mb-2">时间范围</label>
          <div className="grid grid-cols-2 gap-2">
            {[
              { label: '今天', value: 'today' },
              { label: '昨天', value: 'yesterday' },
              { label: '7天', value: 'week' },
              { label: '30天', value: 'month' },
            ].map((preset) => (
              <button
                key={preset.value}
                onClick={() => handleDatePreset(preset.value)}
                className="px-3 py-1.5 text-xs font-medium border border-gray-300 rounded-lg hover:bg-indigo-50 hover:border-indigo-500 hover:text-indigo-700 transition-colors"
              >
                {preset.label}
              </button>
            ))}
          </div>
        </div>

        {/* 自定义时间范围 */}
        <div className="space-y-3">
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1.5">开始时间</label>
            <input
              type="datetime-local"
              value={
                filters.dateRange?.startDate
                  ? new Date(filters.dateRange.startDate).toISOString().slice(0, 16)
                  : ''
              }
              onChange={(e) =>
                handleFilterChange('dateRange', {
                  ...filters.dateRange,
                  startDate: e.target.value ? new Date(e.target.value).toISOString() : undefined,
                })
              }
              className="w-full px-2 py-1.5 text-xs border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1.5">结束时间</label>
            <input
              type="datetime-local"
              value={
                filters.dateRange?.endDate
                  ? new Date(filters.dateRange.endDate).toISOString().slice(0, 16)
                  : ''
              }
              onChange={(e) =>
                handleFilterChange('dateRange', {
                  ...filters.dateRange,
                  endDate: e.target.value ? new Date(e.target.value).toISOString() : undefined,
                })
              }
              className="w-full px-2 py-1.5 text-xs border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>
        </div>

        {/* 事件类型 */}
        <div>
          <label className="block text-xs font-semibold text-gray-700 mb-2">事件类型</label>
          <select
            value={filters.eventType || ''}
            onChange={(e) => handleFilterChange('eventType', e.target.value)}
            className="w-full px-2 py-1.5 text-xs border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            <option value="">全部</option>
            <option value="page_view">页面浏览</option>
            <option value="click">点击</option>
            <option value="search">搜索</option>
            <option value="login">登录</option>
            <option value="logout">登出</option>
            <option value="error">错误</option>
            <option value="performance">性能</option>
            <option value="api_call">API 调用</option>
            <option value="custom">自定义</option>
          </select>
        </div>

        {/* 平台 */}
        <div>
          <label className="block text-xs font-semibold text-gray-700 mb-2">平台</label>
          <select
            value={filters.platform || ''}
            onChange={(e) => handleFilterChange('platform', e.target.value)}
            className="w-full px-2 py-1.5 text-xs border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            <option value="">全部</option>
            <option value="web">Web</option>
            <option value="mobile">Mobile</option>
            <option value="miniapp">小程序</option>
            <option value="desktop">Desktop</option>
          </select>
        </div>

        {/* 用户ID */}
        <div>
          <label className="block text-xs font-semibold text-gray-700 mb-2">用户ID</label>
          <input
            type="text"
            value={filters.userId || ''}
            onChange={(e) => handleFilterChange('userId', e.target.value)}
            placeholder="输入用户ID"
            className="w-full px-2 py-1.5 text-xs border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 placeholder:text-gray-400"
          />
        </div>
      </div>

      {/* 当前筛选条件摘要 */}
      <div className="px-4 py-3 bg-gray-50 -mx-6 -mb-6 mt-4 rounded-b-xl border-t border-gray-200">
        <div className="flex items-center gap-2">
          <div
            className={clsx('w-2 h-2 rounded-full', Object.keys(filters).length > 0 ? 'bg-green-500' : 'bg-gray-300')}
          ></div>
          <p className="text-xs text-gray-600">
            {Object.keys(filters).length === 0
              ? '未应用筛选'
              : (Object.keys(filters).length) + ' 个筛选'}
          </p>
        </div>
      </div>
    </div>
  );
};
