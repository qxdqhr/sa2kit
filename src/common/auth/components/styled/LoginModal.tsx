'use client';

import React, { useState } from 'react';
import { X, User, Lock, Eye, EyeOff, Mail, Phone } from 'lucide-react';
import { useAuthContext } from '../../context/AuthProvider';
import { SignInForm } from '../headless/SignInForm';
import type { LoginModalProps, SignInMode } from '../types';
import { AuthModalPortal, authModalStyles } from './modal-shared';
import { ForgotPasswordModal } from './ForgotPasswordModal';

const MODE_LABELS: Record<SignInMode, string> = {
  'phone-password': '手机密码',
  'email-password': '邮箱密码',
  'phone-otp': '手机验证码',
  'email-otp': '邮箱验证码',
};

export function LoginModal({
  isOpen,
  onClose,
  onSuccess,
  onSwitchToRegister,
  defaultMode = 'phone-password',
}: LoginModalProps) {
  const { authClient, refreshSession } = useAuthContext();
  const [showPassword, setShowPassword] = useState(false);
  const [showForgotPassword, setShowForgotPassword] = useState(false);

  const handleSuccess = async () => {
    await refreshSession();
    onSuccess?.();
  };

  if (!isOpen) return null;

  return (
    <AuthModalPortal>
      <div className={authModalStyles.overlayClass} style={{ margin: 0 }} onClick={(e) => e.target === e.currentTarget && onClose()}>
        <SignInForm authClient={authClient} initialMode={defaultMode} onSuccess={handleSuccess}>
          {(state) => (
            <div className={authModalStyles.panelClass} onClick={(e) => e.stopPropagation()}>
              <button type="button" className={authModalStyles.closeBtnClass} onClick={onClose}>
                <X size={20} />
              </button>

              <div className="px-6 pt-6 pb-4 text-center border-b border-gray-100">
                <h2 className="text-2xl font-semibold text-gray-800 mb-2">用户登录</h2>
                <p className="text-gray-500 text-sm">选择登录方式并填写信息</p>
              </div>

              <div className="px-6 pt-4 flex flex-wrap gap-2">
                {(Object.keys(MODE_LABELS) as SignInMode[]).map((mode) => (
                  <button
                    key={mode}
                    type="button"
                    onClick={() => state.setMode(mode)}
                    className={`px-3 py-1.5 text-xs rounded-full border transition-all ${
                      state.mode === mode
                        ? 'bg-blue-500 text-white border-blue-500'
                        : 'bg-white text-gray-600 border-gray-200 hover:border-blue-300'
                    }`}
                  >
                    {MODE_LABELS[mode]}
                  </button>
                ))}
              </div>

              <form onSubmit={state.handleSubmit} className="p-6">
                {(state.mode === 'email-password' || state.mode === 'email-otp') && state.step === 'credentials' && (
                  <div className="mb-5">
                    <label htmlFor="login-email" className="block mb-1.5 text-sm font-medium text-gray-700">
                      邮箱
                    </label>
                    <div className="relative flex items-center">
                      <Mail size={18} className="absolute left-4 text-gray-400 z-[1] pointer-events-none" />
                      <input
                        id="login-email"
                        type="email"
                        autoComplete="email"
                        value={state.email}
                        onChange={(e) => state.setEmail(e.target.value)}
                        placeholder="请输入邮箱"
                        className={authModalStyles.inputClass}
                        disabled={state.loading}
                      />
                    </div>
                  </div>
                )}

                {(state.mode === 'phone-password' || state.mode === 'phone-otp') && state.step === 'credentials' && (
                  <div className="mb-5">
                    <label htmlFor="login-phone" className="block mb-1.5 text-sm font-medium text-gray-700">
                      手机号
                    </label>
                    <div className="relative flex items-center">
                      <Phone size={18} className="absolute left-4 text-gray-400 z-[1] pointer-events-none" />
                      <input
                        id="login-phone"
                        type="tel"
                        autoComplete="tel"
                        value={state.phone}
                        onChange={(e) => state.setPhone(e.target.value)}
                        placeholder="请输入手机号"
                        className={authModalStyles.inputClass}
                        disabled={state.loading}
                      />
                    </div>
                  </div>
                )}

                {(state.mode === 'email-password' || state.mode === 'phone-password') && (
                  <div className="mb-5">
                    <label htmlFor="login-password" className="block mb-1.5 text-sm font-medium text-gray-700">
                      密码
                    </label>
                    <div className="relative flex items-center">
                      <Lock size={18} className="absolute left-4 text-gray-400 z-[1] pointer-events-none" />
                      <input
                        id="login-password"
                        type={showPassword ? 'text' : 'password'}
                        autoComplete="current-password"
                        value={state.password}
                        onChange={(e) => state.setPassword(e.target.value)}
                        placeholder="请输入密码"
                        className={`${authModalStyles.inputClass} pr-12`}
                        disabled={state.loading}
                      />
                      <button
                        type="button"
                        className="absolute right-4 bg-transparent border-none text-gray-400 cursor-pointer p-1 rounded transition-all flex items-center justify-center min-w-6 min-h-6 hover:text-gray-600 hover:bg-gray-100"
                        onClick={() => setShowPassword((v) => !v)}
                        disabled={state.loading}
                      >
                        {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                      </button>
                    </div>
                  </div>
                )}

                {(state.mode === 'phone-otp' || state.mode === 'email-otp') && state.step === 'otp' && (
                  <div className="mb-5">
                    <label htmlFor="login-otp" className="block mb-1.5 text-sm font-medium text-gray-700">
                      验证码
                    </label>
                    <div className="relative flex items-center">
                      <User size={18} className="absolute left-4 text-gray-400 z-[1] pointer-events-none" />
                      <input
                        id="login-otp"
                        type="text"
                        inputMode="numeric"
                        value={state.otp}
                        onChange={(e) => state.setOtp(e.target.value)}
                        placeholder="请输入验证码"
                        className={authModalStyles.inputClass}
                        disabled={state.loading}
                        maxLength={8}
                      />
                    </div>
                  </div>
                )}

                {(state.mode === 'phone-password' || state.mode === 'phone-otp') && state.step === 'credentials' && (
                  <div className="text-right -mt-2 mb-4">
                    <button type="button" onClick={() => setShowForgotPassword(true)} className={authModalStyles.linkBtnClass}>
                      忘记密码？
                    </button>
                  </div>
                )}

                {state.error && <div className={authModalStyles.errorClass}>{state.error}</div>}

                <button type="submit" className={authModalStyles.submitClass} disabled={state.loading}>
                  {state.loading
                    ? '处理中...'
                    : state.step === 'otp'
                      ? '验证并登录'
                      : state.mode === 'phone-otp' || state.mode === 'email-otp'
                        ? '发送验证码'
                        : '登录'}
                </button>

                {onSwitchToRegister && (
                  <div className="text-center mt-5 pt-4 border-t border-gray-100">
                    <span className="text-gray-500 text-sm mr-1">还没有账号？</span>
                    <button type="button" onClick={onSwitchToRegister} className={authModalStyles.linkBtnClass}>
                      立即注册
                    </button>
                  </div>
                )}
              </form>
            </div>
          )}
        </SignInForm>
      </div>

      <ForgotPasswordModal
        isOpen={showForgotPassword}
        onClose={() => setShowForgotPassword(false)}
        onSuccess={() => {
          setShowForgotPassword(false);
          handleSuccess();
        }}
      />
    </AuthModalPortal>
  );
}
