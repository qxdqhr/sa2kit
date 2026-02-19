'use client';

import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import type { User, UseAuthReturn, LoginRequest, RegisterRequest } from '../types';

interface AuthContextType extends UseAuthReturn {}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const isMountedRef = useRef(true);

  // 安全的状态更新函数
  const safeSetState = useCallback((updater: () => void) => {
    if (isMountedRef.current) {
      updater();
    }
  }, []);

  // 验证会话
  const validateSession = useCallback(async () => {
    console.log('🔍 [AuthContext] 开始验证会话...');
    try {
      const response = await fetch('/api/auth/validate');
      console.log('📡 [AuthContext] 会话验证响应状态:', response.status);
      
      const data = await response.json();
      console.log('📄 [AuthContext] 会话验证响应数据:', data);
      
      safeSetState(() => {
        if (data.valid && data.user) {
          console.log('✅ [AuthContext] 会话验证成功, 用户:', data.user);
          setUser(data.user);
          setIsAuthenticated(true);
        } else {
          console.log('❌ [AuthContext] 会话验证失败:', data.message);
          setUser(null);
          setIsAuthenticated(false);
        }
        setLoading(false);
      });
    } catch (error) {
      console.error('💥 [AuthContext] 会话验证异常:', error);
      safeSetState(() => {
        setUser(null);
        setIsAuthenticated(false);
        setLoading(false);
      });
    }
  }, [safeSetState]);

  // 登录
  const login = useCallback(async (credentials: LoginRequest) => {
    console.log('🔑 [AuthContext] 开始登录...');
    console.log('📝 [AuthContext] 登录凭据:', { phone: credentials.phone, password: '***' });
    
    try {
      console.log('📤 [AuthContext] 发送登录请求到 /api/auth/login');
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(credentials),
      });

      console.log('📡 [AuthContext] 收到响应，状态码:', response.status);
      const data = await response.json();
      console.log('📄 [AuthContext] 响应数据:', data);

      if (data.success && data.user) {
        console.log('✅ [AuthContext] 登录成功, 开始更新全局状态');
        console.log('👤 [AuthContext] 用户数据:', data.user);
        
        // 记录当前状态
        console.log('📊 [AuthContext] 更新前状态:', {
          currentUser: user ? `${user.name || '未设置'} (${user.phone})` : null,
          currentIsAuthenticated: isAuthenticated,
          currentLoading: loading
        });
        
        // 使用同步的状态更新确保立即生效
        console.log('🔄 [AuthContext] 执行全局状态更新...');
        safeSetState(() => {
          console.log('🔄 [AuthContext] 正在设置用户:', data.user);
          setUser(data.user);
          console.log('🔄 [AuthContext] 正在设置认证状态: true');
          setIsAuthenticated(true);
          console.log('🔄 [AuthContext] 正在设置加载状态: false');
          setLoading(false);
          console.log('✅ [AuthContext] 全局状态更新完成');
        });
        
        // 等待下一个事件循环后输出确认日志
        setTimeout(() => {
          console.log('🎉 [AuthContext] 延迟确认 - 全局登录状态应该已更新:', {
            user: data.user,
            isAuthenticated: true
          });
        }, 0);
        
        console.log('🚀 [AuthContext] 返回成功结果');
        return { success: true, user: data.user };
      } else {
        console.log('❌ [AuthContext] 登录失败:', data.message);
        return { success: false, message: data.message };
      }
    } catch (error) {
      console.error('💥 [AuthContext] 登录异常:', error);
      return { success: false, message: '登录失败，请稍后重试' };
    }
  }, [safeSetState, user, isAuthenticated, loading]);

  // 注册
  const register = useCallback(async (userData: RegisterRequest) => {
    console.log('📝 [AuthContext] 开始注册...');
    try {
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(userData),
      });

      const data = await response.json();
      console.log('📡 [AuthContext] 注册响应:', data);

      if (data.success && data.user) {
        console.log('✅ [AuthContext] 注册成功, 立即更新全局状态');
        
        // 使用同步的状态更新确保立即生效
        safeSetState(() => {
          setUser(data.user);
          setIsAuthenticated(true);
          setLoading(false);
        });
        
        console.log('🚀 [AuthContext] 返回注册成功结果');
        return { success: true, user: data.user };
      } else {
        console.log('❌ [AuthContext] 注册失败:', data.message);
        return { success: false, message: data.message };
      }
    } catch (error) {
      console.error('💥 [AuthContext] 注册异常:', error);
      return { success: false, message: '注册失败，请稍后重试' };
    }
  }, [safeSetState]);

  // 登出
  const logout = useCallback(async () => {
    console.log('🚪 [AuthContext] 开始登出...');
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
      safeSetState(() => {
        setUser(null);
        setIsAuthenticated(false);
      });
      console.log('✅ [AuthContext] 登出成功, 全局状态已清除');
    } catch (error) {
      console.error('💥 [AuthContext] 登出失败:', error);
    }
  }, [safeSetState]);

  // 刷新用户信息
  const refreshUser = useCallback(() => {
    console.log('🔄 [AuthContext] 刷新用户信息...');
    setLoading(true);
    validateSession();
  }, [validateSession]);

  // 组件挂载/卸载管理
  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  // 初始化时验证会话
  useEffect(() => {
    console.log('🚀 [AuthContext] 初始化, 开始验证会话');
    validateSession();
  }, [validateSession]);

  // 状态变化监控（用于调试）
  useEffect(() => {
    console.log('📊 [AuthContext] 全局状态变化:', {
      isAuthenticated,
      user: user ? `${user.name || '未设置'} (${user.phone})` : null,
      loading
    });
  }, [isAuthenticated, user, loading]);

  const value: AuthContextType = {
    user,
    loading,
    isAuthenticated,
    login,
    register,
    logout,
    refreshUser,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): UseAuthReturn {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
} 