/**
 * Admin Login Page Component
 * 完整的管理后台登录页面组件
 *
 * 功能：
 * - 邮箱密码登录
 * - 开发环境测试账户自动填充
 * - Analytics 埋点集成
 * - 角色权限检查
 * - 响应式设计
 */

import React, { useState, useEffect } from 'react';
import { clsx } from 'clsx';
import { useAuth } from '../hooks';
import type { BaseApiClient } from '../client/base-api-client';
import type { User } from '../types';

// ============================================================================
// Types
// ============================================================================

export interface AdminLoginPageProps {
  /**
   * API 客户端实例
   */
  apiClient: BaseApiClient;

  /**
   * 登录成功后的回调
   */
  onLoginSuccess?: (user: User) => void;

  /**
   * 登录失败的回调
   */
  onLoginError?: (error: string) => void;

  /**
   * 权限检查函数（可选）
   * 返回 true 表示有权限，false 表示无权限
   */
  checkPermission?: (user: User) => boolean;

  /**
   * 权限不足时的错误消息
   */
  permissionDeniedMessage?: string;

  /**
   * 开发环境配置
   */
  devConfig?: {
    /**
     * 是否启用开发模式功能（自动填充等）
     */
    enabled?: boolean;

    /**
     * 测试账户邮箱
     */
    testEmail?: string;

    /**
     * 测试账户密码
     */
    testPassword?: string;

    /**
     * 自动填充延迟（毫秒）
     */
    autoFillDelay?: number;
  };

  /**
   * 页面文本配置
   */
  texts?: {
    appName?: string;
    appDescription?: string;
    pageTitle?: string;
    pageSubtitle?: string;
    emailLabel?: string;
    emailPlaceholder?: string;
    passwordLabel?: string;
    passwordPlaceholder?: string;
    loginButton?: string;
    loggingInButton?: string;
    fillTestAccount?: string;
    copyCredentials?: string;
    devModeLabel?: string;
    testAccountInfo?: string;
    testAccountFilled?: string;
    footer?: string;
  };

  /**
   * Analytics 集成（可选）
   */
  analytics?: {
    /**
     * 页面访问埋点
     */
    trackPageView?: (data: Record<string, any>) => void;

    /**
     * 登录成功埋点
     */
    trackLoginSuccess?: (user: User) => void;

    /**
     * 登录失败埋点
     */
    trackLoginFailed?: (error: string, email: string) => void;

    /**
     * 权限拒绝埋点
     */
    trackPermissionDenied?: (user: User) => void;

    /**
     * 设置用户信息
     */
    setUser?: (user: { userId: string; email: string; role: string }) => void;
  };

  /**
   * UI 组件（可选，用于自定义样式）
   */
  components?: {
    Container?: React.ComponentType<{ children: React.ReactNode }>;
    Card?: React.ComponentType<{ children: React.ReactNode }>;
    Input?: React.ComponentType<any>;
    Button?: React.ComponentType<any>;
    Alert?: React.ComponentType<{ children: React.ReactNode }>;
    Badge?: React.ComponentType<{ children: React.ReactNode; variant?: string }>;
  };

  /**
   * className 配置（用于 Tailwind CSS）
   */
  classNames?: {
    container?: string;
    card?: string;
    header?: string;
    form?: string;
    input?: string;
    button?: string;
    alert?: string;
  };
}

// ============================================================================
// Default Components (Tailwind CSS based) - Modern & Beautiful Design
// ============================================================================

const DefaultContainer: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <div className="min-h-screen bg-gradient-to-br from-indigo-100 via-purple-50 to-pink-100 flex items-center justify-center px-4 py-12 relative overflow-hidden">
    {/* Animated background elements */}
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      <div
        className="absolute -top-40 -right-40 w-80 h-80 bg-purple-300 rounded-full mix-blend-multiply filter blur-xl opacity-70"
        style={{
          animation: 'blob 7s infinite',
        }}
      ></div>
      <div
        className="absolute -bottom-40 -left-40 w-80 h-80 bg-indigo-300 rounded-full mix-blend-multiply filter blur-xl opacity-70"
        style={{
          animation: 'blob 7s infinite',
          animationDelay: '2s',
        }}
      ></div>
      <div
        className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-80 h-80 bg-pink-300 rounded-full mix-blend-multiply filter blur-xl opacity-70"
        style={{
          animation: 'blob 7s infinite',
          animationDelay: '4s',
        }}
      ></div>
    </div>
    <div className="relative z-[10]">
      {children}
    </div>
    <style dangerouslySetInnerHTML={{__html: `
      @keyframes blob {
        0%, 100% { transform: translate(0, 0) scale(1); }
        25% { transform: translate(20px, -50px) scale(1.1); }
        50% { transform: translate(-20px, 20px) scale(0.9); }
        75% { transform: translate(50px, 50px) scale(1.05); }
      }
    `}} />
  </div>
);

const DefaultCard: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <div className="w-full max-w-md bg-white/95 backdrop-blur-xl rounded-2xl shadow-2xl border border-white/20 overflow-hidden">
    {children}
  </div>
);

