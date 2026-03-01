/**
 * Legacy Auth Module (phone + cookie session)
 * 架构对齐 showmasterpiece 模块
 */

// ===== UI 导出 =====
export * from './ui/web';
export {
  LoginModal as MiniappLoginModal,
  RegisterModal as MiniappRegisterModal,
  ForgotPasswordModal as MiniappForgotPasswordModal,
} from './ui/miniapp';

// ===== 逻辑导出 =====
export * from './logic';

// ===== 服务导出 =====
export * from './services';

// ===== 类型导出 =====
export * from './types';

// ===== Schema =====
export * from './schema';

// ===== 路由 =====
export * from './routes';

// ===== 服务端 =====
export * from './server';

// ===== utils =====
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
