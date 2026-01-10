'use client';

import React, { useState, useEffect } from 'react';
import { CalendarEvent, useEvents, formatDate, formatTime } from '../index';
import EventModal from '../components/EventModal';
import { ConfirmModal } from '@/components';
import { clsx } from 'clsx';

interface EventDetailPageProps {
  eventId: number;
  onBack?: () => void;
  onEdit?: (event: CalendarEvent) => void;
  onDelete?: (eventId: number) => void;
}

const EventDetailPage: React.FC<EventDetailPageProps> = ({
  eventId,
  onBack,
  onEdit,
  onDelete,
}) => {
  const [event, setEvent] = useState<CalendarEvent | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const { events, updateEvent, deleteEvent } = useEvents();

  // 加载事件详情
  useEffect(() => {
    const foundEvent = events.find(e => e.id === eventId);
    if (foundEvent) {
      setEvent(foundEvent);
      setIsLoading(false);
    }
  }, [eventId, events]);

  // 处理编辑事件
  const handleEditSave = async (eventData: any) => {
    if (!event) return;
    
    try {
      await updateEvent(event.id, eventData);
      setIsEditModalOpen(false);
      // 重新加载事件数据
      const updatedEvent = events.find(e => e.id === eventId);
      if (updatedEvent) {
        setEvent(updatedEvent);
      }
    } catch (error) {
      console.error('更新事件失败:', error);
    }
  };

  // 处理删除事件
  const handleDelete = async () => {
    if (!event) return;
    
    setIsDeleting(true);
    try {
      await deleteEvent(event.id);
      setShowDeleteConfirm(false);
      if (onDelete) {
        onDelete(event.id);
      }
      if (onBack) {
        onBack();
      }
    } catch (error) {
      console.error('删除事件失败:', error);
    } finally {
      setIsDeleting(false);
    }
  };

  // 获取事件优先级显示文本
  const getPriorityText = (priority: string) => {
    switch (priority) {
      case 'high': return '高';
      case 'normal': return '普通';
      case 'low': return '低';
      default: return '普通';
    }
  };

  // 获取事件优先级颜色
  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'text-red-600 bg-red-50';
      case 'normal': return 'text-blue-600 bg-blue-50';
      case 'low': return 'text-gray-600 bg-gray-50';
      default: return 'text-blue-600 bg-blue-50';
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">加载事件详情...</p>
        </div>
      </div>
    );
  }

  if (!event) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600">事件不存在</p>
          {onBack && (
            <button
              onClick={onBack}
              className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
            >
              返回
            </button>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* 头部 */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              {onBack && (
                <button
                  onClick={onBack}
                  className="p-2 hover:bg-gray-100 rounded-md"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                  </svg>
                </button>
              )}
              <h1 className="text-3xl font-bold text-gray-900">事件详情</h1>
            </div>
            
            <div className="flex space-x-3">
              <button
                onClick={() => setIsEditModalOpen(true)}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
              >
                编辑
              </button>
              <button
                onClick={() => setShowDeleteConfirm(true)}
                className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700"
              >
                删除
              </button>
            </div>
          </div>
        </div>

        {/* 事件详情卡片 */}
        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          {/* 事件头部 */}
          <div className="px-6 py-4 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-semibold text-gray-900">{event.title}</h2>
              <div className="flex items-center space-x-2">
                <span
                  className={clsx('px-2 py-1 text-xs font-medium rounded-full', getPriorityColor(event.priority || 'normal'))}
                >
                  {getPriorityText(event.priority || 'normal')}
                </span>
                <div
                  className="w-4 h-4 rounded-full"
                  style={{ backgroundColor: event.color }}
                />
              </div>
            </div>
          </div>

          {/* 事件详情内容 */}
          <div className="px-6 py-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* 时间信息 */}
              <div className="space-y-4">
                <h3 className="text-lg font-medium text-gray-900">时间信息</h3>
                
                <div className="space-y-3">
                  <div className="flex items-center space-x-3">
                    <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    <div>
                      <p className="text-sm text-gray-600">开始时间</p>
                      <p className="font-medium">
                        {formatDate(new Date(event.startTime))} {formatTime(new Date(event.startTime))}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center space-x-3">
                    <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    <div>
                      <p className="text-sm text-gray-600">结束时间</p>
                      <p className="font-medium">
                        {formatDate(new Date(event.endTime))} {formatTime(new Date(event.endTime))}
                      </p>
                    </div>
                  </div>

                  {event.allDay && (
                    <div className="flex items-center space-x-3">
                      <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
                      </svg>
                      <div>
                        <p className="text-sm text-gray-600">全天事件</p>
                        <p className="font-medium text-blue-600">是</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* 基本信息 */}
              <div className="space-y-4">
                <h3 className="text-lg font-medium text-gray-900">基本信息</h3>
                
                <div className="space-y-3">
                  {event.location && (
                    <div className="flex items-center space-x-3">
                      <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                      <div>
                        <p className="text-sm text-gray-600">地点</p>
                        <p className="font-medium">{event.location}</p>
                      </div>
                    </div>
                  )}

                  <div className="flex items-center space-x-3">
                    <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 4V2a1 1 0 011-1h8a1 1 0 011 1v2M7 4a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V6a2 2 0 00-2-2M7 4h10M7 8h10M7 12h10" />
                    </svg>
                    <div>
                      <p className="text-sm text-gray-600">创建时间</p>
                      <p className="font-medium">
                        {formatDate(new Date(event.createdAt))} {formatTime(new Date(event.createdAt))}
                      </p>
                    </div>
                  </div>

                  {event.updatedAt && event.updatedAt !== event.createdAt && (
                    <div className="flex items-center space-x-3">
                      <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                      </svg>
                      <div>
                        <p className="text-sm text-gray-600">最后修改</p>
                        <p className="font-medium">
                          {formatDate(new Date(event.updatedAt))} {formatTime(new Date(event.updatedAt))}
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* 描述 */}
            {event.description && (
              <div className="mt-6 pt-6 border-t border-gray-200">
                <h3 className="text-lg font-medium text-gray-900 mb-3">描述</h3>
                <div className="prose max-w-none">
                  <p className="text-gray-700 whitespace-pre-wrap">{event.description}</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 编辑事件弹窗 */}
      <EventModal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        onSave={handleEditSave}
        event={event}
      />

      {/* 删除确认弹窗 */}
      <ConfirmModal
        isOpen={showDeleteConfirm}
        onClose={() => setShowDeleteConfirm(false)}
        onConfirm={handleDelete}
        title="确认删除"
        message={'您确定要删除事件"' + (event.title) + '"吗？此操作无法撤销。'}
        confirmText="删除"
        cancelText="取消"
        isLoading={isDeleting}
      />
    </div>
  );
};

export default EventDetailPage; 