const DefaultInput: React.FC<any> = (props) => (
  <input
    {...props}
    className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-200 placeholder-gray-400 text-gray-900 hover:border-gray-300"
  />
);

const DefaultButton: React.FC<any> = ({ children, disabled, type, ...props }) => (
  <button
    type={type || 'button'}
    disabled={disabled}
    {...props}
    className={clsx('w-full bg-gradient-to-r from-blue-50 to-indigo-50 border-2 border-dashed border-blue-300 text-blue-700 hover:from-blue-100 hover:to-indigo-100 hover:border-blue-400 px-4 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 transform hover:scale-105 active:scale-95', disabled ? 'opacity-60 cursor-not-allowed hover:scale-100 hover:shadow-none' : 'block', '}')}
    style={{
      backgroundSize: '200% 100%',
      backgroundPosition: disabled ? '0% 0%' : '0% 0%',
      display: 'block',
    }}
    onMouseEnter={(e) => {
      if (!disabled) {
        e.currentTarget.style.backgroundPosition = '100% 0%';
      }
    }}
    onMouseLeave={(e) => {
      if (!disabled) {
        e.currentTarget.style.backgroundPosition = '0% 0%';
      }
    }}
  >
    {children}
  </button>
);

const DefaultAlert: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <div className="bg-red-50 border-l-4 border-red-500 text-red-700 px-4 py-3 rounded-lg relative flex items-start space-x-3 shadow-sm">
    <svg className="w-5 h-5 text-red-500 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd"/>
    </svg>
    <div className="flex-1 text-sm">{children}</div>
  </div>
);

const DefaultBadge: React.FC<{ children: React.ReactNode; variant?: string; className?: string }> = ({
  children,
  variant,
  className = '',
}) => (
  <span
    className={clsx('inline-flex items-center px-3 py-1.5 rounded-full text-xs font-semibold shadow-sm', variant === 'dev'
        ? 'bg-gradient-to-r from-orange-400 to-amber-500 text-white border-0'
        : 'bg-gray-100 text-gray-700 border border-gray-200', className)}
  >
    {children}
  </span>
);

// ============================================================================
// Main Component
// ============================================================================

