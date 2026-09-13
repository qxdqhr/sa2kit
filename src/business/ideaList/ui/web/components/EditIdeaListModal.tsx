'use client';

import React, { useState, useEffect } from 'react';
import type { IdeaList, IdeaListFormData, ColorTheme } from '../../../domain/types';

interface EditIdeaListModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: Partial<IdeaListFormData>) => void;
  onDelete?: () => void;
  ideaList: IdeaList | null;
  loading?: boolean;
}

const colorOptions: { value: ColorTheme; label: string; bgClass: string }[] = [
  { value: 'blue', label: '蓝色', bgClass: 'bg-blue-500' },
  { value: 'green', label: '绿色', bgClass: 'bg-green-500' },
  { value: 'purple', label: '紫色', bgClass: 'bg-purple-500' },
  { value: 'red', label: '红色', bgClass: 'bg-red-500' },
  { value: 'yellow', label: '黄色', bgClass: 'bg-yellow-500' },
  { value: 'pink', label: '粉色', bgClass: 'bg-pink-500' },
  { value: 'indigo', label: '靛蓝', bgClass: 'bg-indigo-500' },
  { value: 'gray', label: '灰色', bgClass: 'bg-gray-500' },
];

export default function EditIdeaListModal({
  isOpen,
  onClose,
  onSubmit,
  onDelete,
  ideaList,
  loading = false,
}: EditIdeaListModalProps) {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    color: 'blue' as ColorTheme,
  });

  const [errors, setErrors] = useState<{
    name?: string;
  }>({});

  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  // 当模态框打开且有清单数据时，初始化表单
  useEffect(() => {
    if (isOpen && ideaList) {
      setFormData({
        name: ideaList.name || '',
        description: ideaList.description || '',
        color: ideaList.color as ColorTheme || 'blue',
      });
      setErrors({});
      setShowDeleteConfirm(false);
    }
  }, [isOpen, ideaList]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // 验证表单
    const newErrors: { name?: string } = {};
    
    if (!formData.name.trim()) {
      newErrors.name = '清单名称不能为空';
    } else if (formData.name.trim().length > 100) {
      newErrors.name = '清单名称不能超过100个字符';
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    // 提交表单
    try {
      await onSubmit({
        name: formData.name.trim(),
        description: formData.description.trim() || undefined,
        color: formData.color,
      });
      
      onClose();
    } catch (error) {
      console.error('更新清单失败:', error);
    }
  };

  const handleDelete = async () => {
    if (onDelete) {
      try {
        await onDelete();
        setShowDeleteConfirm(false);
        onClose();
      } catch (error) {
        console.error('删除清单失败:', error);
      }
    }
  };

  const handleClose = () => {
    if (loading) return;
    
    setErrors({});
    setShowDeleteConfirm(false);
    onClose();
  };

  if (!isOpen || !ideaList) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center p-6 border-b">
          <h2 className="text-xl font-semibold text-gray-900">编辑想法清单</h2>
          <button
            onClick={handleClose}
            disabled={loading}
            className="text-gray-400 hover:text-gray-600 p-1 rounded-full hover:bg-gray-100 transition-colors"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {!showDeleteConfirm ? (
          <form onSubmit={handleSubmit} className="p-6 space-y-4">
            {/* 清单名称 */}
            <div>
              <label htmlFor="edit-name" className="block text-sm font-medium text-gray-700 mb-1">
                清单名称 <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                id="edit-name"
                value={formData.name}
                onChange={(e) => {
                  setFormData({ ...formData, name: e.target.value });
                  if (errors.name) {
                    setErrors({ ...errors, name: undefined });
                  }
                }}
                className={`block w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 sm:text-sm ${
                  errors.name ? 'border-red-300' : 'border-gray-300'
                }`}
                placeholder="例如：工作想法、生活计划、学习目标"
                disabled={loading}
                autoFocus
              />
              {errors.name && (
                <p className="mt-1 text-sm text-red-600">{errors.name}</p>
              )}
            </div>

            {/* 清单描述 */}
            <div>
              <label htmlFor="edit-description" className="block text-sm font-medium text-gray-700 mb-1">
                清单描述（可选）
              </label>
              <textarea
                id="edit-description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                rows={3}
                placeholder="描述这个清单的用途和目标"
                disabled={loading}
              />
            </div>

            {/* 颜色选择 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                选择颜色主题
              </label>
              <div className="grid grid-cols-4 gap-2">
                {colorOptions.map((option) => (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => setFormData({ ...formData, color: option.value })}
                    disabled={loading}
                    className={`flex items-center justify-center p-3 rounded-md border-2 transition-all ${
                      formData.color === option.value
                        ? 'border-gray-400 bg-gray-50'
                        : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                    }`}
                  >
                    <div className={`w-4 h-4 rounded-full ${option.bgClass} mr-2`} />
                    <span className="text-sm text-gray-700">{option.label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* 按钮组 */}
            <div className="flex justify-between pt-4">
              <div>
                {onDelete && (
                  <button
                    type="button"
                    onClick={() => setShowDeleteConfirm(true)}
                    disabled={loading}
                    className="px-4 py-2 text-sm font-medium text-black bg-white hover:bg-gray-50 border border-gray-300 hover:border-gray-400 rounded-md transition-colors disabled:opacity-50 shadow-sm"
                  >
                    删除清单
                  </button>
                )}
              </div>
              
              <div className="flex space-x-3">
                <button
                  type="button"
                  onClick={handleClose}
                  disabled={loading}
                  className="px-4 py-2 text-sm font-medium text-black bg-white hover:bg-gray-50 border border-gray-300 hover:border-gray-400 rounded-md transition-colors disabled:opacity-50 shadow-sm"
                >
                  取消
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-4 py-2 text-sm font-medium text-black bg-white hover:bg-gray-50 border border-gray-300 hover:border-gray-400 rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center shadow-sm"
                >
                  {loading && (
                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-black" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                  )}
                  {loading ? '保存中...' : '保存更改'}
                </button>
              </div>
            </div>
          </form>
        ) : (
          /* 删除确认界面 */
          <div className="p-6">
            <div className="flex items-center mb-4">
              <div className="mx-auto flex-shrink-0 flex items-center justify-center h-12 w-12 rounded-full bg-red-100">
                <svg className="h-6 w-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
                </svg>
              </div>
            </div>
            
            <div className="text-center">
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                确认删除清单
              </h3>
              <p className="text-sm text-gray-500 mb-6">
                你确定要删除「{ideaList.name}」吗？<br />
                这将同时删除清单中的所有想法项目，此操作无法撤销。
              </p>
            </div>

            <div className="flex justify-center space-x-3">
              <button
                type="button"
                onClick={() => setShowDeleteConfirm(false)}
                disabled={loading}
                className="px-4 py-2 text-sm font-medium text-black bg-white hover:bg-gray-50 border border-gray-300 hover:border-gray-400 rounded-md transition-colors disabled:opacity-50 shadow-sm"
              >
                取消
              </button>
              <button
                type="button"
                onClick={handleDelete}
                disabled={loading}
                className="px-4 py-2 text-sm font-medium text-black bg-white hover:bg-gray-50 border border-gray-300 hover:border-gray-400 rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center shadow-sm"
              >
                {loading && (
                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-black" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                )}
                {loading ? '删除中...' : '确认删除'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
} 