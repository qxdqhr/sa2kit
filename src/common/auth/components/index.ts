/**
 * Auth Components
 * 认证相关 UI 组件
 *
 * 包含：
 * - Headless 组件（无样式，Better Auth 3.0）
 * - Styled 组件（Tailwind + lucide，需 AuthProvider）
 */

// Better Auth 3.0 Headless
export { SignInForm, RegisterFormHeadless, VerifyOtpForm } from './headless';

// Better Auth 3.0 Styled（需在应用根包裹 AuthProvider）
export { LoginModal, RegisterModal, ForgotPasswordModal, AuthGuard, UserMenu } from './styled';

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
} from './types';

export { validateEmail, validatePassword, validatePhoneNumber } from './utils';
