/**
 * Auth Components - Types
 * 组件类型定义
 */

import type { User } from '../client/types';

/**
 * 登录表单状态
 */
export interface LoginFormState {
  email: string;
  password: string;
  loading: boolean;
  error: string | null;
  handleEmailChange: (value: string) => void;
  handlePasswordChange: (value: string) => void;
  handleSubmit: (e?: React.FormEvent) => Promise<void>;
}

/**
 * 注册表单状态
 */
export interface RegisterFormState {
  email: string;
  password: string;
  username: string;
  loading: boolean;
  error: string | null;
  handleEmailChange: (value: string) => void;
  handlePasswordChange: (value: string) => void;
  handleUsernameChange: (value: string) => void;
  handleSubmit: (e?: React.FormEvent) => Promise<void>;
}

/**
 * 表单基础属性
 */
export interface BaseFormProps {
  /**
   * API 客户端实例
   */
  apiClient: any;

  /**
   * 成功回调
   */
  onSuccess?: (user: User) => void;

  /**
   * 错误回调
   */
  onError?: (error: string) => void;
}

/**
 * Headless 登录表单属性
 */
export interface HeadlessLoginFormProps extends BaseFormProps {
  /**
   * Render prop 函数
   */
  children: (state: LoginFormState) => React.ReactNode;
}

/**
 * Headless 注册表单属性
 */
export interface HeadlessRegisterFormProps extends BaseFormProps {
  /**
   * Render prop 函数
   */
  children: (state: RegisterFormState) => React.ReactNode;
}

