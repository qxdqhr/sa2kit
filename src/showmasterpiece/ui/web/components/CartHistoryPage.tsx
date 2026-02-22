/**
 * ShowMasterpiece 模块 - 用户预订历史记录页面组件
 * 
 * 用户查看自己的预订历史记录
 * 
 * @fileoverview 用户预订历史记录页面组件
 */

'use client';

import React, { useState, useEffect } from 'react';
import { Calendar, Package, Clock, CheckCircle, XCircle, Trash2, RefreshCw, Eye } from 'lucide-react';
import { Booking } from '../types/booking';
import { BookingService } from '../services';

/**
 * 用户预订历史记录页面组件属性
 */
interface CartHistoryPageProps {
  /** 用户QQ号 */
  qqNumber: string;
  /** 用户手机号 */
  phoneNumber: string;
}

/**
 * 状态显示信息
 */
const STATUS_INFO = {
  pending: { label: '待确认', color: 'bg-yellow-100 text-yellow-800' },
  confirmed: { label: '已确认', color: 'bg-blue-100 text-blue-800' },
  completed: { label: '已完成', color: 'bg-green-100 text-green-800' },
  cancelled: { label: '已取消', color: 'bg-red-100 text-red-800' }
};

/**
 * 用户预订历史记录页面组件
 * 
 * @param props 组件属性
 * @returns React组件
 */
