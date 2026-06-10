'use client';

import React, { useEffect, useState } from 'react';
import { useAuthContext } from '../../context/AuthProvider';
import type { AuthGuardProps } from '../types';
import { LoginModal } from './LoginModal';
import { RegisterModal } from './RegisterModal';

export function AuthGuard({ children, fallback, requireAuth = true }: AuthGuardProps) {
  const { isAuthenticated, loading, refreshSession } = useAuthContext();
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [showRegisterModal, setShowRegisterModal] = useState(false);

  useEffect(() => {
    if (!loading && requireAuth && !isAuthenticated) {
      setShowLoginModal(true);
      setShowRegisterModal(false);
    }
  }, [loading, requireAuth, isAuthenticated]);

  const handleAuthSuccess = async () => {
    await refreshSession();
    setShowLoginModal(false);
    setShowRegisterModal(false);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[200px] text-gray-500 flex-col gap-3">
        <div className="w-8 h-8 border-[3px] border-gray-200 border-t-blue-500 rounded-full animate-spin" />
        <div>验证登录状态...</div>
      </div>
    );
  }

  if (requireAuth && !isAuthenticated) {
    return (
      <>
        {fallback ?? (
          <div className="flex items-center justify-center min-h-[200px] text-gray-500 flex-col gap-4 p-6 text-center">
            <div className="text-5xl opacity-50">🔒</div>
            <div className="text-lg font-medium">请先登录以访问此页面</div>
            <div className="text-sm opacity-70">登录或注册后即可查看相关内容</div>
            <div className="flex gap-3 mt-2">
              <button
                type="button"
                className="px-4 py-2 rounded-lg bg-blue-500 text-white text-sm font-medium hover:bg-blue-600 transition-colors"
                onClick={() => {
                  setShowRegisterModal(false);
                  setShowLoginModal(true);
                }}
              >
                登录
              </button>
              <button
                type="button"
                className="px-4 py-2 rounded-lg border border-gray-200 text-gray-700 text-sm font-medium hover:border-blue-300 hover:text-blue-600 transition-colors"
                onClick={() => {
                  setShowLoginModal(false);
                  setShowRegisterModal(true);
                }}
              >
                注册
              </button>
            </div>
          </div>
        )}
        <LoginModal
          isOpen={showLoginModal}
          onClose={() => setShowLoginModal(false)}
          onSuccess={handleAuthSuccess}
          onSwitchToRegister={() => {
            setShowLoginModal(false);
            setShowRegisterModal(true);
          }}
        />
        <RegisterModal
          isOpen={showRegisterModal}
          onClose={() => setShowRegisterModal(false)}
          onSuccess={handleAuthSuccess}
          onSwitchToLogin={() => {
            setShowRegisterModal(false);
            setShowLoginModal(true);
          }}
        />
      </>
    );
  }

  return <>{children}</>;
}
