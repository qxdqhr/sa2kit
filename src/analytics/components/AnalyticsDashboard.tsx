/**
 * 埋点数据仪表板组件
 * Analytics Dashboard Component
 */

'use client';

import React, { useState, useEffect } from 'react';
import { StatCard } from './StatCard';
import { EventList } from './EventList';
import { FilterPanel } from './FilterPanel';
import { PieChart, BarChart } from './Charts';
import type { DashboardEvent, DashboardStats, FilterOptions } from './types';

export interface AnalyticsDashboardProps {
  apiBaseUrl?: string;
  className?: string;
}

export const AnalyticsDashboard: React.FC<AnalyticsDashboardProps> = ({
  apiBaseUrl = '/api/analytics',
  className = '',
}) => {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [events, setEvents] = useState<DashboardEvent[]>([]);
  const [filters, setFilters] = useState<FilterOptions>({});
  const [loading, setLoading] = useState(true);
  const [selectedEvent, setSelectedEvent] = useState<DashboardEvent | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalEvents, setTotalEvents] = useState(0);
  const pageSize = 20;

  // 加载统计数据
  const loadStats = async () => {
    try {
      const params = new URLSearchParams();
      if (filters.dateRange?.startDate) {
        params.append('startDate', filters.dateRange.startDate);
      }
      if (filters.dateRange?.endDate) {
        params.append('endDate', filters.dateRange.endDate);
      }
      if (filters.platform) {
        params.append('platform', filters.platform);
      }

      const response = await fetch(`${apiBaseUrl}/stats?${params}`);
      const data = await response.json();

      if (data.success) {
        setStats(data.data);
      }
    } catch (error) {
      console.error('Failed to load stats:', error);
    }
  };

  // 加载事件列表
  const loadEvents = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();

      if (filters.dateRange?.startDate) {
        params.append('startDate', filters.dateRange.startDate);
      }
      if (filters.dateRange?.endDate) {
        params.append('endDate', filters.dateRange.endDate);
      }
      if (filters.eventType) {
        params.append('eventType', filters.eventType);
      }
      if (filters.platform) {
        params.append('platform', filters.platform);
      }
      if (filters.userId) {
        params.append('userId', filters.userId);
      }

      params.append('limit', pageSize.toString());
      params.append('offset', ((currentPage - 1) * pageSize).toString());
      params.append('orderBy', 'timestamp');
      params.append('orderDirection', 'desc');

      const response = await fetch(`${apiBaseUrl}/query?${params}`);
      const data = await response.json();

      if (data.success) {
        setEvents(data.data);
        setTotalEvents(data.total);
      }
    } catch (error) {
      console.error('Failed to load events:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadStats();
    loadEvents();
  }, [filters, currentPage]);

  const handleFilterChange = (newFilters: FilterOptions) => {
    setFilters(newFilters);
    setCurrentPage(1);
  };

  const handleEventClick = (event: DashboardEvent) => {
    setSelectedEvent(event);
  };

  const closeEventDetail = () => {
    setSelectedEvent(null);
  };

  const totalPages = Math.ceil(totalEvents / pageSize);

  return (
    <div className={`space-y-6 ${className}`}>
      {/* 顶部操作栏 */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 text-sm text-gray-600">
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
                d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
              />
            </svg>
            <span className="font-medium">实时数据监控</span>
          </div>
          {totalEvents > 0 && (
            <span className="text-xs px-2 py-1 bg-indigo-100 text-indigo-700 rounded-full font-medium">
              {totalEvents.toLocaleString()} 条记录
            </span>
          )}
        </div>
        <button
          onClick={() => {
            loadStats();
            loadEvents();
          }}
          className="flex items-center gap-2 px-4 py-2 text-sm bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-lg hover:from-indigo-700 hover:to-purple-700 transition-all duration-200 shadow-sm hover:shadow-md"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
            />
          </svg>
          <span>刷新数据</span>
        </button>
      </div>

      {/* 主内容区 */}
      <div className="grid grid-cols-12 gap-6">
        {/* 筛选面板（可折叠） */}
        <div className="col-span-12 xl:col-span-3">
          <FilterPanel onFilterChange={handleFilterChange} initialFilters={filters} />
        </div>

        {/* 数据展示区 */}
        <div className="col-span-12 xl:col-span-9 space-y-6">
          {/* 统计卡片 - 优化加载状态 */}
          {loading && !stats ? (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
              {[1, 2, 3, 4].map((i) => (
                <div
                  key={i}
                  className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 animate-pulse"
                >
                  <div className="h-4 bg-gray-200 rounded w-20 mb-3"></div>
                  <div className="h-8 bg-gray-200 rounded w-24 mb-2"></div>
                  <div className="h-3 bg-gray-200 rounded w-16"></div>
                </div>
              ))}
            </div>
          ) : stats ? (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4 animate-fade-in">
              <StatCard
                title="总事件数"
                value={stats.totalEvents}
                subtitle="所有平台"
                icon="📈"
                className="hover:scale-105 transition-transform duration-200"
              />
              <StatCard
                title="独立用户"
                value={stats.uniqueUsers}
                subtitle="去重统计"
                icon="👥"
                className="hover:scale-105 transition-transform duration-200"
              />
              <StatCard
                title="会话数"
                value={stats.uniqueSessions}
                subtitle="用户会话"
                icon="🔗"
                className="hover:scale-105 transition-transform duration-200"
              />
              <StatCard
                title="设备数"
                value={stats.uniqueDevices}
                subtitle="独立设备"
                icon="📱"
                className="hover:scale-105 transition-transform duration-200"
              />
            </div>
          ) : null}

          {/* 图表区域 */}
          {stats && (
            <div className="space-y-6 animate-fade-in">
              <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
                <div className="transform hover:scale-[1.02] transition-transform duration-200">
                  <PieChart
                    title="平台分布"
                    data={stats.eventsByPlatform.map((item) => ({
                      name: item.platform,
                      value: item.count,
                    }))}
                  />
                </div>
                <div className="transform hover:scale-[1.02] transition-transform duration-200">
                  <BarChart
                    title="事件类型 Top 10"
                    data={stats.eventsByType.slice(0, 10).map((item) => ({
                      name: item.eventType,
                      value: item.count,
                    }))}
                  />
                </div>
              </div>

              {/* 热门页面 */}
              {stats.topPages.length > 0 && (
                <div className="transform hover:scale-[1.02] transition-transform duration-200">
                  <BarChart
                    title="热门页面 Top 10"
                    data={stats.topPages.slice(0, 10).map((item) => ({
                      name: item.pageUrl,
                      value: item.count,
                    }))}
                  />
                </div>
              )}
            </div>
          )}

          {/* 事件列表 */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
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
                    d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
                  />
                </svg>
                事件记录
              </h3>
              {totalEvents > 0 && !loading && (
                <span className="text-sm text-gray-500">
                  显示 {(currentPage - 1) * pageSize + 1}-
                  {Math.min(currentPage * pageSize, totalEvents)} / {totalEvents.toLocaleString()}
                </span>
              )}
            </div>

            <div className="animate-fade-in">
              <EventList events={events} loading={loading} onEventClick={handleEventClick} />
            </div>

            {/* 分页 - 优化样式 */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between bg-gradient-to-r from-gray-50 to-gray-100 px-6 py-4 rounded-xl border border-gray-200">
                <div className="hidden sm:block text-sm text-gray-600">
                  第 <span className="font-semibold text-gray-900">{currentPage}</span> 页，共{' '}
                  <span className="font-semibold text-gray-900">{totalPages}</span> 页
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                    disabled={currentPage === 1}
                    className="flex items-center gap-1 px-4 py-2 text-sm font-medium bg-white border border-gray-300 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 hover:border-indigo-500 transition-all duration-200"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M15 19l-7-7 7-7"
                      />
                    </svg>
                    <span className="hidden sm:inline">上一页</span>
                  </button>
                  <div className="sm:hidden px-4 py-2 text-sm text-gray-600">
                    {currentPage} / {totalPages}
                  </div>
                  <button
                    onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                    disabled={currentPage === totalPages}
                    className="flex items-center gap-1 px-4 py-2 text-sm font-medium bg-white border border-gray-300 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 hover:border-indigo-500 transition-all duration-200"
                  >
                    <span className="hidden sm:inline">下一页</span>
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M9 5l7 7-7 7"
                      />
                    </svg>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 事件详情弹窗 - 优化样式 */}
      {selectedEvent && (
        <div
          className="fixed inset-0 bg-black bg-opacity-60 backdrop-blur-sm flex items-center justify-center z-[50] p-4 animate-fade-in"
          onClick={closeEventDetail}
        >
          <div
            className="bg-white rounded-2xl shadow-2xl max-w-3xl w-full max-h-[85vh] overflow-hidden animate-slide-up"
            onClick={(e) => e.stopPropagation()}
          >
            {/* 头部 */}
            <div className="bg-gradient-to-r from-indigo-600 to-purple-600 px-6 py-4 flex items-center justify-between">
              <div className="flex items-center gap-3 text-white">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
                <h3 className="text-xl font-semibold">事件详情</h3>
              </div>
              <button
                onClick={closeEventDetail}
                className="text-white hover:bg-white hover:bg-opacity-20 rounded-full p-2 transition-all duration-200"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </div>

            {/* 内容 */}
            <div className="p-6 overflow-auto max-h-[calc(85vh-80px)]">
              <div className="space-y-5">
                {/* 基础信息卡片 */}
                <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl p-4 border border-blue-200">
                  <div className="flex items-center gap-2 mb-3">
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
                        d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z"
                      />
                    </svg>
                    <h4 className="font-semibold text-gray-900">基础信息</h4>
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-medium text-gray-600">事件ID</span>
                      <code className="text-xs bg-white px-2 py-1 rounded border border-blue-200 font-mono text-gray-800">
                        {selectedEvent.id.slice(0, 16)}...
                      </code>
                    </div>
                    <div className="grid grid-cols-2 gap-3 pt-2">
                      <div>
                        <span className="text-xs font-medium text-gray-600 block mb-1">
                          事件类型
                        </span>
                        <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-indigo-100 text-indigo-800">
                          {selectedEvent.eventType}
                        </span>
                      </div>
                      <div>
                        <span className="text-xs font-medium text-gray-600 block mb-1">
                          事件名称
                        </span>
                        <p className="text-sm font-medium text-gray-900 truncate">
                          {selectedEvent.eventName}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* 平台和版本信息 */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-gray-50 rounded-lg p-3 border border-gray-200">
                    <span className="text-xs font-medium text-gray-600 block mb-1">平台</span>
                    <p className="text-sm font-semibold text-gray-900">{selectedEvent.platform}</p>
                  </div>
                  <div className="bg-gray-50 rounded-lg p-3 border border-gray-200">
                    <span className="text-xs font-medium text-gray-600 block mb-1">应用版本</span>
                    <p className="text-sm font-semibold text-gray-900">
                      {selectedEvent.appVersion}
                    </p>
                  </div>
                </div>

                {/* 用户信息卡片 */}
                <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-xl p-4 border border-purple-200">
                  <div className="flex items-center gap-2 mb-3">
                    <svg
                      className="w-5 h-5 text-purple-600"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                      />
                    </svg>
                    <h4 className="font-semibold text-gray-900">用户信息</h4>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <span className="text-xs font-medium text-gray-600 block mb-1">用户ID</span>
                      <p className="text-sm font-medium text-gray-900">
                        {selectedEvent.userId || <span className="text-gray-400">游客</span>}
                      </p>
                    </div>
                    <div>
                      <span className="text-xs font-medium text-gray-600 block mb-1">会话ID</span>
                      <code className="text-xs bg-white px-2 py-1 rounded border border-purple-200 font-mono text-gray-800 block truncate">
                        {selectedEvent.sessionId.slice(0, 12)}...
                      </code>
                    </div>
                  </div>
                  <div className="mt-3 pt-3 border-t border-purple-200">
                    <span className="text-xs font-medium text-gray-600 block mb-1">设备ID</span>
                    <code className="text-xs bg-white px-2 py-1 rounded border border-purple-200 font-mono text-gray-800 block truncate">
                      {selectedEvent.deviceId}
                    </code>
                  </div>
                </div>

                {/* 页面信息 */}
                {(selectedEvent.pageUrl || selectedEvent.pageTitle) && (
                  <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl p-4 border border-green-200">
                    <div className="flex items-center gap-2 mb-3">
                      <svg
                        className="w-5 h-5 text-green-600"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9"
                        />
                      </svg>
                      <h4 className="font-semibold text-gray-900">页面信息</h4>
                    </div>
                    {selectedEvent.pageTitle && (
                      <div className="mb-2">
                        <span className="text-xs font-medium text-gray-600 block mb-1">
                          页面标题
                        </span>
                        <p className="text-sm font-medium text-gray-900">
                          {selectedEvent.pageTitle}
                        </p>
                      </div>
                    )}
                    {selectedEvent.pageUrl && (
                      <div>
                        <span className="text-xs font-medium text-gray-600 block mb-1">
                          页面URL
                        </span>
                        <code className="text-xs bg-white px-2 py-1 rounded border border-green-200 font-mono text-gray-800 block break-all">
                          {selectedEvent.pageUrl}
                        </code>
                      </div>
                    )}
                  </div>
                )}

                {/* 时间信息 */}
                <div className="bg-gradient-to-br from-amber-50 to-yellow-50 rounded-xl p-4 border border-amber-200">
                  <div className="flex items-center gap-2 mb-2">
                    <svg
                      className="w-5 h-5 text-amber-600"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                      />
                    </svg>
                    <h4 className="font-semibold text-gray-900">时间信息</h4>
                  </div>
                  <p className="text-sm font-medium text-gray-900">
                    {new Date(selectedEvent.timestamp).toLocaleString('zh-CN', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                      second: '2-digit',
                    })}
                  </p>
                </div>

                {/* 自定义属性 */}
                {selectedEvent.properties && Object.keys(selectedEvent.properties).length > 0 && (
                  <div className="bg-gradient-to-br from-gray-50 to-slate-50 rounded-xl p-4 border border-gray-300">
                    <div className="flex items-center gap-2 mb-3">
                      <svg
                        className="w-5 h-5 text-gray-600"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4"
                        />
                      </svg>
                      <h4 className="font-semibold text-gray-900">自定义属性</h4>
                    </div>
                    <pre className="text-xs bg-white p-4 rounded-lg border border-gray-200 overflow-auto max-h-48 font-mono text-gray-800">
                      {JSON.stringify(selectedEvent.properties, null, 2)}
                    </pre>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
