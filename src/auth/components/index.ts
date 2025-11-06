/**
 * Auth Components
 * 认证相关 UI 组件
 *
 * 默认导出 Headless 组件（无样式）
 */

// Re-export components (only available when React is installed)
export { LoginForm } from './LoginForm';
export { RegisterForm } from './RegisterForm';
export type {
  LoginFormState,
  RegisterFormState,
  BaseFormProps,
  HeadlessLoginFormProps,
  HeadlessRegisterFormProps,
} from './types';

