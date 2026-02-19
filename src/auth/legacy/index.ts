// Legacy auth components for ShowMasterpiece compatibility
export { AuthProvider, useAuth } from './contexts/AuthContext';
export { default as AuthGuard } from './components/AuthGuard';
export { default as UserMenu } from './components/UserMenu';
export { default as LoginModal } from './components/LoginModal';
export { default as RegisterModal } from './components/RegisterModal';
export { default as ForgotPasswordModal } from './components/ForgotPasswordModal';

export {
  validatePhoneNumber,
  validatePassword,
  isAdmin,
  isActiveUser,
  getUserDisplayName,
  calculateSessionExpiry,
  isSessionExpired,
  generateSessionToken,
} from './utils/authUtils';

export type {
  User,
  UserSession,
  LoginRequest,
  RegisterRequest,
  LoginResponse,
  RegisterResponse,
  SessionValidationResponse,
  SessionValidation,
  LoginModalProps,
  RegisterModalProps,
  AuthGuardProps,
  UserMenuProps,
  CustomMenuItem,
  UseAuthReturn,
  AuthService,
  ValidateApiAuth,
  SessionConfig,
} from './types';

export { UserRole } from './types';
