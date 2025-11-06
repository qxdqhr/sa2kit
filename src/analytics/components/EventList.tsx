/**
 * 事件列表组件
 * Events List Component
 */

import React from 'react';
import type { DashboardEvent } from './types';

export interface EventListProps {
  events: DashboardEvent[];
  loading?: boolean;
  onEventClick?: (event: DashboardEvent) => void;
  className?: string;
}

export const EventList: React.FC<EventListProps> = ({
  events,
  loading = false,
  onEventClick,
  className = '',
}) => {
  if (loading) {
    return (
      <div className={`bg-white rounded-lg shadow-sm p-6 ${className}`}>
        <div className="animate-pulse space-y-4">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="h-16 bg-gray-200 rounded"></div>
          ))}
        </div>
      </div>
    );
  }

  if (events.length === 0) {
    return (
      <div className={`bg-white rounded-lg shadow-sm p-12 text-center ${className}`}>
        <div className="text-gray-400 text-5xl mb-4">📊</div>
        <p className="text-gray-600 text-lg font-medium">暂无数据</p>
        <p className="text-gray-500 text-sm mt-2">尝试调整筛选条件</p>
      </div>
    );
  }

  const getPlatformColor = (platform: string) => {
    const colors: Record<string, string> = {
      web: 'bg-blue-100 text-blue-800',
      mobile: 'bg-green-100 text-green-800',
      miniapp: 'bg-purple-100 text-purple-800',
      desktop: 'bg-gray-100 text-gray-800',
    };
    return colors[platform] || 'bg-gray-100 text-gray-800';
  };

  const getEventTypeColor = (eventType: string) => {
    const colors: Record<string, string> = {
      page_view: 'bg-indigo-100 text-indigo-800',
      click: 'bg-amber-100 text-amber-800',
      error: 'bg-red-100 text-red-800',
      performance: 'bg-cyan-100 text-cyan-800',
      api_call: 'bg-emerald-100 text-emerald-800',
    };
    return colors[eventType] || 'bg-gray-100 text-gray-800';
  };

  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (minutes < 1) return '刚刚';
    if (minutes < 60) return `${minutes}分钟前`;
    if (hours < 24) return `${hours}小时前`;
    if (days < 7) return `${days}天前`;
    return date.toLocaleDateString('zh-CN');
  };

  return (
    <div className={`bg-white rounded-lg shadow-sm overflow-hidden ${className}`}>
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                事件
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                平台
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                页面
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                用户
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                时间
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                操作
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {events.map((event) => (
              <tr
                key={event.id}
                className="hover:bg-gray-50 cursor-pointer transition-colors"
                onClick={() => onEventClick?.(event)}
              >
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex flex-col">
                    <span
                      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getEventTypeColor(
                        event.eventType
                      )} w-fit mb-1`}
                    >
                      {event.eventType}
                    </span>
                    <span className="text-sm text-gray-900">{event.eventName}</span>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span
                    className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getPlatformColor(
                      event.platform
                    )}`}
                  >
                    {event.platform}
                  </span>
                </td>
                <td className="px-6 py-4">
                  <div className="text-sm text-gray-900 max-w-xs truncate">
                    {event.pageUrl || '-'}
                  </div>
                  {event.pageTitle && (
                    <div className="text-xs text-gray-500 max-w-xs truncate">{event.pageTitle}</div>
                  )}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm text-gray-900">{event.userId || '游客'}</div>
                  <div className="text-xs text-gray-500">{event.deviceId.slice(0, 8)}...</div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm text-gray-900">{formatTimestamp(event.timestamp)}</div>
                  <div className="text-xs text-gray-500">
                    {new Date(event.timestamp).toLocaleTimeString('zh-CN')}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onEventClick?.(event);
                    }}
                    className="text-indigo-600 hover:text-indigo-900"
                  >
                    详情
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
