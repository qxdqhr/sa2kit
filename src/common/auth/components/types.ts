/**
 * Auth UI 类型（Better Auth 3.0）
 */
import type { AuthActionsClient } from '../hooks/useAuthActions';

export type SignInMode = 'email-password' | 'phone-password' | 'phone-otp' | 'email-otp';
export type OtpChannel = 'phone' | 'email';

export interface SignInFormState {
  mode: SignInMode;
  step: 'credentials' | 'otp';
  email: string;
  phone: string;
  password: string;
  otp: string;
  loading: boolean;
  error: string | null;
  setMode: (mode: SignInMode) => void;
  setEmail: (value: string) => void;
  setPhone: (value: string) => void;
  setPassword: (value: string) => void;
  setOtp: (value: string) => void;
  sendOtp: () => Promise<void>;
  handleSubmit: (e?: React.FormEvent) => Promise<void>;
}

export interface RegisterFormHeadlessState {
  channel: 'email' | 'phone';
  step: 'credentials' | 'otp';
  email: string;
  phone: string;
  password: string;
  confirmPassword: string;
  name: string;
  otp: string;
  loading: boolean;
  error: string | null;
  setChannel: (channel: 'email' | 'phone') => void;
  setEmail: (value: string) => void;
  setPhone: (value: string) => void;
  setPassword: (value: string) => void;
  setConfirmPassword: (value: string) => void;
  setName: (value: string) => void;
  setOtp: (value: string) => void;
  sendOtp: () => Promise<void>;
  handleSubmit: (e?: React.FormEvent) => Promise<void>;
}

export interface VerifyOtpFormState {
  channel: OtpChannel;
  target: string;
  otp: string;
  loading: boolean;
  error: string | null;
  setOtp: (value: string) => void;
  resendOtp: () => Promise<void>;
  handleSubmit: (e?: React.FormEvent) => Promise<void>;
}

export interface HeadlessSignInFormProps {
  authClient: AuthActionsClient;
  initialMode?: SignInMode;
  onSuccess?: () => void;
  onError?: (error: string) => void;
  children: (state: SignInFormState) => React.ReactNode;
}

export interface HeadlessRegisterFormProps {
  authClient: AuthActionsClient;
  initialChannel?: 'email' | 'phone';
  onSuccess?: () => void;
  onError?: (error: string) => void;
  children: (state: RegisterFormHeadlessState) => React.ReactNode;
}

export interface HeadlessVerifyOtpFormProps {
  authClient: AuthActionsClient;
  channel: OtpChannel;
  target: string;
  onSuccess?: () => void;
  onError?: (error: string) => void;
  children: (state: VerifyOtpFormState) => React.ReactNode;
}

export interface LoginModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
  onSwitchToRegister?: () => void;
  defaultMode?: SignInMode;
}

export interface RegisterModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
  onSwitchToLogin?: () => void;
}

export interface ForgotPasswordModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export interface AuthGuardProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
  requireAuth?: boolean;
}

export interface UserMenuProps {
  customMenuItems?: Array<{
    id: string;
    label: string;
    icon?: React.ComponentType<{ size?: number }>;
    onClick: () => void;
    requireAuth?: boolean;
  }>;
  className?: string;
}
