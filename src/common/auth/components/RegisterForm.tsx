/**
 * Auth Components - RegisterForm (Headless)
 * 无样式的注册表单组件
 */

import React, { useState } from 'react';
import { useAuth } from '../hooks';
import type { HeadlessRegisterFormProps, RegisterFormState } from './types';

/**
 * Headless 注册表单组件
 *
 * 提供注册逻辑但不包含任何 UI 样式，
 * 使用 render props 模式让用户完全控制 UI
 *
 * @example
 * ```tsx
 * <RegisterForm apiClient={apiClient}>
 *   {({ email, password, username, loading, error, handleEmailChange, handlePasswordChange, handleUsernameChange, handleSubmit }) => (
 *     <form onSubmit={handleSubmit}>
 *       <input
 *         value={email}
 *         onChange={(e) => handleEmailChange(e.target.value)}
 *       />
 *       <input
 *         value={username}
 *         onChange={(e) => handleUsernameChange(e.target.value)}
 *       />
 *       <input
 *         type="password"
 *         value={password}
 *         onChange={(e) => handlePasswordChange(e.target.value)}
 *       />
 *       {error && <div>{error}</div>}
 *       <button disabled={loading}>
 *         {loading ? '注册中...' : '注册'}
 *       </button>
 *     </form>
 *   )}
 * </RegisterForm>
 * ```
 */
export function RegisterForm({
  apiClient,
  onSuccess,
  onError,
  children,
}: HeadlessRegisterFormProps) {
  const { register, loading, error: authError, clearError } = useAuth(apiClient);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [username, setUsername] = useState('');

  const handleSubmit = async (e?: React.FormEvent) => {
    if (e) {
      e.preventDefault();
    }

    clearError();

    // 基础验证
    if (!email || !password || !username) {
      const errorMsg = '请填写所有字段';
      onError?.(errorMsg);
      return;
    }

    if (password.length < 6) {
      const errorMsg = '密码长度至少为 6 位';
      onError?.(errorMsg);
      return;
    }

    const result = await register(email, password, username);

    if (result.success) {
      // 注册成功后 user 会自动更新到 state
      const currentUser = apiClient.getUser();
      if (currentUser) {
        onSuccess?.(currentUser);
      }
    } else {
      onError?.(result.error || '注册失败');
    }
  };

  const state: RegisterFormState = {
    email,
    password,
    username,
    loading,
    error: authError,
    handleEmailChange: setEmail,
    handlePasswordChange: setPassword,
    handleUsernameChange: setUsername,
    handleSubmit,
  };

  return <>{children(state)}</>;
}

