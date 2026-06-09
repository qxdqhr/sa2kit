/**
 * Auth Components
 * 认证相关 UI 组件
 *
 * 包含：
 * - Headless 组件（无样式）
 * - 完整页面组件（带完整 UI）
 */

// Headless Components
export { LoginForm } from './LoginForm';
export { RegisterForm } from './RegisterForm';

// Full Page Components
export { AdminLoginPage } from './AdminLoginPage';
export type { AdminLoginPageProps } from './AdminLoginPage';

// Types
export type {
  LoginFormState,
  RegisterFormState,
  BaseFormProps,
  HeadlessLoginFormProps,
  HeadlessRegisterFormProps,
} from './types';

