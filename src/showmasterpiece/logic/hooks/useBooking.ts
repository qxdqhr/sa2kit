/**
 * ShowMasterpiece 模块 - 预订功能Hook
 * 
 * 提供预订功能相关的状态管理和业务逻辑，包括：
 * - 预订表单状态管理
 * - 画集列表加载
 * - 预订提交处理
 * - 错误处理和加载状态
 * 
 * @fileoverview 预订功能Hook
 */

import { useState, useEffect, useCallback } from 'react';
import { 
  BookingFormData, 
  CollectionSummary, 
  BookingPageState,
  CreateBookingRequest 
} from '../../types/booking';
import { getBookableCollections, createBooking } from '../../service/client-business/bookingService';

/**
 * 预订页面Hook属性
 */
interface UseBookingProps {}

/**
 * 预订页面Hook
 * 
 * 管理预订页面的状态和业务逻辑
 * 
 * @param props Hook属性
 * @returns 预订页面状态和操作方法
 */
export function useBooking(_props: UseBookingProps = {}) {
  // 状态管理
  const [state, setState] = useState<BookingPageState>({
    collections: [],
    loading: false,
    error: undefined,
    submitting: false,
    submitted: false,
  });

  /**
   * 加载画集列表
   */
  const loadCollections = useCallback(async () => {
    setState(prev => ({ ...prev, loading: true, error: undefined }));
    
    try {
      console.log('🔄 [useBooking] 加载画集列表...');
      const collections = await getBookableCollections();
      setState(prev => ({ 
        ...prev, 
        collections, 
        loading: false 
      }));
    } catch (error) {
      console.error('加载画集列表失败:', error);
      setState(prev => ({ 
        ...prev, 
        loading: false, 
        error: error instanceof Error ? error.message : '加载画集列表失败' 
      }));
    }
  }, []);

  /**
   * 提交预订
   * 
   * @param formData 预订表单数据
   */
  const submitBooking = useCallback(async (formData: BookingFormData) => {
    setState(prev => ({ ...prev, submitting: true, error: undefined }));
    
    try {
      const bookingData: CreateBookingRequest = {
        collectionId: formData.collectionId,
        qqNumber: formData.qqNumber,
        phoneNumber: formData.phoneNumber.trim(),
        quantity: formData.quantity,
        notes: formData.notes || undefined,
      };

      await createBooking(bookingData);
      
      setState(prev => ({ 
        ...prev, 
        submitting: false, 
        submitted: true 
      }));
    } catch (error) {
      console.error('提交预订失败:', error);
      setState(prev => ({ 
        ...prev, 
        submitting: false, 
        error: error instanceof Error ? error.message : '提交预订失败' 
      }));
    }
  }, []);

  /**
   * 重置提交状态
   */
  const resetSubmission = useCallback(() => {
    setState(prev => ({ 
      ...prev, 
      submitted: false, 
      error: undefined 
    }));
  }, []);

  /**
   * 清除错误信息
   */
  const clearError = useCallback(() => {
    setState(prev => ({ ...prev, error: undefined }));
  }, []);

  // 组件挂载时加载画集列表
  useEffect(() => {
    loadCollections();
  }, [loadCollections]);

  return {
    // 状态
    collections: state.collections,
    loading: state.loading,
    error: state.error,
    submitting: state.submitting,
    submitted: state.submitted,
    
    // 操作方法
    loadCollections,
    submitBooking,
    resetSubmission,
    clearError,
  };
}

/**
 * 预订表单Hook
 * 
 * 管理预订表单的状态和验证
 * 
 * @returns 表单状态和操作方法
 */
export function useBookingForm() {
  const [formData, setFormData] = useState<BookingFormData>({
    collectionId: 0,
    qqNumber: '',
    phoneNumber: '',
    quantity: 1,
    notes: '',
  });

  const [errors, setErrors] = useState<Partial<Record<keyof BookingFormData, string>>>({});

  /**
   * 更新表单字段
   * 
   * @param field 字段名
   * @param value 字段值
   */
  const updateField = useCallback((field: keyof BookingFormData, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    
    // 清除对应字段的错误
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: undefined }));
    }
  }, [errors]);

  /**
   * 验证表单
   * 
   * @returns 是否验证通过
   */
  const validateForm = useCallback((): boolean => {
    const newErrors: Partial<Record<keyof BookingFormData, string>> = {};

    // 验证画集选择
    if (!formData.collectionId) {
      newErrors.collectionId = '请选择要预订的画集';
    }

    // 验证QQ号
    if (!formData.qqNumber.trim()) {
      newErrors.qqNumber = '请输入QQ号';
    } else if (!/^\d{5,11}$/.test(formData.qqNumber.trim())) {
      newErrors.qqNumber = 'QQ号格式不正确';
    }

    // 验证手机号（如果提供）
    if (formData.phoneNumber.trim()) {
      const phoneRegex = /^1[3-9]\d{9}$/;
      if (!phoneRegex.test(formData.phoneNumber.trim())) {
        newErrors.phoneNumber = '手机号格式不正确';
      }
    }

    // 验证数量
    if (!formData.quantity || formData.quantity < 1) {
      newErrors.quantity = '预订数量必须大于0';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [formData]);

  /**
   * 重置表单
   */
  const resetForm = useCallback(() => {
    setFormData({
      collectionId: 0,
      qqNumber: '',
      phoneNumber: '',
      quantity: 1,
      notes: '',
    });
    setErrors({});
  }, []);

  return {
    formData,
    errors,
    updateField,
    validateForm,
    resetForm,
  };
} 
