'use client';

import React, { useState } from 'react';
import { LogOut, LogIn, User } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import LoginModal from './LoginModal';
import RegisterModal from './RegisterModal';
import type { UserMenuProps } from '../types';

export default function UserMenu({ customMenuItems = [], className }: UserMenuProps) {
  const { user, isAuthenticated, logout } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [showRegisterModal, setShowRegisterModal] = useState(false);

  // 切换菜单显示
  const toggleMenu = () => {
    setIsOpen(!isOpen);
  };

  // 点击菜单外部时关闭菜单
  const handleMenuClick = (e: React.MouseEvent) => {
    e.stopPropagation();
  };

  // 处理自定义菜单项点击
  const handleCustomMenuClick = (item: any) => {
    console.log(`🔧 [UserMenu] 自定义菜单项被点击: ${item.label}`);
    item.onClick();
    setIsOpen(false);
  };

  // 处理登录
  const handleLogin = () => {
    console.log('🔑 [UserMenu] 登录按钮被点击');
    setShowLoginModal(true);
    setIsOpen(false);
  };

  // 处理注册
  const handleRegister = () => {
    console.log('📝 [UserMenu] 注册按钮被点击');
    setShowRegisterModal(true);
    setIsOpen(false);
  };

  // 处理退出登录
  const handleLogout = async () => {
    console.log('🚪 [UserMenu] 退出登录按钮被点击');
    try {
      await logout();
      console.log('✅ [UserMenu] 退出登录成功');
    } catch (error) {
      console.error('退出登录失败:', error);
    }
    setIsOpen(false);
  };

  // 登录成功后的处理
  const handleAuthSuccess = () => {
    console.log('🎉 [UserMenu] 认证成功回调被调用');
    console.log('👤 [UserMenu] 当前useAuth状态:', {
      user: user ? `${user.name || '未设置'} (${user.phone})` : null,
      isAuthenticated
    });
    
    // useAuth hook会自动更新状态，这里不需要手动处理
    setShowLoginModal(false);
    setShowRegisterModal(false);
    
    console.log('✅ [UserMenu] 认证成功处理完成 - 模态框已关闭');
    
    // 延迟检查状态
    setTimeout(() => {
      console.log('🔍 [UserMenu] 延迟状态检查:', {
        user: user ? `${user.name || '未设置'} (${user.phone})` : null,
        isAuthenticated
      });
    }, 500);
  };

  // 从登录切换到注册
  const handleSwitchToRegister = () => {
    console.log('🔄 [UserMenu] 从登录切换到注册');
    setShowLoginModal(false);
    setShowRegisterModal(true);
  };

  // 从注册切换到登录
  const handleSwitchToLogin = () => {
    console.log('🔄 [UserMenu] 从注册切换到登录');
    setShowRegisterModal(false);
    setShowLoginModal(true);
  };

  // 过滤自定义菜单项：根据登录状态和requireAuth属性
  const getVisibleCustomMenuItems = () => {
    return customMenuItems.filter(item => {
      // 如果设置了requireAuth为true，只有登录后才显示
      if (item.requireAuth === true) {
        return isAuthenticated;
      }
      // 如果设置了requireAuth为false，只有未登录才显示
      if (item.requireAuth === false) {
        return !isAuthenticated;
      }
      // 如果没有设置requireAuth，总是显示
      return true;
    });
  };

  // 全局点击处理（关闭菜单）
  React.useEffect(() => {
    const handleGlobalClick = () => {
      setIsOpen(false);
    };

    if (isOpen) {
      document.addEventListener('click', handleGlobalClick);
    }

    return () => {
      document.removeEventListener('click', handleGlobalClick);
    };
  }, [isOpen]);

  const visibleCustomMenuItems = getVisibleCustomMenuItems();

  return (
    <div className={`relative inline-block ${className || ''}`}>
      {/* 用户头像/图标 */}
      <button 
        className="flex items-center gap-2 px-3 py-2 bg-slate-50 text-slate-500 border border-slate-200 rounded-lg cursor-pointer transition-all min-w-11 min-h-11 text-sm font-medium hover:bg-slate-200 hover:text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/10"
        onClick={toggleMenu}
      >
        <User size={24} />
        {isAuthenticated && user && (
          <span className="max-w-[120px] overflow-hidden text-ellipsis whitespace-nowrap">
            {user.name || user.phone}
          </span>
        )}
      </button>

      {/* 下拉菜单 */}
      {isOpen && (
        <div 
          className="absolute top-[calc(100%+0.5rem)] right-0 z-[1000] min-w-[200px] bg-white border border-slate-200 rounded-xl shadow-lg max-h-[90vh] overflow-y-auto p-2 animate-in slide-in-from-top-2 fade-in duration-200"
          onClick={handleMenuClick}
        >
          {isAuthenticated && user ? (
            // 已登录状态的菜单
            <>
              <div className="p-3 mb-2 bg-slate-50 rounded-lg">
                <div className="text-sm font-semibold text-slate-800 mb-1 overflow-hidden text-ellipsis whitespace-nowrap">
                  {user.name || '未设置名称'}
                </div>
                <div className="text-xs text-slate-500 mb-1 overflow-hidden text-ellipsis whitespace-nowrap">
                  {user.phone}
                </div>
                <div className="text-xs text-blue-500 font-medium">
                  {user.role === 'admin' ? '管理员' : '普通用户'}
                </div>
              </div>
              
              {/* 自定义菜单项 */}
              {visibleCustomMenuItems.length > 0 && (
                <>
                  <div className="h-px bg-slate-200 my-2"></div>
                  {visibleCustomMenuItems.map((item) => {
                    const IconComponent = item.icon;
                    return (
                      <button 
                        key={item.id}
                        className="flex items-center gap-3 w-full p-3 bg-transparent border-none rounded-lg text-gray-700 text-sm font-medium cursor-pointer transition-all text-left min-h-11 hover:bg-slate-100 hover:text-slate-800 focus:outline-none focus:bg-slate-100 focus:ring-2 focus:ring-blue-500/10"
                        onClick={() => handleCustomMenuClick(item)}
                      >
                        {IconComponent && <IconComponent size={16} />}
                        <span>{item.label}</span>
                      </button>
                    );
                  })}
                </>
              )}
              
              <div className="h-px bg-slate-200 my-2"></div>
              
              <button 
                className="flex items-center gap-3 w-full p-3 bg-transparent border-none rounded-lg text-gray-700 text-sm font-medium cursor-pointer transition-all text-left min-h-11 hover:bg-red-50 hover:text-red-600 focus:outline-none focus:bg-red-50 focus:text-red-600 focus:ring-2 focus:ring-red-500/10"
                onClick={handleLogout}
              >
                <LogOut size={16} />
                <span>退出登录</span>
              </button>
            </>
          ) : (
            // 未登录状态的菜单
            <>
              <button 
                className="flex items-center gap-3 w-full p-3 bg-transparent border-none rounded-lg text-gray-700 text-sm font-medium cursor-pointer transition-all text-left min-h-11 hover:bg-slate-100 hover:text-slate-800 focus:outline-none focus:bg-slate-100 focus:ring-2 focus:ring-blue-500/10"
                onClick={handleLogin}
              >
                <LogIn size={16} />
                <span>登录</span>
              </button>
              <button 
                className="flex items-center gap-3 w-full p-3 bg-transparent border-none rounded-lg text-gray-700 text-sm font-medium cursor-pointer transition-all text-left min-h-11 hover:bg-slate-100 hover:text-slate-800 focus:outline-none focus:bg-slate-100 focus:ring-2 focus:ring-blue-500/10"
                onClick={handleRegister}
              >
                <User size={16} />
                <span>注册</span>
              </button>
              
              {/* 未登录状态的自定义菜单项 */}
              {visibleCustomMenuItems.length > 0 && (
                <>
                  <div className="h-px bg-slate-200 my-2"></div>
                  {visibleCustomMenuItems.map((item) => {
                    const IconComponent = item.icon;
                    return (
                      <button 
                        key={item.id}
                        className="flex items-center gap-3 w-full p-3 bg-transparent border-none rounded-lg text-gray-700 text-sm font-medium cursor-pointer transition-all text-left min-h-11 hover:bg-slate-100 hover:text-slate-800 focus:outline-none focus:bg-slate-100 focus:ring-2 focus:ring-blue-500/10"
                        onClick={() => handleCustomMenuClick(item)}
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

      {/* 登录模态框 */}
      <LoginModal
        isOpen={showLoginModal}
        onClose={() => setShowLoginModal(false)}
        onSuccess={handleAuthSuccess}
        onSwitchToRegister={handleSwitchToRegister}
      />

      {/* 注册模态框 */}
      <RegisterModal
        isOpen={showRegisterModal}
        onClose={() => setShowRegisterModal(false)}
        onSuccess={handleAuthSuccess}
        onSwitchToLogin={handleSwitchToLogin}
      />
    </div>
  );
}
