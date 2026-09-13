'use client';

import React, { useState } from 'react';
import type { IdeaItemFormData } from '../../../domain/types';

interface CreateIdeaItemModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: IdeaItemFormData) => void;
  loading?: boolean;
}

const priorityOptions = [
  { value: 'high', label: '高优先级', color: 'bg-red-100 text-red-800 border-red-200' },
  { value: 'medium', label: '中优先级', color: 'bg-yellow-100 text-yellow-800 border-yellow-200' },
  { value: 'low', label: '低优先级', color: 'bg-green-100 text-green-800 border-green-200' },
] as const;

export default function CreateIdeaItemModal({
  isOpen,
  onClose,
  onSubmit,
  loading = false,
}: CreateIdeaItemModalProps) {
  const [formData, setFormData] = useState<IdeaItemFormData>({
    title: '',
    description: '',
    priority: 'medium',
    tags: [],
  });

  const [errors, setErrors] = useState<{
    title?: string;
  }>({});

  const [tagInput, setTagInput] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // 验证表单
    const newErrors: { title?: string } = {};
    
    if (!formData.title.trim()) {
      newErrors.title = '想法标题不能为空';
    } else if (formData.title.trim().length > 200) {
      newErrors.title = '想法标题不能超过200个字符';
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    // 提交表单
    try {
      await onSubmit({
        title: formData.title.trim(),
        description: formData.description?.trim() || undefined,
        priority: formData.priority,
        tags: formData.tags,
      });
      
      // 重置表单
      setFormData({
        title: '',
        description: '',
        priority: 'medium',
        tags: [],
      });
      setErrors({});
      setTagInput('');
      onClose();
    } catch (error) {
      console.error('创建想法项目失败:', error);
    }
  };

  const handleClose = () => {
    if (loading) return;
    
    setFormData({
      title: '',
      description: '',
      priority: 'medium',
      tags: [],
    });
    setErrors({});
    setTagInput('');
    onClose();
  };

  const handleAddTag = () => {
    const tag = tagInput.trim();
    if (tag && !formData.tags.includes(tag)) {
      setFormData({
        ...formData,
        tags: [...formData.tags, tag],
      });
      setTagInput('');
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    setFormData({
      ...formData,
      tags: formData.tags.filter(tag => tag !== tagToRemove),
    });
  };

  const handleTagInputKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleAddTag();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-start sm:items-center justify-center z-50 p-4 sm:p-6">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md overflow-hidden">
        <div className="flex justify-between items-center p-4 sm:p-6 border-b">
          <h2 className="text-lg sm:text-xl font-semibold text-gray-900">添加新想法</h2>
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

        <div className="max-h-[calc(100vh-8rem)] sm:max-h-[calc(100vh-16rem)] overflow-y-auto">
          <form onSubmit={handleSubmit} className="p-4 sm:p-6 space-y-4">
            {/* 想法标题 */}
            <div>
              <label htmlFor="item-title" className="block text-sm font-medium text-gray-700 mb-1">
                想法标题 <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                id="item-title"
                value={formData.title}
                onChange={(e) => {
                  setFormData({ ...formData, title: e.target.value });
                  if (errors.title) {
                    setErrors({ ...errors, title: undefined });
                  }
                }}
                className={`block w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 sm:text-sm ${
                  errors.title ? 'border-red-300' : 'border-gray-300'
                }`}
                placeholder="例如：学习新技术、完成项目设计、阅读专业书籍"
                disabled={loading}
                autoFocus
              />
              {errors.title && (
                <p className="mt-1 text-sm text-red-600">{errors.title}</p>
              )}
            </div>

            {/* 想法描述 */}
            <div>
              <label htmlFor="item-description" className="block text-sm font-medium text-gray-700 mb-1">
                详细描述（可选）
              </label>
              <textarea
                id="item-description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                rows={3}
                placeholder="详细描述这个想法的内容、目标或计划"
                disabled={loading}
              />
            </div>

            {/* 优先级选择 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                优先级
              </label>
              <div className="flex flex-col sm:flex-row gap-2">
                {priorityOptions.map((option) => (
                  <label
                    key={option.value}
                    className="flex-1 flex items-center p-3 border rounded-md cursor-pointer hover:bg-gray-50 transition-colors"
                  >
                    <input
                      type="radio"
                      name="priority"
                      value={option.value}
                      checked={formData.priority === option.value}
                      onChange={(e) => setFormData({ ...formData, priority: e.target.value as any })}
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300"
                      disabled={loading}
                    />
                    <span className={`ml-3 px-3 py-1 rounded-full text-sm font-medium border ${option.color}`}>
                      {option.label}
                    </span>
                  </label>
                ))}
              </div>
            </div>

            {/* 标签输入 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                添加标签（可选）
              </label>
              <div className="space-y-3">
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={tagInput}
                    onChange={(e) => setTagInput(e.target.value)}
                    onKeyPress={handleTagInputKeyPress}
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                    placeholder="输入标签后按回车或点击添加"
                    disabled={loading}
                  />
                  <button
                    type="button"
                    onClick={handleAddTag}
                    disabled={loading || !tagInput.trim()}
                    className="px-4 py-2 text-sm font-medium text-black bg-white hover:bg-gray-50 border border-gray-300 hover:border-gray-400 rounded-md transition-colors disabled:opacity-50 shadow-sm whitespace-nowrap"
                  >
                    添加
                  </button>
                </div>

                {formData.tags.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {formData.tags.map((tag) => (
                      <span
                        key={tag}
                        className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800"
                      >
                        {tag}
                        <button
                          type="button"
                          onClick={() => handleRemoveTag(tag)}
                          disabled={loading}
                          className="ml-2 text-blue-600 hover:text-blue-800 focus:outline-none"
                        >
                          <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        </button>
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* 按钮组 */}
            <div className="flex justify-end space-x-3 pt-4 border-t mt-6">
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
                {loading ? '创建中...' : '创建想法'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
} 