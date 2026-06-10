/**
 * Auth Components
 * 认证相关 UI 组件
 *
 * 包含：
 * - Headless 组件（无样式，Better Auth 3.0）
 * - Styled 组件（Tailwind + lucide，需 AuthProvider）
 * - 2.x 兼容 Headless（deprecated）
 */

// Better Auth 3.0 Headless
export { SignInForm, RegisterFormHeadless, VerifyOtpForm } from './headless';

// Better Auth 3.0 Styled（需在应用根包裹 AuthProvider）
export { LoginModal, RegisterModal, ForgotPasswordModal, AuthGuard, UserMenu } from './styled';

/** @deprecated 2.x apiClient Headless，请改用 SignInForm + authClient */
export { LoginForm } from './LoginForm';
/** @deprecated 2.x apiClient Headless，请改用 RegisterFormHeadless + authClient */
export { RegisterForm } from './RegisterForm';

// Full Page Components
export { AdminLoginPage } from './AdminLoginPage';
export type { AdminLoginPageProps } from './AdminLoginPage';

// Types
export type {
  SignInMode,
  OtpChannel,
  SignInFormState,
  RegisterFormHeadlessState,
  VerifyOtpFormState,
  HeadlessSignInFormProps,
  HeadlessRegisterFormProps,
  HeadlessVerifyOtpFormProps,
  LoginModalProps,
  RegisterModalProps,
  ForgotPasswordModalProps,
  AuthGuardProps,
  UserMenuProps,
  LoginFormState,
  RegisterFormState,
  BaseFormProps,
  HeadlessLoginFormProps,
  HeadlessRegisterFormPropsLegacy,
} from './types';

export { validateEmail, validatePassword, validatePhoneNumber } from './utils';
