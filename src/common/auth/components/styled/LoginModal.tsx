'use client';

import React, { useState } from 'react';
import { Eye, EyeOff } from 'lucide-react';
import { useAuthContext } from '../../context/AuthProvider';
import { SignInForm } from '../headless/SignInForm';
import type { LoginModalProps, SignInMode } from '../types';
import {
  AuthModalShell,
  AuthField,
  AuthTextInput,
  AuthModeChips,
  AuthError,
  AuthLinkButton,
  AuthSubmitButton,
  AuthSwitchRow,
} from '../../../ui/auth';
import { ForgotPasswordModal } from './ForgotPasswordModal';

const MODE_OPTIONS: { value: SignInMode; label: string }[] = [
  { value: 'phone-password', label: '手机密码' },
  { value: 'email-password', label: '邮箱密码' },
  { value: 'phone-otp', label: '手机验证码' },
  { value: 'email-otp', label: '邮箱验证码' },
];

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

  return (
    <>
      <AuthModalShell
        open={isOpen}
        onClose={onClose}
        title="用户登录"
        description="选择登录方式并填写信息"
      >
        <SignInForm authClient={authClient} initialMode={defaultMode} onSuccess={handleSuccess}>
          {(state) => (
            <>
              <AuthModeChips
                options={MODE_OPTIONS}
                value={state.mode}
                onChange={state.setMode}
              />

              <form onSubmit={state.handleSubmit} className="mt-4">
                {(state.mode === 'email-password' || state.mode === 'email-otp') &&
                  state.step === 'credentials' && (
                    <AuthField id="login-email" label="邮箱">
                      <AuthTextInput
                        id="login-email"
                        type="email"
                        autoComplete="email"
                        value={state.email}
                        onChange={(e) => state.setEmail(e.target.value)}
                        placeholder="请输入邮箱"
                        disabled={state.loading}
                      />
                    </AuthField>
                  )}

                {(state.mode === 'phone-password' || state.mode === 'phone-otp') &&
                  state.step === 'credentials' && (
                    <AuthField id="login-phone" label="手机号">
                      <AuthTextInput
                        id="login-phone"
                        type="tel"
                        autoComplete="tel"
                        value={state.phone}
                        onChange={(e) => state.setPhone(e.target.value)}
                        placeholder="请输入手机号"
                        disabled={state.loading}
                      />
                    </AuthField>
                  )}

                {(state.mode === 'email-password' || state.mode === 'phone-password') && (
                  <AuthField id="login-password" label="密码">
                    <AuthTextInput
                      id="login-password"
                      type={showPassword ? 'text' : 'password'}
                      autoComplete="current-password"
                      value={state.password}
                      onChange={(e) => state.setPassword(e.target.value)}
                      placeholder="请输入密码"
                      disabled={state.loading}
                      suffix={
                        <button
                          type="button"
                          className="border-none bg-transparent p-0 text-[var(--sa2-text-muted,#8a7b66)]"
                          onClick={() => setShowPassword((v) => !v)}
                          disabled={state.loading}
                          aria-label={showPassword ? '隐藏密码' : '显示密码'}
                        >
                          {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                        </button>
                      }
                    />
                  </AuthField>
                )}

                {(state.mode === 'phone-otp' || state.mode === 'email-otp') &&
                  state.step === 'otp' && (
                    <AuthField id="login-otp" label="验证码">
                      <AuthTextInput
                        id="login-otp"
                        type="text"
                        inputMode="numeric"
                        value={state.otp}
                        onChange={(e) => state.setOtp(e.target.value)}
                        placeholder="请输入验证码"
                        disabled={state.loading}
                        maxLength={8}
                      />
                    </AuthField>
                  )}

                {(state.mode === 'phone-password' || state.mode === 'phone-otp') &&
                  state.step === 'credentials' && (
                    <div className="-mt-2 mb-4 text-right">
                      <AuthLinkButton onClick={() => setShowForgotPassword(true)}>
                        忘记密码？
                      </AuthLinkButton>
                    </div>
                  )}

                <AuthError message={state.error} />

                <AuthSubmitButton loading={state.loading}>
                  {state.loading
                    ? '处理中...'
                    : state.step === 'otp'
                      ? '验证并登录'
                      : state.mode === 'phone-otp' || state.mode === 'email-otp'
                        ? '发送验证码'
                        : '登录'}
                </AuthSubmitButton>

                <AuthSwitchRow
                  hint="还没有账号？"
                  actionLabel="立即注册"
                  onAction={onSwitchToRegister}
                />
              </form>
            </>
          )}
        </SignInForm>
      </AuthModalShell>

      <ForgotPasswordModal
        isOpen={showForgotPassword}
        onClose={() => setShowForgotPassword(false)}
        onSuccess={() => {
          setShowForgotPassword(false);
          void handleSuccess();
        }}
      />
    </>
  );
}
