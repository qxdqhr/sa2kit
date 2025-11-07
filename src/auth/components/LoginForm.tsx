/**
 * Auth Components - LoginForm (Headless)
 * 无样式的登录表单组件
 */

import React, { useState } from 'react';
import { useAuth } from '../hooks';
import type { HeadlessLoginFormProps, LoginFormState } from './types';

/**
 * Headless 登录表单组件
 *
 * 提供登录逻辑但不包含任何 UI 样式，
 * 使用 render props 模式让用户完全控制 UI
 *
 * @example
 * ```tsx
 * <LoginForm apiClient={apiClient}>
 *   {({ email, password, loading, error, handleEmailChange, handlePasswordChange, handleSubmit }) => (
 *     <form onSubmit={handleSubmit}>
 *       <input
 *         value={email}
 *         onChange={(e) => handleEmailChange(e.target.value)}
 *       />
 *       <input
 *         type="password"
 *         value={password}
 *         onChange={(e) => handlePasswordChange(e.target.value)}
 *       />
 *       {error && <div>{error}</div>}
 *       <button disabled={loading}>
 *         {loading ? '登录中...' : '登录'}
 *       </button>
 *     </form>
 *   )}
 * </LoginForm>
 * ```
 */
export function LoginForm({ apiClient, onSuccess, onError, children }: HeadlessLoginFormProps) {
  const { login, loading, error: authError, clearError } = useAuth(apiClient);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleSubmit = async (e?: React.FormEvent) => {
    if (e) {
      e.preventDefault();
    }

    clearError();

    const result = await login(email, password);

    if (result.success) {
      // 登录成功后 user 会自动更新到 state
      const currentUser = apiClient.getUser();
      if (currentUser) {
        onSuccess?.(currentUser);
      }
    } else {
      onError?.(result.error || '登录失败');
    }
  };

  const state: LoginFormState = {
    email,
    password,
    loading,
    error: authError,
    handleEmailChange: setEmail,
    handlePasswordChange: setPassword,
    handleSubmit,
  };

  return <>{children(state)}</>;
}