export const CartHistoryPage: React.FC<CartHistoryPageProps> = ({
  qqNumber,
  phoneNumber
}) => {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | undefined>(undefined);
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);

  /**
   * 加载预订历史记录
   */
  const loadBookings = async () => {
    try {
      setLoading(true);
      setError(undefined);
      
      console.log('🔄 开始查询用户预订信息:', { qqNumber, phoneNumber });
      
      // 调用预订查询API
      const response = await BookingService.getBookings({
        qqNumber: qqNumber,
        phoneNumber: phoneNumber
      });
      
      setBookings(response.bookings || []);
      
      console.log('✅ 用户预订信息查询成功:', { 
        totalBookings: response.bookings?.length || 0,
        qqNumber,
        phoneNumber
      });
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '查询预订信息失败';
      setError(errorMessage);
      console.error('❌ 查询用户预订信息失败:', err);
    } finally {
      setLoading(false);
    }
  };

  /**
   * 删除预订记录
   */
  const handleDeleteBooking = async (bookingId: number) => {
    if (confirm('确定要删除这条预订记录吗？此操作不可撤销。')) {
      try {
        await BookingService.deleteBooking(bookingId);
        console.log('预订记录删除成功');
        
        // 重新加载预订记录
        await loadBookings();
      } catch (error) {
        console.error('删除预订记录失败:', error);
        alert('删除预订记录失败');
      }
    }
  };

  /**
   * 格式化时间
   */
  const formatTime = (dateString: string) => {
    return new Date(dateString).toLocaleString('zh-CN');
  };

  /**
   * 获取状态显示信息
   */
  const getStatusInfo = (status: Booking['status']) => {
    return STATUS_INFO[status] || STATUS_INFO.pending;
  };

  /**
   * 组件挂载时加载数据
   */
  useEffect(() => {
    loadBookings();
  }, [qqNumber, phoneNumber]);

  // 计算统计信息
  const totalBookings = bookings.length;
  const totalQuantity = bookings.reduce((sum, booking) => sum + booking.quantity, 0);
  const totalPrice = bookings.reduce((sum, booking) => {
    const price = booking.collection?.price || 0;
    return sum + (price * booking.quantity);
  }, 0);
  const completedBookings = bookings.filter(booking => booking.status === 'completed').length;

  return (
    <div className="space-y-6">
      {/* 页面标题 */}
      <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-slate-800">我的预订历史</h1>
            <p className="text-slate-600 mt-1">
              QQ: {qqNumber} | 手机: {phoneNumber}
            </p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={loadBookings}
              disabled={loading}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors disabled:opacity-50"
            >
              <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
              刷新
            </button>
          </div>
        </div>
      </div>

      {/* 统计信息 */}
      {totalBookings > 0 && (
        <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-6">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-slate-800">{totalBookings}</div>
              <div className="text-sm text-slate-600">总预订次数</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-slate-800">{totalQuantity}</div>
              <div className="text-sm text-slate-600">总预订数量</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-slate-800">¥{totalPrice}</div>
              <div className="text-sm text-slate-600">总预订金额</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-slate-800">{completedBookings}</div>
              <div className="text-sm text-slate-600">已完成</div>
            </div>
          </div>
        </div>
      )}

      {/* 错误提示 */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex">
            <div className="text-red-400 mr-3 flex-shrink-0">
              <XCircle size={20} />
            </div>
            <div className="min-w-0 flex-1">
              <h3 className="text-sm font-medium text-red-800">查询失败</h3>
              <p className="text-sm text-red-700 mt-1">{error}</p>
            </div>
          </div>
        </div>
      )}

      {/* 预订记录列表 */}
      <div className="space-y-4">
        {loading ? (
          <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-8 text-center">
            <RefreshCw size={40} className="text-slate-400 mx-auto mb-4 animate-spin" />
            <h3 className="text-lg font-medium text-slate-800 mb-2">加载中...</h3>
            <p className="text-slate-600">正在获取您的预订历史记录</p>
          </div>
        ) : totalBookings === 0 ? (
          <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-8 text-center">
            <Calendar size={40} className="text-slate-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-slate-800 mb-2">暂无预订记录</h3>
            <p className="text-slate-600">您还没有提交过任何预订</p>
          </div>
        ) : (
          bookings.map((booking) => {
            const statusInfo = getStatusInfo(booking.status);
            const totalPrice = (booking.collection?.price || 0) * booking.quantity;
            
            return (
              <div key={booking.id} className="bg-white rounded-lg shadow-sm border border-slate-200 overflow-hidden">
                <div className="p-6">
                  <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 mb-4">
                    <div className="flex items-start gap-4">
                      <img
                        src={booking.collection?.coverImage || ''}
                        alt={booking.collection?.title || '未知画集'}
                        className="w-16 h-16 object-cover rounded-lg flex-shrink-0"
                      />
                      <div className="min-w-0 flex-1">
                        <h3 className="text-lg font-semibold text-slate-800">
                          {booking.collection?.title || '未知画集'}
                        </h3>
                        <p className="text-sm text-slate-600">
                          编号：{booking.collection?.number || '未知编号'}
                        </p>
                        <p className="text-sm text-slate-600">
                          预订时间：{formatTime(booking.createdAt)}
                        </p>
                        <p className="text-sm text-slate-600">
                          数量：{booking.quantity} | 总价：¥{totalPrice}
                        </p>
                      </div>
                    </div>
                    
                    <div className="text-left sm:text-right">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${statusInfo.color}`}>
                        {statusInfo.label}
                      </span>
                      <p className="text-sm text-slate-500 mt-1">
                        预订ID: {booking.id}
                      </p>
                    </div>
                  </div>
                  
                  {/* 备注信息 */}
                  {booking.notes && (
                    <div className="mb-4">
                      <p className="text-sm text-slate-500">备注</p>
                      <p className="text-sm text-slate-800 bg-slate-50 p-3 rounded-lg break-words">
                        {booking.notes}
                      </p>
                    </div>
                  )}
                  
                  {/* 管理员备注 */}
                  {booking.adminNotes && (
                    <div className="mb-4">
                      <p className="text-sm text-slate-500">管理员备注</p>
                      <p className="text-sm text-slate-800 bg-blue-50 p-3 rounded-lg break-words">
                        {booking.adminNotes}
                      </p>
                    </div>
                  )}
                  
                  {/* 操作按钮 */}
                  <div className="flex flex-col sm:flex-row gap-2">
                    <button
                      onClick={() => setSelectedBooking(booking)}
                      className="flex items-center justify-center gap-2 px-4 py-2 bg-slate-100 text-slate-700 rounded-lg font-medium hover:bg-slate-200 transition-colors"
                    >
                      <Eye size={16} />
                      查看详情
                    </button>
                    <button
                      onClick={() => handleDeleteBooking(booking.id)}
                      className="flex items-center justify-center gap-2 px-4 py-2 bg-red-100 text-red-700 rounded-lg font-medium hover:bg-red-200 transition-colors"
                    >
                      <Trash2 size={16} />
                      删除记录
                    </button>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* 详情弹窗 */}
      {selectedBooking && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-hidden">
            <div className="flex items-center justify-between p-6 border-b border-slate-200">
              <h2 className="text-xl font-semibold text-slate-800">预订详情</h2>
              <button
                onClick={() => setSelectedBooking(null)}
                className="text-slate-400 hover:text-slate-600 text-2xl font-bold leading-none"
              >
                ×
              </button>
            </div>
            
            <div className="p-6 overflow-y-auto max-h-[calc(90vh-140px)]">
              <div className="space-y-6">
                {/* 基本信息 */}
                <div>
                  <h3 className="text-lg font-semibold text-slate-800 mb-3">基本信息</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <p className="text-sm text-slate-500">预订ID</p>
                      <p className="font-medium text-slate-800">{selectedBooking.id}</p>
                    </div>
                    <div>
                      <p className="text-sm text-slate-500">预订时间</p>
                      <p className="font-medium text-slate-800">{formatTime(selectedBooking.createdAt)}</p>
                    </div>
                    <div>
                      <p className="text-sm text-slate-500">QQ号</p>
                      <p className="font-medium text-slate-800">{selectedBooking.qqNumber}</p>
                    </div>
                    <div>
                      <p className="text-sm text-slate-500">手机号</p>
                      <p className="font-medium text-slate-800">{selectedBooking.phoneNumber}</p>
                    </div>
                    <div>
                      <p className="text-sm text-slate-500">状态</p>
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusInfo(selectedBooking.status).color}`}>
                        {getStatusInfo(selectedBooking.status).label}
                      </span>
                    </div>
                    <div>
                      <p className="text-sm text-slate-500">数量</p>
                      <p className="font-medium text-slate-800">{selectedBooking.quantity}</p>
                    </div>
                  </div>
                </div>
                
                {/* 画集详情 */}
                {selectedBooking.collection && (
                  <div>
                    <h3 className="text-lg font-semibold text-slate-800 mb-3">画集详情</h3>
                    <div className="flex items-center gap-4 p-4 bg-slate-50 rounded-lg">
                      {selectedBooking.collection.coverImage ? (
                        <img
                          src={selectedBooking.collection.coverImage}
                          alt={selectedBooking.collection.title}
                          className="w-16 h-16 object-cover rounded-lg flex-shrink-0"
                        />
                      ) : (
                        <div className="w-16 h-16 bg-slate-100 rounded-lg flex-shrink-0 flex items-center justify-center text-slate-400 text-xs">
                          暂无图片
                        </div>
                      )}
                      <div className="min-w-0 flex-1">
                        <h4 className="font-medium text-slate-800">{selectedBooking.collection.title}</h4>
                        <p className="text-sm text-slate-600">编号：{selectedBooking.collection.number}</p>
                        <p className="text-sm text-slate-600">单价：¥{selectedBooking.collection.price || '待定'}</p>
                      </div>
                      <div className="text-right">
                        <p className="font-medium text-slate-800">数量：{selectedBooking.quantity}</p>
                        <p className="font-medium text-slate-800">
                          总价：¥{(selectedBooking.collection.price || 0) * selectedBooking.quantity}
                        </p>
                      </div>
                    </div>
                  </div>
                )}
                
                {/* 备注信息 */}
                {selectedBooking.notes && (
                  <div>
                    <h3 className="text-lg font-semibold text-slate-800 mb-3">用户备注</h3>
                    <p className="text-slate-800 bg-slate-50 p-4 rounded-lg break-words">
                      {selectedBooking.notes}
                    </p>
                  </div>
                )}
                
                {/* 管理员备注 */}
                {selectedBooking.adminNotes && (
                  <div>
                    <h3 className="text-lg font-semibold text-slate-800 mb-3">管理员备注</h3>
                    <p className="text-slate-800 bg-blue-50 p-4 rounded-lg break-words">
                      {selectedBooking.adminNotes}
                    </p>
                  </div>
                )}
                
                {/* 时间信息 */}
                <div>
                  <h3 className="text-lg font-semibold text-slate-800 mb-3">时间信息</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <p className="text-sm text-slate-500">创建时间</p>
                      <p className="font-medium text-slate-800">{formatTime(selectedBooking.createdAt)}</p>
                    </div>
                    <div>
                      <p className="text-sm text-slate-500">更新时间</p>
                      <p className="font-medium text-slate-800">{formatTime(selectedBooking.updatedAt)}</p>
                    </div>
                    {selectedBooking.confirmedAt && (
                      <div>
                        <p className="text-sm text-slate-500">确认时间</p>
                        <p className="font-medium text-slate-800">{formatTime(selectedBooking.confirmedAt)}</p>
                      </div>
                    )}
                    {selectedBooking.completedAt && (
                      <div>
                        <p className="text-sm text-slate-500">完成时间</p>
                        <p className="font-medium text-slate-800">{formatTime(selectedBooking.completedAt)}</p>
                      </div>
                    )}
                    {selectedBooking.cancelledAt && (
                      <div>
                        <p className="text-sm text-slate-500">取消时间</p>
                        <p className="font-medium text-slate-800">{formatTime(selectedBooking.cancelledAt)}</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}; 