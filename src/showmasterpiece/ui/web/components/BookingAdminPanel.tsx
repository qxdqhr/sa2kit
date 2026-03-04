/**
 * ShowMasterpiece 模块 - 预订管理面板组件
 * 
 * 管理员查看所有用户预订信息的面板组件
 * 
 * @fileoverview 预订管理面板组件
 */

'use client';

import React, { useState, useMemo, useCallback } from 'react';
import { Calendar, User, Package, Clock, CheckCircle, XCircle, RefreshCw, Eye, Edit, Save, X, Trash2, Download, Settings, Search } from 'lucide-react';
import { BookingAdminData, BookingAdminStats, BookingAdminQueryParams } from '../../../service/client-business/bookingAdminService';
import { BOOKING_EXPORT_FIELDS, DEFAULT_BOOKING_EXPORT_CONFIG } from '../../../service/client-business/exportConfig';
import { BookingStatus, BOOKING_STATUS_LABELS, BOOKING_STATUS_COLORS } from '../../../types/booking';
import { ExportResult, UniversalExportButton, UniversalExportClient } from '@/universalExport';

/**
 * 预订管理面板组件属性
 */
interface BookingAdminPanelProps {
  /** 预订数据列表 */
  bookings: BookingAdminData[];
  /** 统计信息 */
  stats: BookingAdminStats;
  /** 加载状态 */
  loading: boolean;
  /** 错误信息 */
  error?: string;
  /** 搜索参数 */
  searchParams: BookingAdminQueryParams;
  /** 刷新数据回调 */
  onRefresh: () => void;
  /** 搜索预订数据回调 */
  onSearch: (params: BookingAdminQueryParams) => Promise<void>;
  /** 清除搜索条件回调 */
  onClearSearch: () => void;
  /** 更新预订状态回调 */
  onUpdateStatus: (id: number, status: BookingStatus, adminNotes?: string) => Promise<void>;
  /** 删除预订回调 */
  onDeleteBooking: (id: number) => Promise<void>;
  /** 导出预订数据回调 */
  onExportBookings: (format?: 'csv' | 'excel') => Promise<void>;
}

/**
 * 预订管理面板组件
 * 
 * @param props 组件属性
 * @returns React组件
 */
