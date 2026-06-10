'use client';

import React, { useEffect, useState } from 'react';
import { LogOut, LogIn, User } from 'lucide-react';
import { useAuthContext } from '../../context/AuthProvider';
import type { UserMenuProps } from '../types';
import { LoginModal } from './LoginModal';
import { RegisterModal } from './RegisterModal';

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
    <div className={`relative inline-block ${className ?? ''}`}>
      <button
        type="button"
        className="flex items-center gap-2 px-3 py-2 bg-slate-50 text-slate-500 border border-slate-200 rounded-lg cursor-pointer transition-all min-w-11 min-h-11 text-sm font-medium hover:bg-slate-200 hover:text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/10"
        onClick={() => setIsOpen((v) => !v)}
      >
        <User size={24} />
        {isAuthenticated && user && (
          <span className="max-w-[120px] overflow-hidden text-ellipsis whitespace-nowrap">{displayName}</span>
        )}
      </button>

      {isOpen && (
        <div
          className="absolute top-[calc(100%+0.5rem)] right-0 z-[1000] min-w-[200px] bg-white border border-slate-200 rounded-xl shadow-lg max-h-[90vh] overflow-y-auto p-2"
          onClick={(e) => e.stopPropagation()}
        >
          {isAuthenticated && user ? (
            <>
              <div className="p-3 mb-2 bg-slate-50 rounded-lg">
                <div className="text-sm font-semibold text-slate-800 mb-1 overflow-hidden text-ellipsis whitespace-nowrap">
                  {user.name || '未设置名称'}
                </div>
                <div className="text-xs text-slate-500 mb-1 overflow-hidden text-ellipsis whitespace-nowrap">
                  {user.phoneNumber || user.email}
                </div>
                {user.role && (
                  <div className="text-xs text-blue-500 font-medium">{user.role === 'admin' ? '管理员' : '普通用户'}</div>
                )}
              </div>

              {visibleCustomMenuItems.length > 0 && (
                <>
                  <div className="h-px bg-slate-200 my-2" />
                  {visibleCustomMenuItems.map((item) => {
                    const IconComponent = item.icon;
                    return (
                      <button
                        key={item.id}
                        type="button"
                        className="flex items-center gap-3 w-full p-3 bg-transparent border-none rounded-lg text-gray-700 text-sm font-medium cursor-pointer transition-all text-left min-h-11 hover:bg-slate-100 hover:text-slate-800"
                        onClick={() => {
                          item.onClick();
                          setIsOpen(false);
                        }}
                      >
                        {IconComponent && <IconComponent size={16} />}
                        <span>{item.label}</span>
                      </button>
                    );
                  })}
                </>
              )}

              <div className="h-px bg-slate-200 my-2" />
              <button
                type="button"
                className="flex items-center gap-3 w-full p-3 bg-transparent border-none rounded-lg text-gray-700 text-sm font-medium cursor-pointer transition-all text-left min-h-11 hover:bg-red-50 hover:text-red-600"
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
                className="flex items-center gap-3 w-full p-3 bg-transparent border-none rounded-lg text-gray-700 text-sm font-medium cursor-pointer transition-all text-left min-h-11 hover:bg-slate-100 hover:text-slate-800"
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
                className="flex items-center gap-3 w-full p-3 bg-transparent border-none rounded-lg text-gray-700 text-sm font-medium cursor-pointer transition-all text-left min-h-11 hover:bg-slate-100 hover:text-slate-800"
                onClick={() => {
                  setShowRegisterModal(true);
                  setIsOpen(false);
                }}
              >
                <User size={16} />
                <span>注册</span>
              </button>

              {visibleCustomMenuItems.length > 0 && (
                <>
                  <div className="h-px bg-slate-200 my-2" />
                  {visibleCustomMenuItems.map((item) => {
                    const IconComponent = item.icon;
                    return (
                      <button
                        key={item.id}
                        type="button"
                        className="flex items-center gap-3 w-full p-3 bg-transparent border-none rounded-lg text-gray-700 text-sm font-medium cursor-pointer transition-all text-left min-h-11 hover:bg-slate-100 hover:text-slate-800"
                        onClick={() => {
                          item.onClick();
                          setIsOpen(false);
                        }}
                      >
                        {IconComponent && <IconComponent size={16} />}
                        <span>{item.label}</span>
                      </button>
                    );
                  })}
                </>
              )}
            </>
          )}
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
    </div>
  );
}
