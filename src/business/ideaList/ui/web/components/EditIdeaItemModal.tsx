'use client';

import React, { useState, useEffect } from 'react';
import type { IdeaItem, IdeaItemFormData } from '../../../domain/types';

interface EditIdeaItemModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: Partial<IdeaItemFormData>) => void;
  onDelete?: () => void;
  item: IdeaItem | null;
  loading?: boolean;
}

const priorityOptions = [
  { value: 'high', label: '高优先级', color: 'bg-red-100 text-red-800 border-red-200' },
  { value: 'medium', label: '中优先级', color: 'bg-yellow-100 text-yellow-800 border-yellow-200' },
  { value: 'low', label: '低优先级', color: 'bg-green-100 text-green-800 border-green-200' },
] as const;

export default function EditIdeaItemModal({
  isOpen,
  onClose,
  onSubmit,
  onDelete,
  item,
  loading = false,
}: EditIdeaItemModalProps) {
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
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  // 当模态框打开且有项目数据时，初始化表单
  useEffect(() => {
    if (isOpen && item) {
      setFormData({
        title: item.title || '',
        description: item.description || '',
        priority: (item.priority as 'high' | 'medium' | 'low') || 'medium',
        tags: item.tags || [],
      });
      setErrors({});
      setTagInput('');
      setShowDeleteConfirm(false);
    }
  }, [isOpen, item]);

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
      
      onClose();
    } catch (error) {
      console.error('更新想法项目失败:', error);
    }
  };

  const handleDelete = async () => {
    if (onDelete) {
      try {
        await onDelete();
        setShowDeleteConfirm(false);
        onClose();
      } catch (error) {
        console.error('删除想法项目失败:', error);
      }
    }
  };

  const handleClose = () => {
    if (loading) return;
    
    setErrors({});
    setTagInput('');
    setShowDeleteConfirm(false);
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

  if (!isOpen || !item) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center p-6 border-b">
          <h2 className="text-xl font-semibold text-gray-900">编辑想法</h2>
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
            {/* 想法标题 */}
            <div>
              <label htmlFor="edit-item-title" className="block text-sm font-medium text-gray-700 mb-1">
                想法标题 <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                id="edit-item-title"
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
              <label htmlFor="edit-item-description" className="block text-sm font-medium text-gray-700 mb-1">
                详细描述（可选）
              </label>
              <textarea
                id="edit-item-description"
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
              <div className="space-y-2">
                {priorityOptions.map((option) => (
                  <label
                    key={option.value}
                    className="flex items-center cursor-pointer"
                  >
                    <input
                      type="radio"
                      name="edit-priority"
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

            {/* 标签管理 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                标签
              </label>
              <div className="flex space-x-2 mb-2">
                <input
                  type="text"
                  value={tagInput}
                  onChange={(e) => setTagInput(e.target.value)}
                  onKeyPress={handleTagInputKeyPress}
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                  placeholder="输入标签名称"
                  disabled={loading}
                />
                <button
                  type="button"
                  onClick={handleAddTag}
                  disabled={loading || !tagInput.trim()}
                  className="px-3 py-2 text-sm font-medium text-black bg-white hover:bg-gray-50 border border-gray-300 hover:border-gray-400 rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
                >
                  添加
                </button>
              </div>
              
              {/* 显示已添加的标签 */}
              {formData.tags.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {formData.tags.map((tag, index) => (
                    <span
                      key={index}
                      className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-blue-100 text-blue-800"
                    >
                      {tag}
                      <button
                        type="button"
                        onClick={() => handleRemoveTag(tag)}
                        disabled={loading}
                        className="ml-2 h-4 w-4 text-blue-600 hover:text-blue-800 focus:outline-none"
                      >
                        <svg className="h-3 w-3" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                        </svg>
                      </button>
                    </span>
                  ))}
                </div>
              )}
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
                    删除想法
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
                确认删除想法
              </h3>
              <p className="text-sm text-gray-500 mb-6">
                你确定要删除「{item.title}」吗？<br />
                此操作无法撤销。
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