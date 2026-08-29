'use client';

import React, { useState } from 'react';
import { Eye, EyeOff } from 'lucide-react';
import { useAuthContext } from '../../context/AuthProvider';
import { RegisterFormHeadless } from '../headless/RegisterForm';
import type { RegisterModalProps } from '../types';
import {
  AuthModalShell,
  AuthField,
  AuthTextInput,
  AuthModeChips,
  AuthError,
  AuthSubmitButton,
  AuthSwitchRow,
} from '../../../ui/auth';

type Channel = 'phone' | 'email';

const CHANNEL_OPTIONS: { value: Channel; label: string }[] = [
  { value: 'phone', label: '手机号注册' },
  { value: 'email', label: '邮箱注册' },
];

export function RegisterModal({ isOpen, onClose, onSuccess, onSwitchToLogin }: RegisterModalProps) {
  const { authClient, refreshSession } = useAuthContext();
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const handleSuccess = async () => {
    await refreshSession();
    onSuccess?.();
  };

  return (
    <AuthModalShell
      open={isOpen}
      onClose={onClose}
      title="用户注册"
      description="请填写以下信息创建账户"
    >
      <RegisterFormHeadless authClient={authClient} initialChannel="phone" onSuccess={handleSuccess}>
        {(state) => (
          <>
            <AuthModeChips
              options={CHANNEL_OPTIONS}
              value={state.channel}
              onChange={state.setChannel}
            />

            <form onSubmit={state.handleSubmit} className="mt-4">
              {state.channel === 'email' && (
                <AuthField id="register-email" label="邮箱 *">
                  <AuthTextInput
                    id="register-email"
                    type="email"
                    autoComplete="email"
                    value={state.email}
                    onChange={(e) => state.setEmail(e.target.value)}
                    placeholder="请输入邮箱"
                    disabled={state.loading}
                  />
                </AuthField>
              )}

              {state.channel === 'phone' && state.step === 'credentials' && (
                <AuthField id="register-phone" label="手机号 *">
                  <AuthTextInput
                    id="register-phone"
                    type="tel"
                    autoComplete="tel"
                    value={state.phone}
                    onChange={(e) => state.setPhone(e.target.value)}
                    placeholder="请输入手机号"
                    disabled={state.loading}
                  />
                </AuthField>
              )}

              {state.channel === 'email' && (
                <AuthField id="register-name" label="昵称 *">
                  <AuthTextInput
                    id="register-name"
                    type="text"
                    autoComplete="name"
                    value={state.name}
                    onChange={(e) => state.setName(e.target.value)}
                    placeholder="请输入昵称"
                    disabled={state.loading}
                  />
                </AuthField>
              )}

              {state.step === 'credentials' && (
                <>
                  <AuthField id="register-password" label="密码 *">
                    <AuthTextInput
                      id="register-password"
                      type={showPassword ? 'text' : 'password'}
                      autoComplete="new-password"
                      value={state.password}
                      onChange={(e) => state.setPassword(e.target.value)}
                      placeholder="请输入密码（至少6位）"
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

                  <AuthField id="register-confirm-password" label="确认密码 *">
                    <AuthTextInput
                      id="register-confirm-password"
                      type={showConfirmPassword ? 'text' : 'password'}
                      autoComplete="new-password"
                      value={state.confirmPassword}
                      onChange={(e) => state.setConfirmPassword(e.target.value)}
                      placeholder="请再次输入密码"
                      disabled={state.loading}
                      suffix={
                        <button
                          type="button"
                          className="border-none bg-transparent p-0 text-[var(--sa2-text-muted,#8a7b66)]"
                          onClick={() => setShowConfirmPassword((v) => !v)}
                          disabled={state.loading}
                          aria-label={showConfirmPassword ? '隐藏密码' : '显示密码'}
                        >
                          {showConfirmPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                        </button>
                      }
                    />
                  </AuthField>
                </>
              )}

              {state.channel === 'phone' && state.step === 'otp' && (
                <AuthField id="register-otp" label="验证码 *">
                  <AuthTextInput
                    id="register-otp"
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

              <AuthError message={state.error} />

              <AuthSubmitButton loading={state.loading}>
                {state.loading
                  ? '处理中...'
                  : state.channel === 'phone' && state.step === 'credentials'
                    ? '发送验证码'
                    : state.channel === 'phone' && state.step === 'otp'
                      ? '完成注册'
                      : '注册'}
              </AuthSubmitButton>

              <AuthSwitchRow
                hint="已有账号？"
                actionLabel="立即登录"
                onAction={onSwitchToLogin}
              />
            </form>
          </>
        )}
      </RegisterFormHeadless>
    </AuthModalShell>
  );
}