export function AdminLoginPage(props: AdminLoginPageProps) {
  const {
    apiClient,
    onLoginSuccess,
    onLoginError,
    checkPermission,
    permissionDeniedMessage = '访问被拒绝：需要管理员权限',
    devConfig,
    texts = {},
    analytics,
    components,
    classNames = {},
  } = props;

  // Use custom or default components
  const Container = components?.Container || DefaultContainer;
  const Card = components?.Card || DefaultCard;
  const Input = components?.Input || DefaultInput;
  const Button = components?.Button || DefaultButton;
  const Alert = components?.Alert || DefaultAlert;
  const Badge = components?.Badge || DefaultBadge;

  // Default texts
  const t = {
    appName: texts.appName || 'LyricNote',
    appDescription: texts.appDescription || '智能歌词管理平台',
    pageTitle: texts.pageTitle || '管理员登录',
    pageSubtitle: texts.pageSubtitle || '请使用管理员账户登录系统',
    emailLabel: texts.emailLabel || '管理员邮箱',
    emailPlaceholder: texts.emailPlaceholder || 'admin@example.com',
    passwordLabel: texts.passwordLabel || '密码',
    passwordPlaceholder: texts.passwordPlaceholder || '请输入密码',
    loginButton: texts.loginButton || '登录管理后台',
    loggingInButton: texts.loggingInButton || '登录中...',
    fillTestAccount: texts.fillTestAccount || '填充测试账户',
    copyCredentials: texts.copyCredentials || '复制',
    devModeLabel: texts.devModeLabel || '开发环境',
    testAccountInfo: texts.testAccountInfo || '测试账户已填充，可直接登录',
    testAccountFilled: texts.testAccountFilled || '已自动填充测试账户信息',
    footer: texts.footer || '仅限管理员访问 • 系统安全保护',
  };

  // State
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [autoFilled, setAutoFilled] = useState(false);
  const [localError, setLocalError] = useState('');

  // Check if development mode
  const isDevelopment =
    devConfig?.enabled ??
    (typeof window !== 'undefined' &&
      (process.env.NODE_ENV === 'development' ||
        window.location.hostname === 'localhost' ||
        window.location.hostname === '127.0.0.1'));

  // Test account config
  const testEmail = devConfig?.testEmail || 'admin@example.com';
  const testPassword = devConfig?.testPassword || 'admin123';
  const autoFillDelay = devConfig?.autoFillDelay || 2000;

  // Use auth hook
  const { user, isLoggedIn, loading, error: authError, login, clearError } = useAuth(apiClient as any);

  const error = authError || localError;

  // Track page view
  useEffect(() => {
    if (typeof window !== 'undefined' && analytics?.trackPageView) {
      analytics.trackPageView({
        pageName: 'admin_login_page',
        pageUrl: window.location.pathname,
      });
    }
  }, [analytics]);

  // Auto-fill test account in development
  useEffect(() => {
    if (isDevelopment && !email && !password) {
      const timer = setTimeout(() => {
        if (!email && !password) {
          setEmail(testEmail);
          setPassword(testPassword);
          setAutoFilled(true);
        }
      }, autoFillDelay);

      return () => clearTimeout(timer);
    }
    return; // Explicit return for all code paths
  }, [isDevelopment, email, password, testEmail, testPassword, autoFillDelay]);

  // Check permission after login
  useEffect(() => {
    if (user && isLoggedIn) {
      // Check permission if provided
      if (checkPermission && !checkPermission(user)) {
        setLocalError(permissionDeniedMessage);
        analytics?.trackPermissionDenied?.(user);
        return;
      }

      // Track login success
      analytics?.trackLoginSuccess?.(user);
      analytics?.setUser?.({
        userId: user.id,
        email: user.email,
        role: user.role,
      });

      // Call success callback
      onLoginSuccess?.(user);
    }
  }, [user, isLoggedIn, checkPermission, permissionDeniedMessage, analytics, onLoginSuccess]);

  // Handle login submit
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLocalError('');
    clearError();

    try {
      const result = await login(email, password);

      if (!result.success) {
        const errorMsg = result.error || '登录失败';
        setLocalError(errorMsg);
        analytics?.trackLoginFailed?.(errorMsg, email);
        onLoginError?.(errorMsg);
      }
    } catch (err) {
      const errorMsg = '登录失败：网络错误或服务器错误';
      setLocalError(errorMsg);
      analytics?.trackLoginFailed?.(errorMsg, email);
      onLoginError?.(errorMsg);
    }
  };

  // Fill test account
  const fillTestAccount = () => {
    setEmail(testEmail);
    setPassword(testPassword);
    setLocalError('');
    setAutoFilled(true);
  };

  // Copy test credentials
  const copyTestCredentials = async () => {
    const credentials = '邮箱: ' + (testEmail) + '\n密码: ' + (testPassword);
    try {
      await navigator.clipboard.writeText(credentials);
    } catch (err) {
      console.warn('复制失败，请手动复制');
    }
  };

  return (
    <Container>
      <div className="w-full max-w-md">
        {/* Login Form Card */}
        <Card>
          <div className="p-8">
            {/* Title */}
            <div className="pb-8">
              <h2 className="text-2xl font-bold text-center text-gray-800">{t.pageTitle}</h2>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">
              {/* Error Alert */}
              {error && <Alert>{error}</Alert>}

              {/* Email Input */}
              <div className="space-y-2">
                <label htmlFor="email" className="text-sm font-semibold text-gray-700 block">
                  {t.emailLabel}
                </label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setEmail(e.target.value)}
                  placeholder={t.emailPlaceholder}
                  required
                  disabled={loading}
                />
              </div>

              {/* Password Input */}
              <div className="space-y-2">
                <label htmlFor="password" className="text-sm font-semibold text-gray-700 block">
                  {t.passwordLabel}
                </label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                      setPassword(e.target.value)
                    }
                    placeholder={t.passwordPlaceholder}
                    required
                    disabled={loading}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors p-1"
                    disabled={loading}
                    title={showPassword ? '隐藏密码' : '显示密码'}
                  >
                    {showPassword ? (
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M3.707 2.293a1 1 0 00-1.414 1.414l14 14a1 1 0 001.414-1.414l-1.473-1.473A10.014 10.014 0 0019.542 10C18.268 5.943 14.478 3 10 3a9.958 9.958 0 00-4.512 1.074l-1.78-1.781zm4.261 4.26l1.514 1.515a2.003 2.003 0 012.45 2.45l1.514 1.514a4 4 0 00-5.478-5.478z" clipRule="evenodd" />
                        <path d="M12.454 16.697L9.75 13.992a4 4 0 01-3.742-3.741L2.335 6.578A9.98 9.98 0 00.458 10c1.274 4.057 5.065 7 9.542 7 .847 0 1.669-.105 2.454-.303z" />
                      </svg>
                    ) : (
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                        <path d="M10 12a2 2 0 100-4 2 2 0 000 4z" />
                        <path fillRule="evenodd" d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z" clipRule="evenodd" />
                      </svg>
                    )}
                  </button>
                </div>
              </div>

              {/* Dev Mode: Test Account Button */}
              {isDevelopment && (
                <div className="pt-2">
                  <button
                    type="button"
                    onClick={fillTestAccount}
                    className="w-full bg-gradient-to-r from-blue-50 to-indigo-50 border-2 border-dashed border-blue-300 text-blue-700 hover:from-blue-100 hover:to-indigo-100 hover:border-blue-400 px-4 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 transform hover:scale-105 active:scale-95"
                    disabled={loading}
                  >
                    {t.fillTestAccount}
                  </button>
                </div>
              )}

              {/* Submit Button */}
              <div className="pt-3">
                <Button type="submit" disabled={loading}>
                  {loading ? t.loggingInButton : t.loginButton}
                </Button>
              </div>
            </form>
          </div>
        </Card>
      </div>
    </Container>
  );
}

