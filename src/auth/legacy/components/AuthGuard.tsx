'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import LoginModal from './LoginModal';
import type { AuthGuardProps } from '../types';

/**
 * 认证守卫组件
 * 保护需要登录的页面和组件
 */
export default function AuthGuard({ 
  children, 
  fallback,
  requireAuth = true 
}: AuthGuardProps) {
  const { isAuthenticated, loading, refreshUser } = useAuth();
  const [showLoginModal, setShowLoginModal] = useState(false);

  useEffect(() => {
    if (!loading && requireAuth && !isAuthenticated) {
      setShowLoginModal(true);
    }
  }, [loading, requireAuth, isAuthenticated]);

  // 登录成功后的处理
  const handleLoginSuccess = () => {
    refreshUser();
    setShowLoginModal(false);
  };

  // 如果正在加载，显示加载状态
  if (loading) {
    return (
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '200px',
        color: '#6b7280',
        flexDirection: 'column',
        gap: '12px'
      }}>
        <div style={{
          width: '32px',
          height: '32px',
          border: '3px solid #e5e7eb',
          borderTop: '3px solid #3b82f6',
          borderRadius: '50%',
          animation: 'spin 1s linear infinite'
        }}></div>
        <div>验证登录状态...</div>
      </div>
    );
  }

  // 如果需要认证但未登录，显示登录模态框
  if (requireAuth && !isAuthenticated) {
    return (
      <>
        {fallback || (
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            minHeight: '200px',
            color: '#6b7280',
            flexDirection: 'column',
            gap: '16px',
            padding: '24px',
            textAlign: 'center'
          }}>
            <div style={{
              fontSize: '48px',
              opacity: 0.5
            }}>
              🔒
            </div>
            <div style={{
              fontSize: '18px',
              fontWeight: '500'
            }}>
              请先登录以访问此页面
            </div>
            <div style={{
              fontSize: '14px',
              opacity: 0.7
            }}>
              登录后即可查看相关内容
            </div>
          </div>
        )}
        <LoginModal
          isOpen={showLoginModal}
          onClose={() => setShowLoginModal(false)}
          onSuccess={handleLoginSuccess}
        />
      </>
    );
  }

  // 已认证或不需要认证，显示子组件
  return <>{children}</>;
} 