export const BookingAdminPanel: React.FC<BookingAdminPanelProps> = ({
  bookings,
  stats,
  loading,
  error,
  searchParams,
  onRefresh,
  onSearch,
  onClearSearch,
  onUpdateStatus,
  onDeleteBooking,
  onExportBookings,
}) => {
  const [selectedBooking, setSelectedBooking] = useState<BookingAdminData | null>(null);
  const [filterStatus, setFilterStatus] = useState<BookingStatus | 'all'>(searchParams.status || 'all');
  const [editingBooking, setEditingBooking] = useState<number | null>(null);
  const [editForm, setEditForm] = useState<{ status: BookingStatus; adminNotes: string }>({
    status: 'pending',
    adminNotes: '',
  });
  
  // 分页状态
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10); // 每页显示数量
  
  // 搜索表单状态
  const [searchForm, setSearchForm] = useState<BookingAdminQueryParams>({
    qqNumber: searchParams.qqNumber || '',
    phoneNumber: searchParams.phoneNumber || '',
    status: searchParams.status || 'all'
  });

  // 创建导出客户端实例
  const exportService = useMemo(() => new UniversalExportClient(), []);

  // 用户价格结算功能状态
  const [enableUserPriceCalculation, setEnableUserPriceCalculation] = useState(false);

  // 计算用户价格结算的辅助函数
  const calculateUserTotalPrices = useCallback((bookings: BookingAdminData[]) => {
    const userPriceMap = new Map<string, number>();

    // 根据QQ号和手机号的组合来分组计算总价
    bookings.forEach(booking => {
      const userKey = `${booking.qqNumber || ''}_${booking.phoneNumber || ''}`;
      const currentPrice = userPriceMap.get(userKey) || 0;
      userPriceMap.set(userKey, currentPrice + (booking.totalPrice || 0));
    });

    return userPriceMap;
  }, []);

  // 自定义导出处理函数
  const handleCustomExport = useCallback(async (config: any) => {
    try {
      console.log('🚀 [BookingAdminPanel] 开始自定义导出:', {
        configId: config.id,
        format: config.format,
        bookingsLength: bookings.length,
        enableUserPriceCalculation,
      });

      // 计算用户总价映射（如果启用）
      const userPriceMap = enableUserPriceCalculation ? calculateUserTotalPrices(bookings) : null;

      // 准备导出数据
      const exportData = bookings.map(booking => {
        const baseData = {
          id: booking.id,
          collectionId: booking.collectionId,
          qqNumber: booking.qqNumber || '',
          phoneNumber: booking.phoneNumber || '',
          collectionTitle: booking.collection?.title || '未知画集',
          collectionNumber: booking.collection?.number || '',
          collectionPrice: booking.collection?.price || 0,
          status: booking.status,
          quantity: booking.quantity,
          price: booking.price,
          totalPrice: booking.totalPrice,
          notes: booking.notes || '',
          pickupMethod: booking.pickupMethod || '',
          adminNotes: booking.adminNotes || '',
          createdAt: booking.createdAt,
          updatedAt: booking.updatedAt,
          confirmedAt: booking.confirmedAt,
          completedAt: booking.completedAt,
          cancelledAt: booking.cancelledAt,
        };

        // 如果启用了用户价格结算，添加用户总价字段
        if (enableUserPriceCalculation && userPriceMap) {
          const userKey = `${booking.qqNumber || ''}_${booking.phoneNumber || ''}`;
          return {
            ...baseData,
            userTotalPrice: userPriceMap.get(userKey) || 0,
          };
        }

        return baseData;
      });

      console.log('📊 [BookingAdminPanel] 导出数据准备完成:', {
        exportDataLength: exportData.length,
        sampleData: exportData.slice(0, 2),
      });

      // 根据是否启用用户价格结算来调整导出配置
      const exportConfig = {
        ...config,
        fields: config.fields.map((field: any) => {
          // 如果是 userTotalPrice 字段，根据勾选状态启用或禁用
          if (field.key === 'userTotalPrice') {
            return {
              ...field,
              enabled: enableUserPriceCalculation,
            };
          }
          return field;
        }),
        grouping: enableUserPriceCalculation ? {
          ...config.grouping,
          fields: [
            ...config.grouping.fields,
            {
              key: 'userTotalPrice',
              label: '用户总价',
              mode: 'merge' as const,
              valueProcessing: 'first' as const,
              showGroupHeader: false,
              mergeCells: true
            }
          ]
        } : config.grouping,
      };

      // 直接调用API
      const response = await fetch('/api/universal-export/export', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          config: exportConfig,
          data: exportData,
          customFileName: `预订信息_${new Date().toISOString().split('T')[0]}${enableUserPriceCalculation ? '_含用户总价' : ''}`,
          // 不传递分页参数，避免导出时被分页限制
          pagination: undefined,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `导出失败: ${response.statusText}`);
      }

      // 解析JSON响应
      const responseData = await response.json();

      if (responseData.result && responseData.result.fileData) {
        // 有文件数据，使用base64数据创建blob并下载
        console.log('📁 [BookingAdminPanel] 检测到文件数据，开始下载');
        const { fileData, fileName } = responseData.result;

        // 将base64转换为blob
        const binaryString = atob(fileData);
        const bytes = new Uint8Array(binaryString.length);
        for (let i = 0; i < binaryString.length; i++) {
          bytes[i] = binaryString.charCodeAt(i);
        }

        // 根据文件扩展名确定MIME类型
        const getMimeType = (filename: string): string => {
          const extension = filename.split('.').pop()?.toLowerCase();
          switch (extension) {
            case 'csv':
              return 'text/csv; charset=utf-8';
            case 'xlsx':
            case 'xls':
              return 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
            case 'json':
              return 'application/json; charset=utf-8';
            default:
              return 'application/octet-stream';
          }
        };

        const blob = new Blob([bytes], { type: getMimeType(fileName) });
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = fileName;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);

        console.log('✅ [BookingAdminPanel] 文件下载完成:', { fileName, fileSize: bytes.length });
      } else {
        // 没有文件数据，只返回结果信息
        console.log('✅ [BookingAdminPanel] 导出完成:', responseData);
      }

    } catch (error) {
      console.error('❌ [BookingAdminPanel] 自定义导出失败:', error);
      throw error;
    }
  }, [bookings, enableUserPriceCalculation, calculateUserTotalPrices]);

  // 数据源函数（保留用于其他用途）
  const dataSource = useMemo(() => async () => {
    const firstBooking = bookings[0];
    console.log('📊 [BookingAdminPanel] dataSource 开始执行:', {
      bookingsLength: bookings.length,
      bookingsKeys: firstBooking ? Object.keys(firstBooking) : [],
      firstBookingPickupMethod: firstBooking?.pickupMethod ?? '无数据',
      enableUserPriceCalculation,
    });

    // 计算用户总价映射（如果启用）
    const userPriceMap = enableUserPriceCalculation ? calculateUserTotalPrices(bookings) : null;

    const mappedData = bookings.map(booking => {
      // 根据实际API返回的数据结构进行映射
      const baseMapped = {
        id: booking.id,
        collectionId: booking.collectionId,
        qqNumber: booking.qqNumber || '',
        phoneNumber: booking.phoneNumber || '',
        collectionTitle: booking.collection?.title || '未知画集',
        collectionNumber: booking.collection?.number || '未知编号',
        collectionPrice: booking.collection?.price || 0,
        status: booking.status,
        quantity: booking.quantity,
        price: booking.collection?.price || 0, // 使用画集价格作为单价
        totalPrice: booking.totalPrice || (booking.collection?.price || 0) * booking.quantity,
        notes: booking.notes || '',
        pickupMethod: booking.pickupMethod || '', // 添加领取方式字段
        adminNotes: booking.adminNotes || '',
        createdAt: booking.createdAt,
        updatedAt: booking.updatedAt,
        confirmedAt: booking.confirmedAt || '',
        completedAt: booking.completedAt || '',
        cancelledAt: booking.cancelledAt || '',
      };

      // 如果启用了用户价格结算，添加用户总价字段
      if (enableUserPriceCalculation && userPriceMap) {
        const userKey = `${booking.qqNumber || ''}_${booking.phoneNumber || ''}`;
        return {
          ...baseMapped,
          userTotalPrice: userPriceMap.get(userKey) || 0,
        };
      }

      return baseMapped;
    });

    console.log('📊 [BookingAdminPanel] 数据映射完成:', {
      totalRows: mappedData.length,
      sampleRow: mappedData[0],
      pickupMethodSamples: mappedData.slice(0, 3).map((row, idx) => ({
        index: idx,
        id: row.id,
        pickupMethod: row.pickupMethod,
        originalPickupMethod: bookings[idx]?.pickupMethod,
      }))
    });

    return mappedData;
  }, [bookings, enableUserPriceCalculation, calculateUserTotalPrices]);

  /**
   * 获取状态信息
   */
  const getStatusInfo = (status: BookingStatus) => {
    return {
      label: BOOKING_STATUS_LABELS[status],
      color: BOOKING_STATUS_COLORS[status],
    };
  };

  /**
   * 过滤预订数据
   */
  const filteredBookings = bookings.filter(booking => {
    if (filterStatus === 'all') return true;
    return booking.status === filterStatus;
  });

  /**
   * 分页计算
   */
  const totalItems = filteredBookings.length;
  const totalPages = Math.ceil(totalItems / pageSize);
  const startIndex = (currentPage - 1) * pageSize;
  const endIndex = startIndex + pageSize;
  const paginatedBookings = filteredBookings.slice(startIndex, endIndex);

  /**
   * 处理页码变化
   */
  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  /**
   * 处理页面大小变化
   */
  const handlePageSizeChange = (size: number) => {
    setPageSize(size);
    setCurrentPage(1); // 重置到第一页
  };

  /**
   * 格式化时间
   */
  const formatTime = (timeString: string) => {
    return new Date(timeString).toLocaleString('zh-CN');
  };

  /**
   * 处理编辑预订
   */
  const handleEditBooking = (booking: BookingAdminData) => {
    setEditingBooking(booking.id);
    setEditForm({
      status: booking.status,
      adminNotes: booking.adminNotes || '',
    });
  };

  /**
   * 处理保存编辑
   */
  const handleSaveEdit = async () => {
    if (editingBooking) {
      try {
        console.log('保存编辑:', { bookingId: editingBooking, status: editForm.status, adminNotes: editForm.adminNotes });
        await onUpdateStatus(editingBooking, editForm.status, editForm.adminNotes);
        console.log('编辑保存成功');
        setEditingBooking(null);
        setEditForm({ status: 'pending', adminNotes: '' });
      } catch (error) {
        console.error('保存编辑失败:', error);
        // 保持编辑状态，让用户看到错误
      }
    }
  };

  /**
   * 处理取消编辑
   */
  const handleCancelEdit = () => {
    setEditingBooking(null);
    setEditForm({ status: 'pending', adminNotes: '' });
  };

  /**
   * 处理删除预订
   */
  const handleDeleteBooking = async (bookingId: number) => {
    if (confirm('确定要删除这个预订吗？此操作不可撤销。')) {
      try {
        await onDeleteBooking(bookingId);
        console.log('预订删除成功');
      } catch (error) {
        console.error('删除预订失败:', error);
        // 错误已经在hook中处理，这里不需要额外处理
      }
    }
  };

  /**
   * 处理导出预订数据
   */
  const handleExportBookings = async () => {
    try {
      await onExportBookings('csv');
      console.log('预订数据导出成功');
    } catch (error) {
      console.error('导出预订数据失败:', error);
      // 错误已经在hook中处理，这里不需要额外处理
    }
  };

  /**
   * 处理搜索表单提交
   */
  const handleSearchSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const params: BookingAdminQueryParams = {};
    
    if (searchForm.qqNumber?.trim()) {
      params.qqNumber = searchForm.qqNumber.trim();
    }
    if (searchForm.phoneNumber?.trim()) {
      params.phoneNumber = searchForm.phoneNumber.trim();
    }
    if (searchForm.status && searchForm.status !== 'all') {
      params.status = searchForm.status;
    }
    
    console.log('🔍 [BookingAdminPanel] 提交搜索参数:', {
      searchForm,
      params,
      timestamp: new Date().toISOString()
    });
    
    // 重置分页到第一页
    setCurrentPage(1);
    
    await onSearch(params);
  };

  /**
   * 处理清除搜索
   */
  const handleClearSearch = async () => {
    setSearchForm({
      qqNumber: '',
      phoneNumber: '',
      status: 'all'
    });
    setFilterStatus('all');
    // 重置分页到第一页
    setCurrentPage(1);
    await onClearSearch();
  };

  /**
   * 处理状态过滤
   */
  const handleStatusFilter = async (status: BookingStatus | 'all') => {
    setFilterStatus(status);
    setSearchForm(prev => ({ ...prev, status }));
    
    // 重置分页到第一页
    setCurrentPage(1);
    
    // 保持当前的QQ号和手机号搜索条件，只更新状态过滤
    const params: BookingAdminQueryParams = {};
    
    if (searchForm.qqNumber?.trim()) {
      params.qqNumber = searchForm.qqNumber.trim();
    }
    if (searchForm.phoneNumber?.trim()) {
      params.phoneNumber = searchForm.phoneNumber.trim();
    }
    if (status && status !== 'all') {
      params.status = status;
    }
    
    await onSearch(params);
  };

  return (
    <div className="space-y-6">
      {/* 统计卡片 */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-4 sm:p-6">
          <div className="flex items-center">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Calendar size={20} className="text-blue-600 sm:w-6 sm:h-6" />
            </div>
            <div className="ml-3 sm:ml-4">
              <h3 className="text-lg sm:text-2xl font-bold text-slate-800">{stats.totalBookings}</h3>
              <p className="text-xs sm:text-sm text-slate-600">总预订数</p>
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-4 sm:p-6">
          <div className="flex items-center">
            <div className="p-2 bg-yellow-100 rounded-lg">
              <Clock size={20} className="text-yellow-600 sm:w-6 sm:h-6" />
            </div>
            <div className="ml-3 sm:ml-4">
              <h3 className="text-lg sm:text-2xl font-bold text-slate-800">{stats.pendingBookings}</h3>
              <p className="text-xs sm:text-sm text-slate-600">待确认</p>
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-4 sm:p-6">
          <div className="flex items-center">
            <div className="p-2 bg-green-100 rounded-lg">
              <CheckCircle size={20} className="text-green-600 sm:w-6 sm:h-6" />
            </div>
            <div className="ml-3 sm:ml-4">
              <h3 className="text-lg sm:text-2xl font-bold text-slate-800">{stats.completedBookings}</h3>
              <p className="text-xs sm:text-sm text-slate-600">已完成</p>
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-4 sm:p-6">
          <div className="flex items-center">
            <div className="p-2 bg-purple-100 rounded-lg">
              <Package size={20} className="text-purple-600 sm:w-6 sm:h-6" />
            </div>
            <div className="ml-3 sm:ml-4">
              <h3 className="text-lg sm:text-2xl font-bold text-slate-800">¥{stats.totalRevenue}</h3>
              <p className="text-xs sm:text-sm text-slate-600">总收入</p>
            </div>
          </div>
        </div>
      </div>

      {/* 搜索栏 */}
      <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-4">
        <form onSubmit={handleSearchSubmit} className="space-y-4">
          <div className="flex flex-col sm:flex-row gap-4">
            {/* QQ号搜索 */}
            <div className="flex-1">
              <label htmlFor="searchQqNumber" className="block text-sm font-medium text-slate-700 mb-2">
                QQ号搜索
              </label>
              <input
                type="text"
                id="searchQqNumber"
                value={searchForm.qqNumber}
                onChange={(e) => setSearchForm(prev => ({ ...prev, qqNumber: e.target.value }))}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="输入QQ号进行搜索"
              />
            </div>
            
            {/* 手机号搜索 */}
            <div className="flex-1">
              <label htmlFor="searchPhoneNumber" className="block text-sm font-medium text-slate-700 mb-2">
                手机号搜索
              </label>
              <input
                type="tel"
                id="searchPhoneNumber"
                value={searchForm.phoneNumber}
                onChange={(e) => setSearchForm(prev => ({ ...prev, phoneNumber: e.target.value }))}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="输入手机号进行搜索"
              />
            </div>
            
            {/* 状态过滤 */}
            <div className="flex-1">
              <label htmlFor="searchStatus" className="block text-sm font-medium text-slate-700 mb-2">
                状态过滤
              </label>
              <select
                id="searchStatus"
                value={searchForm.status}
                onChange={(e) => setSearchForm(prev => ({ ...prev, status: e.target.value as BookingStatus | 'all' }))}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">全部状态</option>
                <option value="pending">待确认</option>
                <option value="confirmed">已确认</option>
                <option value="completed">已完成</option>
                <option value="cancelled">已取消</option>
              </select>
            </div>
          </div>
          
          {/* 搜索按钮 */}
          <div className="flex gap-2">
            <button
              type="submit"
              disabled={loading}
              className="flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors disabled:opacity-50"
            >
              <Search size={16} />
              搜索
            </button>
            <button
              type="button"
              onClick={handleClearSearch}
              disabled={loading}
              className="flex items-center justify-center gap-2 px-4 py-2 bg-slate-100 text-slate-700 rounded-lg font-medium hover:bg-slate-200 transition-colors disabled:opacity-50"
            >
              <X size={16} />
              清除
            </button>
          </div>
        </form>
      </div>

      {/* 操作栏 */}
      <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex flex-wrap gap-2">
            <button
              className={`px-3 py-2 text-sm sm:text-base rounded-lg font-medium transition-colors ${
                filterStatus === 'all' 
                  ? 'bg-blue-600 text-white' 
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
              onClick={() => handleStatusFilter('all')}
            >
              全部
            </button>
            <button
              className={`px-3 py-2 text-sm sm:text-base rounded-lg font-medium transition-colors ${
                filterStatus === 'pending' 
                  ? 'bg-blue-600 text-white' 
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
              onClick={() => handleStatusFilter('pending')}
            >
              待确认
            </button>
            <button
              className={`px-3 py-2 text-sm sm:text-base rounded-lg font-medium transition-colors ${
                filterStatus === 'confirmed' 
                  ? 'bg-blue-600 text-white' 
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
              onClick={() => handleStatusFilter('confirmed')}
            >
              已确认
            </button>
            <button
              className={`px-3 py-2 text-sm sm:text-base rounded-lg font-medium transition-colors ${
                filterStatus === 'completed' 
                  ? 'bg-blue-600 text-white' 
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
              onClick={() => handleStatusFilter('completed')}
            >
              已完成
            </button>
            <button
              className={`px-3 py-2 text-sm sm:text-base rounded-lg font-medium transition-colors ${
                filterStatus === 'cancelled' 
                  ? 'bg-blue-600 text-white' 
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
              onClick={() => handleStatusFilter('cancelled')}
            >
              已取消
            </button>
          </div>
          
          <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
            <button
              onClick={onRefresh}
              disabled={loading}
              className="flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors disabled:opacity-50"
            >
              <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
              刷新
            </button>

            {/* 用户价格结算勾选框 */}
            <div className="flex items-center gap-2 px-3 py-2 bg-white border border-slate-200 rounded-lg">
              <input
                type="checkbox"
                id="enableUserPriceCalculation"
                checked={enableUserPriceCalculation}
                onChange={(e) => setEnableUserPriceCalculation(e.target.checked)}
                className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 focus:ring-2"
              />
              <label
                htmlFor="enableUserPriceCalculation"
                className="text-sm font-medium text-slate-700 cursor-pointer"
                title="勾选后导出Excel时会添加一列用户总价（根据QQ号+手机号唯一匹配）"
              >
                包含用户总价
              </label>
            </div>

            <UniversalExportButton
              exportService={exportService}
              moduleId="showmasterpiece"
              businessId="bookings"
              availableFields={BOOKING_EXPORT_FIELDS.map(field => ({
                ...field,
                enabled: field.key === 'userTotalPrice' ? enableUserPriceCalculation : field.enabled,
              }))}
              dataSource={dataSource}
              defaultConfig={(() => {
                const config = {
                  ...DEFAULT_BOOKING_EXPORT_CONFIG,
                  fields: DEFAULT_BOOKING_EXPORT_CONFIG.fields.map(field => ({
                    ...field,
                    enabled: field.key === 'userTotalPrice' ? enableUserPriceCalculation : field.enabled,
                  })),
                  grouping: enableUserPriceCalculation ? {
                    ...DEFAULT_BOOKING_EXPORT_CONFIG.grouping,
                    fields: [
                      ...DEFAULT_BOOKING_EXPORT_CONFIG.grouping.fields,
                      {
                        key: 'userTotalPrice',
                        label: '用户总价',
                        mode: 'merge' as const,
                        valueProcessing: 'first' as const,
                        showGroupHeader: false,
                        mergeCells: true
                      }
                    ]
                  } : DEFAULT_BOOKING_EXPORT_CONFIG.grouping,
                };
                console.log('🔍 [BookingAdminPanel] 传递的默认配置:', {
                  id: config.id,
                  format: config.format,
                  hasGrouping: !!config.grouping,
                  groupingEnabled: config.grouping?.enabled,
                  groupingFields: config.grouping?.fields?.map(f => ({ key: f.key, mergeCells: f.mergeCells })) || [],
                  enableUserPriceCalculation,
                });
                return config;
              })()}
              buttonText="导出数据"
              variant="primary"
              size="md"
              disabled={loading}
              onExportSuccess={(result: ExportResult) => {
                console.log('✅ [BookingAdminPanel] UniversalExportButton 导出成功:', result);
              }}
              onExportError={(error: string) => {
                console.error('❌ [BookingAdminPanel] UniversalExportButton 导出失败:', error);
              }}
            />

            {/* 备用导出按钮 - 直接调用API */}
            <button
              onClick={async () => {
                try {
                  await handleCustomExport(DEFAULT_BOOKING_EXPORT_CONFIG);
                  console.log('✅ [BookingAdminPanel] 自定义导出成功');
                } catch (error) {
                  console.error('❌ [BookingAdminPanel] 自定义导出失败:', error);
                  alert(`导出失败: ${error instanceof Error ? error.message : '未知错误'}`);
                }
              }}
              disabled={loading || bookings.length === 0}
              className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Download size={16} />
              直接导出 ({bookings.length}条)
            </button>
          </div>
        </div>
      </div>

      {/* 错误提示 */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex">
            <div className="text-red-400 mr-3 flex-shrink-0">
              <XCircle size={20} />
            </div>
            <div className="min-w-0 flex-1">
              <h3 className="text-sm font-medium text-red-800">加载失败</h3>
              <p className="text-sm text-red-700 mt-1 break-words">{error}</p>
            </div>
          </div>
        </div>
      )}

      {/* 预订列表 */}
      <div className="space-y-4">
        {paginatedBookings.length === 0 ? (
          <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-8 sm:p-12 text-center">
            <Calendar size={40} className="text-slate-400 mx-auto mb-4 sm:w-12 sm:h-12" />
            <h3 className="text-base sm:text-lg font-medium text-slate-800 mb-2">暂无预订数据</h3>
            <p className="text-sm sm:text-base text-slate-600">
              {totalItems === 0 ? '当前筛选条件下没有找到预订数据' : '当前页无数据'}
            </p>
          </div>
        ) : (
          paginatedBookings.map((booking) => {
            const statusInfo = getStatusInfo(booking.status);
            
            return (
              <div key={booking.id} className="bg-white rounded-lg shadow-sm border border-slate-200 overflow-hidden">
                <div className="p-4 sm:p-6">
                  <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 mb-4">
                    <div className="flex items-start gap-3 sm:gap-4">
                      {booking.collection.coverImage ? (
                        <img
                          src={booking.collection.coverImage}
                          alt={booking.collection.title}
                          className="w-12 h-12 sm:w-16 sm:h-16 object-cover rounded-lg flex-shrink-0"
                        />
                      ) : (
                        <div className="w-12 h-12 sm:w-16 sm:h-16 bg-slate-100 rounded-lg flex-shrink-0 flex items-center justify-center text-slate-400 text-xs">
                          暂无
                        </div>
                      )}
                      <div className="min-w-0 flex-1">
                        <h3 className="text-base sm:text-lg font-semibold text-slate-800 truncate">{booking.collection.title}</h3>
                        <p className="text-sm text-slate-600">编号：{booking.collection.number}</p>
                        <p className="text-sm text-slate-600">QQ号：{booking.qqNumber}</p>
                        {booking.phoneNumber && (
                          <p className="text-sm text-slate-600">手机号：{booking.phoneNumber}</p>
                        )}
                      </div>
                    </div>
                    
                    <div className="text-left sm:text-right">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${statusInfo.color}`}>
                        {statusInfo.label}
                      </span>
                      <p className="text-sm text-slate-500 mt-1"># {booking.id}</p>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-4">
                    <div>
                      <p className="text-xs text-slate-500">数量</p>
                      <p className="text-sm font-medium text-slate-800">{booking.quantity}</p>
                    </div>
                    <div>
                      <p className="text-xs text-slate-500">单价</p>
                      <p className="text-sm font-medium text-slate-800">¥{booking.collection.price}</p>
                    </div>
                    <div>
                      <p className="text-xs text-slate-500">总价</p>
                      <p className="text-sm font-medium text-slate-800">¥{booking.totalPrice}</p>
                    </div>
                    <div>
                      <p className="text-xs text-slate-500">预订时间</p>
                      <p className="text-sm font-medium text-slate-800">{formatTime(booking.createdAt)}</p>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 mb-4">
                    <div>
                      <p className="text-xs text-slate-500">QQ号</p>
                      <p className="text-sm font-medium text-slate-800">{booking.qqNumber}</p>
                    </div>
                    <div>
                      <p className="text-xs text-slate-500">手机号</p>
                      <p className="text-sm font-medium text-slate-800">{booking.phoneNumber}</p>
                    </div>
                  </div>
                  
                  {/* 时间字段 */}
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 mb-4">
                    {booking.confirmedAt && (
                      <div>
                        <p className="text-xs text-slate-500">确认时间</p>
                        <p className="text-sm font-medium text-green-800">{formatTime(booking.confirmedAt)}</p>
                      </div>
                    )}
                    {booking.completedAt && (
                      <div>
                        <p className="text-xs text-slate-500">完成时间</p>
                        <p className="text-sm font-medium text-blue-800">{formatTime(booking.completedAt)}</p>
                      </div>
                    )}
                    {booking.cancelledAt && (
                      <div>
                        <p className="text-xs text-slate-500">取消时间</p>
                        <p className="text-sm font-medium text-red-800">{formatTime(booking.cancelledAt)}</p>
                      </div>
                    )}
                  </div>
                  
                  {(booking.notes || booking.adminNotes ||booking.pickupMethod) && (
                    <div className="mb-4">
                      {booking.pickupMethod && (
                        <div className="mb-2">
                          <p className="text-xs text-slate-500">领取方式
                            请填写2月10号以后能收到货的地址
                            （1）收件人
                            （2）收件地址
                            （3）收件手机号
                          </p>
                          <p className="text-sm text-slate-700">{booking.pickupMethod}</p>
                        </div>
                      )}
                      {booking.notes && (
                        <div className="mb-2">
                          <p className="text-xs text-slate-500">用户备注：
                            （1）葱韵环京ComicUniverse
                            （2）葱韵环京外星开拓群
                            （3）葱韵环京比邻星
                            （4）葱韵环京华东群
                            （5）葱韵环京天津群
                            （6）葱韵环京·四维空间
                          </p>
                          <p className="text-sm text-slate-700">{booking.notes}</p>
                        </div>
                      )}
                      {booking.adminNotes && (
                        <div>
                          <p className="text-xs text-slate-500">管理员备注</p>
                          <p className="text-sm text-slate-700">{booking.adminNotes}</p>
                        </div>
                      )}
                    </div>
                  )}
                  
                  <div className="flex flex-col sm:flex-row gap-2">
                    {editingBooking === booking.id ? (
                      <>
                        <select
                          value={editForm.status}
                          onChange={(e) => setEditForm(prev => ({ ...prev, status: e.target.value as BookingStatus }))}
                          className="flex-1 px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                          <option value="pending">待确认</option>
                          <option value="confirmed">已确认</option>
                          <option value="completed">已完成</option>
                          <option value="cancelled">已取消</option>
                        </select>
                        <input
                          type="text"
                          value={editForm.adminNotes}
                          onChange={(e) => setEditForm(prev => ({ ...prev, adminNotes: e.target.value }))}
                          placeholder="管理员备注"
                          className="flex-1 px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                        <button
                          onClick={handleSaveEdit}
                          className="flex items-center justify-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 transition-colors"
                        >
                          <Save size={16} />
                          保存
                        </button>
                        <button
                          onClick={handleCancelEdit}
                          className="flex items-center justify-center gap-2 px-4 py-2 bg-slate-100 text-slate-700 rounded-lg font-medium hover:bg-slate-200 transition-colors"
                        >
                          <X size={16} />
                          取消
                        </button>
                      </>
                    ) : (
                      <>
                        <button
                          onClick={() => handleEditBooking(booking)}
                          className="flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors"
                        >
                          <Edit size={16} />
                          编辑
                        </button>
                        <button
                          onClick={() => handleDeleteBooking(booking.id)}
                          className="flex items-center justify-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg font-medium hover:bg-red-700 transition-colors"
                        >
                          <Trash2 size={16} />
                          删除
                        </button>
                      </>
                    )}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* 分页组件 */}
      {totalItems > 0 && (
        <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-4 sm:p-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            {/* 分页信息 */}
            <div className="flex items-center gap-4">
              <div className="text-sm text-slate-600">
                共 {totalItems} 条记录，第 {currentPage} / {totalPages} 页
              </div>
              <div className="flex items-center gap-2">
                <span className="text-sm text-slate-600">每页显示</span>
                <select
                  value={pageSize}
                  onChange={(e) => handlePageSizeChange(Number(e.target.value))}
                  className="px-2 py-1 border border-slate-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value={5}>5</option>
                  <option value={10}>10</option>
                  <option value={20}>20</option>
                  <option value={50}>50</option>
                </select>
                <span className="text-sm text-slate-600">条</span>
              </div>
            </div>

            {/* 分页按钮 */}
            <div className="flex items-center gap-2">
              {/* 上一页 */}
              <button
                onClick={() => handlePageChange(currentPage - 1)}
                disabled={currentPage === 1}
                className="px-3 py-1 text-sm border border-slate-300 rounded hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-white"
              >
                上一页
              </button>

              {/* 页码 */}
              <div className="flex items-center gap-1">
                {Array.from({ length: Math.min(totalPages, 7) }, (_, index) => {
                  let pageNum;
                  
                  if (totalPages <= 7) {
                    // 总页数小于等于7，显示所有页码
                    pageNum = index + 1;
                  } else {
                    // 总页数大于7，显示部分页码
                    if (currentPage <= 4) {
                      // 当前页在前4页
                      if (index < 5) {
                        pageNum = index + 1;
                      } else if (index === 5) {
                        return <span key={index} className="px-2 text-slate-400">...</span>;
                      } else {
                        pageNum = totalPages;
                      }
                    } else if (currentPage >= totalPages - 3) {
                      // 当前页在后4页
                      if (index === 0) {
                        pageNum = 1;
                      } else if (index === 1) {
                        return <span key={index} className="px-2 text-slate-400">...</span>;
                      } else {
                        pageNum = totalPages - 5 + index;
                      }
                    } else {
                      // 当前页在中间
                      if (index === 0) {
                        pageNum = 1;
                      } else if (index === 1) {
                        return <span key={index} className="px-2 text-slate-400">...</span>;
                      } else if (index >= 2 && index <= 4) {
                        pageNum = currentPage - 3 + index;
                      } else if (index === 5) {
                        return <span key={index} className="px-2 text-slate-400">...</span>;
                      } else {
                        pageNum = totalPages;
                      }
                    }
                  }

                  return (
                    <button
                      key={index}
                      onClick={() => handlePageChange(pageNum)}
                      className={`px-3 py-1 text-sm border rounded ${
                        pageNum === currentPage
                          ? 'bg-blue-500 text-white border-blue-500'
                          : 'border-slate-300 hover:bg-slate-50'
                      }`}
                    >
                      {pageNum}
                    </button>
                  );
                })}
              </div>

              {/* 下一页 */}
              <button
                onClick={() => handlePageChange(currentPage + 1)}
                disabled={currentPage === totalPages}
                className="px-3 py-1 text-sm border border-slate-300 rounded hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-white"
              >
                下一页
              </button>
            </div>
          </div>

          {/* 移动端简化分页 */}
          <div className="sm:hidden">
            <div className="flex items-center justify-between pt-4 border-t border-slate-200">
              <button
                onClick={() => handlePageChange(currentPage - 1)}
                disabled={currentPage === 1}
                className="flex items-center gap-2 px-4 py-2 text-sm bg-slate-100 rounded hover:bg-slate-200 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-slate-100"
              >
                上一页
              </button>
              
              <span className="text-sm text-slate-600">
                {currentPage} / {totalPages}
              </span>
              
              <button
                onClick={() => handlePageChange(currentPage + 1)}
                disabled={currentPage === totalPages}
                className="flex items-center gap-2 px-4 py-2 text-sm bg-slate-100 rounded hover:bg-slate-200 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-slate-100"
              >
                下一页
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 预订详情弹窗 */}
      {selectedBooking && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-hidden">
            <div className="flex items-center justify-between p-4 sm:p-6 border-b border-slate-200">
              <h2 className="text-lg sm:text-xl font-semibold text-slate-800">预订详情</h2>
              <button
                onClick={() => setSelectedBooking(null)}
                className="text-slate-400 hover:text-slate-600 text-2xl font-bold leading-none p-1"
              >
                ×
              </button>
            </div>
            
            <div className="p-4 sm:p-6 overflow-y-auto max-h-[calc(90vh-140px)]">
              <div className="space-y-6">
                {/* 画集信息 */}
                <div>
                  <h3 className="text-base sm:text-lg font-semibold text-slate-800 mb-3">画集信息</h3>
                  <div className="flex items-start gap-3 sm:gap-4">
                    {selectedBooking.collection.coverImage ? (
                      <img
                        src={selectedBooking.collection.coverImage}
                        alt={selectedBooking.collection.title}
                        className="w-16 h-16 sm:w-20 sm:h-20 object-cover rounded-lg flex-shrink-0"
                      />
                    ) : (
                      <div className="w-16 h-16 sm:w-20 sm:h-20 bg-slate-100 rounded-lg flex-shrink-0 flex items-center justify-center text-slate-400 text-xs">
                        暂无图片
                      </div>
                    )}
                    <div className="min-w-0 flex-1">
                      <h4 className="font-medium text-slate-800 truncate">{selectedBooking.collection.title}</h4>
                      <p className="text-sm text-slate-600">编号：{selectedBooking.collection.number}</p>
                      <p className="text-sm text-slate-600">价格：¥{selectedBooking.collection.price || '待定'}</p>
                    </div>
                  </div>
                </div>
                
                {/* 预订信息 */}
                <div>
                  <h3 className="text-base sm:text-lg font-semibold text-slate-800 mb-3">预订信息</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                    <div>
                      <p className="text-sm text-slate-500">预订ID</p>
                      <p className="font-medium text-slate-800">#{selectedBooking.id}</p>
                    </div>
                    <div>
                      <p className="text-sm text-slate-500">QQ号</p>
                      <p className="font-medium text-slate-800">{selectedBooking.qqNumber}</p>
                    </div>
                    {selectedBooking.phoneNumber && (
                      <div>
                        <p className="text-sm text-slate-500">手机号</p>
                        <p className="font-medium text-slate-800">{selectedBooking.phoneNumber}</p>
                      </div>
                    )}
                    <div>
                      <p className="text-sm text-slate-500">预订数量</p>
                      <p className="font-medium text-slate-800">{selectedBooking.quantity}</p>
                    </div>
                    <div>
                      <p className="text-sm text-slate-500">总价格</p>
                      <p className="font-medium text-slate-800">¥{selectedBooking.totalPrice}</p>
                    </div>
                    <div>
                      <p className="text-sm text-slate-500">状态</p>
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusInfo(selectedBooking.status).color}`}>
                        {getStatusInfo(selectedBooking.status).label}
                      </span>
                    </div>
                  </div>
                </div>
                
                {/* 时间信息 */}
                <div>
                  <h3 className="text-base sm:text-lg font-semibold text-slate-800 mb-3">时间信息</h3>
                  <div className="space-y-2">
                    <div>
                      <p className="text-sm text-slate-500">预订时间</p>
                      <p className="text-sm font-medium text-slate-800">{formatTime(selectedBooking.createdAt)}</p>
                    </div>
                    <div>
                      <p className="text-sm text-slate-500">更新时间</p>
                      <p className="text-sm font-medium text-slate-800">{formatTime(selectedBooking.updatedAt)}</p>
                    </div>
                    {selectedBooking.confirmedAt && (
                      <div>
                        <p className="text-sm text-slate-500">确认时间</p>
                        <p className="text-sm font-medium text-slate-800">{formatTime(selectedBooking.confirmedAt)}</p>
                      </div>
                    )}
                    {selectedBooking.completedAt && (
                      <div>
                        <p className="text-sm text-slate-500">完成时间</p>
                        <p className="text-sm font-medium text-slate-800">{formatTime(selectedBooking.completedAt)}</p>
                      </div>
                    )}
                    {selectedBooking.cancelledAt && (
                      <div>
                        <p className="text-sm text-slate-500">取消时间</p>
                        <p className="text-sm font-medium text-slate-800">{formatTime(selectedBooking.cancelledAt)}</p>
                      </div>
                    )}
                  </div>
                </div>
                
                {/* 备注信息 */}
                {selectedBooking.notes && (
                  <div>
                    <h3 className="text-base sm:text-lg font-semibold text-slate-800 mb-3">用户备注</h3>
                    <p className="text-sm text-slate-800 bg-slate-50 p-4 rounded-lg break-words">{selectedBooking.notes}</p>
                  </div>
                )}
                
                {selectedBooking.adminNotes && (
                  <div>
                    <h3 className="text-base sm:text-lg font-semibold text-slate-800 mb-3">管理员备注</h3>
                    <p className="text-sm text-slate-800 bg-slate-50 p-4 rounded-lg break-words">{selectedBooking.adminNotes}</p>
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
