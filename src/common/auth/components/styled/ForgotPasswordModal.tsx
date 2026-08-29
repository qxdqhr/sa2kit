'use client';

import React, { useState } from 'react';
import { Eye, EyeOff } from 'lucide-react';
import { useAuthContext } from '../../context/AuthProvider';
import type { ForgotPasswordModalProps } from '../types';
import { validatePassword, validatePhoneNumber } from '../utils';
import {
  AuthModalShell,
  AuthField,
  AuthTextInput,
  AuthError,
  AuthLinkButton,
  AuthSubmitButton,
} from '../../../ui/auth';

export function ForgotPasswordModal({ isOpen, onClose, onSuccess }: ForgotPasswordModalProps) {
  const { requestPhonePasswordReset, resetPhonePassword } = useAuthContext();
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [countdown, setCountdown] = useState(0);

  const startCountdown = () => {
    setCountdown(60);
    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  const handleSendCode = async () => {
    setError('');
    if (!validatePhoneNumber(phone)) {
      setError('请输入正确的手机号');
      return;
    }
    setLoading(true);
    try {
      const result = await requestPhonePasswordReset(phone.trim());
      if (!result.success) {
        setError(result.error);
        return;
      }
      startCountdown();
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!validatePhoneNumber(phone)) return setError('请输入正确的手机号');
    const pwd = validatePassword(newPassword);
    if (!pwd.valid) return setError(pwd.message ?? '密码无效');
    if (newPassword !== confirmPassword) return setError('两次密码不一致');
    if (!/^\d{4,8}$/.test(otp)) return setError('请输入验证码');

    setLoading(true);
    try {
      const result = await resetPhonePassword(phone.trim(), otp, newPassword);
      if (!result.success) {
        setError(result.error);
        return;
      }
      onSuccess?.();
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthModalShell
      open={isOpen}
      onClose={onClose}
      title="重置密码"
      description="请输入手机号和验证码重置密码"
    >
      <form onSubmit={handleSubmit}>
        <AuthField id="reset-phone" label="手机号">
          <AuthTextInput
            id="reset-phone"
            type="tel"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="请输入手机号"
            disabled={loading}
          />
        </AuthField>

        <AuthField id="reset-otp" label="验证码">
          <AuthTextInput
            id="reset-otp"
            type="text"
            inputMode="numeric"
            value={otp}
            onChange={(e) => setOtp(e.target.value)}
            placeholder="请输入验证码"
            disabled={loading}
            maxLength={8}
            suffix={
              <AuthLinkButton onClick={handleSendCode} disabled={loading || countdown > 0}>
                {countdown > 0 ? `${countdown}秒后重试` : '发送验证码'}
              </AuthLinkButton>
            }
          />
        </AuthField>

        <AuthField id="reset-password" label="新密码">
          <AuthTextInput
            id="reset-password"
            type={showPassword ? 'text' : 'password'}
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            placeholder="请输入新密码"
            disabled={loading}
            suffix={
              <button
                type="button"
                className="border-none bg-transparent p-0 text-[var(--sa2-text-muted,#8a7b66)]"
                onClick={() => setShowPassword((v) => !v)}
                disabled={loading}
                aria-label={showPassword ? '隐藏密码' : '显示密码'}
              >
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            }
          />
        </AuthField>

        <AuthField id="reset-confirm-password" label="确认密码">
          <AuthTextInput
            id="reset-confirm-password"
            type={showConfirmPassword ? 'text' : 'password'}
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            placeholder="请再次输入新密码"
            disabled={loading}
            suffix={
              <button
                type="button"
                className="border-none bg-transparent p-0 text-[var(--sa2-text-muted,#8a7b66)]"
                onClick={() => setShowConfirmPassword((v) => !v)}
                disabled={loading}
                aria-label={showConfirmPassword ? '隐藏密码' : '显示密码'}
              >
                {showConfirmPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            }
          />
        </AuthField>

        <AuthError message={error} />
        <AuthSubmitButton loading={loading}>{loading ? '提交中...' : '重置密码'}</AuthSubmitButton>
      </form>
    </AuthModalShell>
  );
}
