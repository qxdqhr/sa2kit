/**
 * ShowMasterpiece模块 - 删除确认对话框组件
 * 
 * 从全局configManager复制并适配
 */

'use client';

import React from 'react';
import { AlertTriangle, Loader } from 'lucide-react';

interface ConfigItem {
  id: string;
  key: string;
  displayName: string;
  description: string;
  value: string;
  defaultValue: string;
  type: 'string' | 'number' | 'boolean' | 'password';
  isRequired: boolean;
  isSensitive: boolean;
  validation: string | null;
  sortOrder: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

interface DeleteConfirmDialogProps {
  isOpen: boolean;
  item: ConfigItem | null;
  onConfirm: () => void;
  onCancel: () => void;
  loading?: boolean;
}

export const DeleteConfirmDialog: React.FC<DeleteConfirmDialogProps> = ({
  isOpen,
  item,
  onConfirm,
  onCancel,
  loading = false
}) => {
  if (!isOpen || !item) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      {/* 背景遮罩 */}
      <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
        <div 
          className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity"
          onClick={onCancel}
        ></div>

        {/* 对话框 */}
        <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
          <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
            <div className="sm:flex sm:items-start">
              <div className="mx-auto flex-shrink-0 flex items-center justify-center h-12 w-12 rounded-full bg-red-100 sm:mx-0 sm:h-10 sm:w-10">
                <AlertTriangle className="h-6 w-6 text-red-600" />
              </div>
              <div className="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left">
                <h3 className="text-lg leading-6 font-medium text-gray-900">
                  删除配置项
                </h3>
                <div className="mt-2">
                  <p className="text-sm text-gray-500">
                    确定要删除这个配置项吗？此操作不可撤销。
                  </p>
                  <p className="mt-2 text-sm font-medium text-gray-900">
                    <span className="font-mono bg-gray-100 px-2 py-1 rounded">
                      {item.displayName} ({item.key})
                    </span>
                  </p>
                </div>
              </div>
            </div>
          </div>
          <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
            <button
              type="button"
              onClick={onConfirm}
              disabled={loading}
              className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-red-600 text-base font-medium text-white hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 sm:ml-3 sm:w-auto sm:text-sm disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <>
                  <Loader className="w-4 h-4 mr-2 animate-spin" />
                  删除中...
                </>
              ) : (
                '删除'
              )}
            </button>
            <button
              type="button"
              onClick={onCancel}
              disabled={loading}
              className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm disabled:opacity-50 disabled:cursor-not-allowed"
            >
              取消
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
