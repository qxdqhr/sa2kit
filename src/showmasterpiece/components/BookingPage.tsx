/**
 * ShowMasterpiece 模块 - 预订页面组件
 * 
 * 完整的预订页面，包含：
 * - 画集列表展示和选择
 * - 预订表单（QQ号、数量、备注）
 * - 提交和状态管理
 * 
 * @fileoverview 预订页面组件
 */

'use client';

import React, { useState } from 'react';
import { CollectionList } from './CollectionList';
import { useBooking, useBookingForm } from '../hooks';
import { CollectionSummary } from '../types/booking';

/**
 * 预订页面组件属性
 */
interface BookingPageProps {
  /** 关闭回调 */
  onClose?: () => void;
}

/**
 * 预订页面组件
 * 
 * @param props 组件属性
 * @returns React组件
 */
export const BookingPage: React.FC<BookingPageProps> = ({ onClose }) => {
  // 使用自定义Hook
  const {
    collections,
    loading,
    error,
    submitting,
    submitted,
    submitBooking,
    resetSubmission,
    clearError,
  } = useBooking();

  const {
    formData,
    errors,
    updateField,
    validateForm,
    resetForm,
  } = useBookingForm();

  // 本地状态
  const [step, setStep] = useState<'select' | 'form'>('select');

  /**
   * 处理画集选择
   * 
   * @param collectionId 画集ID
   */
  const handleCollectionSelect = (collectionId: number) => {
    updateField('collectionId', collectionId);
    setStep('form');
  };

  /**
   * 处理表单提交
   */
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    await submitBooking(formData);
  };

  /**
   * 处理重新预订
   */
  const handleNewBooking = () => {
    resetForm();
    resetSubmission();
    setStep('select');
  };

  /**
   * 处理返回选择
   */
  const handleBackToSelect = () => {
    setStep('select');
    clearError();
  };

  /**
   * 获取选中的画集信息
   */
  const selectedCollection = collections.find(c => c.id === formData.collectionId);

  /**
   * 成功状态渲染
   */
  if (submitted) {
    return (
      <div className="max-w-2xl mx-auto p-6">
        <div className="text-center">
          <div className="text-green-500 text-6xl mb-4">✅</div>
          <h2 className="text-2xl font-bold text-gray-900 mb-4">预订提交成功！</h2>
          <p className="text-gray-600 mb-6">
            您的预订已成功提交，我们会尽快与您联系确认。
          </p>
          <div className="space-y-3">
            <button
              onClick={handleNewBooking}
              className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors"
            >
              继续预订其他画集
            </button>
            {onClose && (
              <button
                onClick={onClose}
                className="w-full bg-gray-200 text-gray-800 py-2 px-4 rounded-lg hover:bg-gray-300 transition-colors"
              >
                关闭
              </button>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-6">
      {/* 页面标题 */}
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">预订画集</h1>
        <p className="text-gray-600">选择您喜欢的画集并填写预订信息</p>
      </div>

      {/* 错误提示 */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
          <div className="flex">
            <div className="text-red-400 mr-3">
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
            </div>
            <div>
              <h3 className="text-sm font-medium text-red-800">提交失败</h3>
              <p className="text-sm text-red-700 mt-1">{error}</p>
            </div>
          </div>
        </div>
      )}

      {/* 步骤指示器 */}
      <div className="flex items-center justify-center mb-8">
        <div className="flex items-center">
          <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
            step === 'select' ? 'bg-blue-600 text-white' : 'bg-green-500 text-white'
          }`}>
            {step === 'select' ? '1' : '✓'}
          </div>
          <div className={`ml-2 ${step === 'select' ? 'text-blue-600' : 'text-green-600'}`}>
            选择画集
          </div>
        </div>
        <div className="w-16 h-0.5 bg-gray-300 mx-4"></div>
        <div className="flex items-center">
          <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
            step === 'form' ? 'bg-blue-600 text-white' : 'bg-gray-300 text-gray-600'
          }`}>
            2
          </div>
          <div className={`ml-2 ${step === 'form' ? 'text-blue-600' : 'text-gray-500'}`}>
            填写信息
          </div>
        </div>
      </div>

      {/* 画集选择步骤 */}
      {step === 'select' && (
        <div>
          <div className="mb-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-2">选择要预订的画集</h2>
            <p className="text-gray-600">点击下方画集卡片进行选择</p>
          </div>
          <CollectionList
            collections={collections}
            loading={loading}
            onSelectCollection={handleCollectionSelect}
          />
        </div>
      )}

      {/* 预订表单步骤 */}
      {step === 'form' && selectedCollection && (
        <div className="max-w-2xl mx-auto">
          <div className="mb-6">
            <button
              onClick={handleBackToSelect}
              className="text-blue-600 hover:text-blue-800 flex items-center mb-4"
            >
              <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              返回选择画集
            </button>
            
            <h2 className="text-xl font-semibold text-gray-900 mb-4">填写预订信息</h2>
            
            {/* 选中的画集信息 */}
            <div className="bg-gray-50 rounded-lg p-4 mb-6">
              <div className="flex items-center">
                {selectedCollection.coverImage ? (
                  <img
                    src={selectedCollection.coverImage}
                    alt={selectedCollection.title}
                    className="w-16 h-16 object-cover rounded-md mr-4"
                  />
                ) : (
                  <div className="w-16 h-16 bg-gray-100 rounded-md mr-4 flex items-center justify-center text-gray-400 text-xs">
                    暂无图片
                  </div>
                )}
                <div>
                  <h3 className="font-semibold text-gray-900">{selectedCollection.title}</h3>
                  <p className="text-sm text-gray-600">编号：{selectedCollection.number}</p>
                  <p className="text-sm text-gray-600">
                    价格：{selectedCollection.price ? `¥${selectedCollection.price}` : '价格待定'}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* 预订表单 */}
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* QQ号输入 */}
            <div>
              <label htmlFor="qqNumber" className="block text-sm font-medium text-gray-700 mb-2">
                QQ号 <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                id="qqNumber"
                value={formData.qqNumber}
                onChange={(e) => updateField('qqNumber', e.target.value)}
                className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  errors.qqNumber ? 'border-red-300' : 'border-gray-300'
                }`}
                placeholder="请输入您的QQ号"
                disabled={submitting}
              />
              {errors.qqNumber && (
                <p className="mt-1 text-sm text-red-600">{errors.qqNumber}</p>
              )}
            </div>

            {/* 手机号输入 */}
            <div>
              <label htmlFor="phoneNumber" className="block text-sm font-medium text-gray-700 mb-2">
                手机号
              </label>
              <input
                type="tel"
                id="phoneNumber"
                value={formData.phoneNumber}
                onChange={(e) => updateField('phoneNumber', e.target.value)}
                className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  errors.phoneNumber ? 'border-red-300' : 'border-gray-300'
                }`}
                placeholder="请输入您的手机号（可选）"
                disabled={submitting}
              />
              {errors.phoneNumber && (
                <p className="mt-1 text-sm text-red-600">{errors.phoneNumber}</p>
              )}
            </div>

            {/* 预订数量 */}
            <div>
              <label htmlFor="quantity" className="block text-sm font-medium text-gray-700 mb-2">
                预订数量 <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                id="quantity"
                min="1"
                value={formData.quantity}
                onChange={(e) => updateField('quantity', parseInt(e.target.value) || 1)}
                className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  errors.quantity ? 'border-red-300' : 'border-gray-300'
                }`}
                placeholder="请输入预订数量"
                disabled={submitting}
              />
              {errors.quantity && (
                <p className="mt-1 text-sm text-red-600">{errors.quantity}</p>
              )}
            </div>

            {/* 备注信息 */}
            <div>
              <label htmlFor="notes" className="block text-sm font-medium text-gray-700 mb-2">
                备注信息
              </label>
              <textarea
                id="notes"
                value={formData.notes}
                onChange={(e) => updateField('notes', e.target.value)}
                rows={4}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="请输入备注信息（可选）"
                disabled={submitting}
              />
            </div>

            {/* 提交按钮 */}
            <div className="pt-4">
              <button
                type="submit"
                disabled={submitting}
                className={`w-full py-3 px-4 rounded-lg font-medium transition-colors ${
                  submitting
                    ? 'bg-gray-400 text-gray-600 cursor-not-allowed'
                    : 'bg-blue-600 text-white hover:bg-blue-700'
                }`}
              >
                {submitting ? '提交中...' : '提交预订'}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}; 
