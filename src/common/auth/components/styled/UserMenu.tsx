'use client';

import React, { useEffect, useState } from 'react';
import { LogOut, LogIn, User } from 'lucide-react';
import { useAuthContext } from '../../context/AuthProvider';
import type { UserMenuProps } from '../types';
import { LoginModal } from './LoginModal';
import { RegisterModal } from './RegisterModal';
import { Button } from '../../../ui/admin/Button';
import { cn } from '../../../utils';

export function UserMenu({ customMenuItems = [], className }: UserMenuProps) {
  const { user, isAuthenticated, signOut, refreshSession } = useAuthContext();
  const [isOpen, setIsOpen] = useState(false);
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [showRegisterModal, setShowRegisterModal] = useState(false);

  useEffect(() => {
    const handleGlobalClick = () => setIsOpen(false);
    if (isOpen) document.addEventListener('click', handleGlobalClick);
    return () => document.removeEventListener('click', handleGlobalClick);
  }, [isOpen]);

  const visibleCustomMenuItems = customMenuItems.filter((item) => {
    if (item.requireAuth === true) return isAuthenticated;
    if (item.requireAuth === false) return !isAuthenticated;
    return true;
  });

  const handleAuthSuccess = async () => {
    await refreshSession();
    setShowLoginModal(false);
    setShowRegisterModal(false);
  };

  const displayName = user?.name || user?.phoneNumber || user?.email || '用户';

  return (
    <div className={cn('relative inline-block', className)}>
      <Button
        type="default"
        size="small"
        className="gap-2"
        onClick={() => setIsOpen((v) => !v)}
      >
        <User size={18} />
        {isAuthenticated && user ? (
          <span className="max-w-[120px] overflow-hidden text-ellipsis whitespace-nowrap">
            {displayName}
          </span>
        ) : null}
      </Button>

      {isOpen ? (
        <div
          className="absolute right-0 top-[calc(100%+0.5rem)] z-[1000] max-h-[90vh] min-w-[200px] overflow-y-auto rounded-[18px] border-2 border-[var(--sa2-border-light,#e8e2d6)] bg-[var(--sa2-bg-panel,#fff)] p-2 shadow-lg"
          onClick={(e) => e.stopPropagation()}
        >
          {isAuthenticated && user ? (
            <>
              <div className="mb-2 rounded-[12px] bg-[var(--sa2-bg-secondary,#f0e8d8)] p-3">
                <div className="mb-1 overflow-hidden text-ellipsis whitespace-nowrap text-sm font-semibold text-[var(--sa2-text,#794f27)]">
                  {user.name || '未设置名称'}
                </div>
                <div className="mb-1 overflow-hidden text-ellipsis whitespace-nowrap text-xs text-[var(--sa2-text-secondary,#9f927d)]">
                  {user.phoneNumber || user.email}
                </div>
                {user.role ? (
                  <div className="text-xs font-medium text-[var(--sa2-primary,#19c8b9)]">
                    {user.role === 'admin' ? '管理员' : '普通用户'}
                  </div>
                ) : null}
              </div>

              {visibleCustomMenuItems.length > 0 ? (
                <>
                  <div className="my-2 h-px bg-[var(--sa2-border-light,#e8e2d6)]" />
                  {visibleCustomMenuItems.map((item) => {
                    const IconComponent = item.icon;
                    return (
                      <button
                        key={item.id}
                        type="button"
                        className="flex min-h-11 w-full cursor-pointer items-center gap-3 rounded-[12px] border-none bg-transparent p-3 text-left text-sm font-medium text-[var(--sa2-text,#794f27)] transition-all hover:bg-[var(--sa2-primary-bg,#e6f9f6)]"
                        onClick={() => {
                          item.onClick();
                          setIsOpen(false);
                        }}
                      >
                        {IconComponent ? <IconComponent size={16} /> : null}
                        <span>{item.label}</span>
                      </button>
                    );
                  })}
                </>
              ) : null}

              <div className="my-2 h-px bg-[var(--sa2-border-light,#e8e2d6)]" />
              <button
                type="button"
                className="flex min-h-11 w-full cursor-pointer items-center gap-3 rounded-[12px] border-none bg-transparent p-3 text-left text-sm font-medium text-[var(--sa2-text,#794f27)] transition-all hover:bg-[var(--sa2-error,#e05a5a)]/10 hover:text-[var(--sa2-error,#e05a5a)]"
                onClick={async () => {
                  await signOut();
                  setIsOpen(false);
                }}
              >
                <LogOut size={16} />
                <span>退出登录</span>
              </button>
            </>
          ) : (
            <>
              <button
                type="button"
                className="flex min-h-11 w-full cursor-pointer items-center gap-3 rounded-[12px] border-none bg-transparent p-3 text-left text-sm font-medium text-[var(--sa2-text,#794f27)] transition-all hover:bg-[var(--sa2-primary-bg,#e6f9f6)]"
                onClick={() => {
                  setShowLoginModal(true);
                  setIsOpen(false);
                }}
              >
                <LogIn size={16} />
                <span>登录</span>
              </button>
              <button
                type="button"
                className="flex min-h-11 w-full cursor-pointer items-center gap-3 rounded-[12px] border-none bg-transparent p-3 text-left text-sm font-medium text-[var(--sa2-text,#794f27)] transition-all hover:bg-[var(--sa2-primary-bg,#e6f9f6)]"
                onClick={() => {
                  setShowRegisterModal(true);
                  setIsOpen(false);
                }}
              >
                <User size={16} />
                <span>注册</span>
              </button>

              {visibleCustomMenuItems.length > 0 ? (
                <>
                  <div className="my-2 h-px bg-[var(--sa2-border-light,#e8e2d6)]" />
                  {visibleCustomMenuItems.map((item) => {
                    const IconComponent = item.icon;
                    return (
                      <button
                        key={item.id}
                        type="button"
                        className="flex min-h-11 w-full cursor-pointer items-center gap-3 rounded-[12px] border-none bg-transparent p-3 text-left text-sm font-medium text-[var(--sa2-text,#794f27)] transition-all hover:bg-[var(--sa2-primary-bg,#e6f9f6)]"
                        onClick={() => {
                          item.onClick();
                          setIsOpen(false);
                        }}
                      >
                        {IconComponent ? <IconComponent size={16} /> : null}
                        <span>{item.label}</span>
                      </button>
                    );
                  })}
                </>
              ) : null}
            </>
          )}
        </div>
      ) : null}

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
    </div>
  );
}
