'use client';

import React from 'react';
import { useAuthContext } from '../auth/react';
import { Shield, AlertTriangle } from 'lucide-react';

interface PermissionGuardProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

export const PermissionGuard: React.FC<PermissionGuardProps> = ({ children, fallback }) => {
  const { user, isAuthenticated } = useAuthContext();

  const hasPermission = () => {
    if (!isAuthenticated || !user) {
      return false;
    }
    return true;
  };

  if (!hasPermission()) {
    return (
      fallback ?? (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8 text-center">
            <div className="flex items-center justify-center mb-4">
              <Shield className="w-12 h-12 text-red-500" />
            </div>
            <h2 className="text-xl font-semibold text-gray-900 mb-2">需要登录</h2>
            <p className="text-gray-600 mb-4">请先登录以访问实验田功能。</p>
            <div className="flex items-center justify-center text-sm text-gray-500 mb-4">
              <AlertTriangle className="w-4 h-4 mr-1" />
              实验田对所有注册用户开放
            </div>
            <button
              onClick={() => window.history.back()}
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700"
            >
              返回上一页
            </button>
          </div>
        </div>
      )
    );
  }

  return <>{children}</>;
};

export default PermissionGuard;
