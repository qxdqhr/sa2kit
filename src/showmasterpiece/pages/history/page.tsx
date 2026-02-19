/**
 * ShowMasterpiece 模块 - 用户购物车历史记录页面
 * 
 * 用户输入QQ号和手机号查看自己的购物车历史记录
 * 
 * @fileoverview 用户历史记录页面
 */

'use client';

import React, { useState } from 'react';
import { CartHistoryPage } from '../../components';
import { User, Search, ArrowLeft } from 'lucide-react';
import Link from 'next/link';

/**
 * 用户历史记录页面组件
 * 
 * @returns React组件
 */
export default function UserHistoryPage() {
  const [formData, setFormData] = useState({
    qqNumber: '',
    phoneNumber: ''
  });
  const [formErrors, setFormErrors] = useState<{
    qqNumber?: string;
    phoneNumber?: string;
  }>({});
  const [isSubmitted, setIsSubmitted] = useState(false);

  /**
   * 处理表单字段更新
   */
  const handleFormChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    
    // 清除对应字段的错误
    if (formErrors[field as keyof typeof formErrors]) {
      setFormErrors(prev => ({ ...prev, [field]: undefined }));
    }
  };

  /**
   * 验证表单
   */
  const validateForm = (): boolean => {
    const errors: { qqNumber?: string; phoneNumber?: string } = {};

    if (!formData.qqNumber.trim()) {
      errors.qqNumber = '请输入QQ号';
    } else if (!/^\d{5,11}$/.test(formData.qqNumber.trim())) {
      errors.qqNumber = 'QQ号格式不正确';
    }

    if (!formData.phoneNumber.trim()) {
      errors.phoneNumber = '请输入手机号';
    } else {
      const phoneRegex = /^1[3-9]\d{9}$/;
      if (!phoneRegex.test(formData.phoneNumber.trim())) {
        errors.phoneNumber = '手机号格式不正确';
      }
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  /**
   * 处理表单提交
   */
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (validateForm()) {
      setIsSubmitted(true);
    }
  };

  /**
   * 返回查询页面
   */
  const handleBack = () => {
    setIsSubmitted(false);
    setFormData({ qqNumber: '', phoneNumber: '' });
    setFormErrors({});
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="max-w-6xl mx-auto p-4 sm:p-6">
        {/* 返回按钮 */}
        <div className="mb-6">
          <Link
            href="/testField/ShowMasterPieces"
            className="inline-flex items-center gap-2 text-slate-600 hover:text-slate-800 transition-colors"
          >
            <ArrowLeft size={20} />
            返回画集展示
          </Link>
        </div>

        {!isSubmitted ? (
          <div className="max-w-md mx-auto">
            {/* 页面标题 */}
            <div className="text-center mb-8">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-100 rounded-full mb-4">
                <User size={32} className="text-blue-600" />
              </div>
              <h1 className="text-2xl font-bold text-slate-800 mb-2">查看预订历史</h1>
              <p className="text-slate-600">
                请输入您的QQ号和手机号查看预订历史记录
              </p>
            </div>

            {/* 查询表单 */}
            <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-6">
              <form onSubmit={handleSubmit} className="space-y-4">
                {/* QQ号输入 */}
                <div>
                  <label htmlFor="qqNumber" className="block text-sm font-medium text-slate-700 mb-2">
                    QQ号
                  </label>
                  <input
                    type="text"
                    id="qqNumber"
                    value={formData.qqNumber}
                    onChange={(e) => handleFormChange('qqNumber', e.target.value)}
                    className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                      formErrors.qqNumber ? 'border-red-300' : 'border-slate-300'
                    }`}
                    placeholder="请输入QQ号"
                  />
                  {formErrors.qqNumber && (
                    <p className="mt-1 text-sm text-red-600">{formErrors.qqNumber}</p>
                  )}
                </div>

                {/* 手机号输入 */}
                <div>
                  <label htmlFor="phoneNumber" className="block text-sm font-medium text-slate-700 mb-2">
                    手机号
                  </label>
                  <input
                    type="tel"
                    id="phoneNumber"
                    value={formData.phoneNumber}
                    onChange={(e) => handleFormChange('phoneNumber', e.target.value)}
                    className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                      formErrors.phoneNumber ? 'border-red-300' : 'border-slate-300'
                    }`}
                    placeholder="请输入手机号"
                  />
                  {formErrors.phoneNumber && (
                    <p className="mt-1 text-sm text-red-600">{formErrors.phoneNumber}</p>
                  )}
                </div>

                {/* 提交按钮 */}
                <button
                  type="submit"
                  className="w-full flex items-center justify-center gap-2 bg-blue-600 text-white py-2 px-4 rounded-lg font-medium hover:bg-blue-700 transition-colors"
                >
                  <Search size={16} />
                  查询历史记录
                </button>
              </form>

              {/* 说明信息 */}
              <div className="mt-6 p-4 bg-blue-50 rounded-lg">
                <h3 className="text-sm font-medium text-blue-800 mb-2">查询说明</h3>
                <ul className="text-sm text-blue-700 space-y-1">
                  <li>• 请输入您预订时使用的QQ号和手机号</li>
                  <li>• 系统将显示您所有的预订历史记录</li>
                  <li>• 您可以查看预订状态、商品详情等信息</li>
                  <li>• 支持删除单条记录或清空所有记录</li>
                </ul>
              </div>
            </div>
          </div>
        ) : (
          <div>
            {/* 返回按钮 */}
            <div className="mb-6">
              <button
                onClick={handleBack}
                className="inline-flex items-center gap-2 text-slate-600 hover:text-slate-800 transition-colors"
              >
                <ArrowLeft size={20} />
                返回查询
              </button>
            </div>

            {/* 历史记录页面 */}
            <CartHistoryPage
              qqNumber={formData.qqNumber}
              phoneNumber={formData.phoneNumber}
            />
          </div>
        )}
      </div>
    </div>
  );
} 