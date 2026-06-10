'use client';

import React, { useState } from 'react';
import { X, Phone, Lock, Eye, EyeOff } from 'lucide-react';
import { useAuthContext } from '../../context/AuthProvider';
import type { ForgotPasswordModalProps } from '../types';
import { validatePassword, validatePhoneNumber } from '../utils';
import { AuthModalPortal, authModalStyles } from './modal-shared';

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

  if (!isOpen) return null;

  return (
    <AuthModalPortal>
      <div className={authModalStyles.overlayClass} style={{ margin: 0 }} onClick={(e) => e.target === e.currentTarget && onClose()}>
        <div className={authModalStyles.panelClass} onClick={(e) => e.stopPropagation()}>
          <button type="button" className={authModalStyles.closeBtnClass} onClick={onClose}>
            <X size={20} />
          </button>

          <div className="px-6 pt-6 pb-4 text-center border-b border-gray-100">
            <h2 className="text-2xl font-semibold text-gray-800 mb-2">重置密码</h2>
            <p className="text-gray-500 text-sm">请输入手机号和验证码重置密码</p>
          </div>

          <form onSubmit={handleSubmit} className="p-6">
            <div className="mb-5">
              <label htmlFor="reset-phone" className="block mb-1.5 text-sm font-medium text-gray-700">
                手机号
              </label>
              <div className="relative flex items-center">
                <Phone size={18} className="absolute left-4 text-gray-400 z-[1] pointer-events-none" />
                <input
                  id="reset-phone"
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="请输入手机号"
                  className={authModalStyles.inputClass}
                  disabled={loading}
                />
              </div>
            </div>

            <div className="mb-5">
              <label htmlFor="reset-otp" className="block mb-1.5 text-sm font-medium text-gray-700">
                验证码
              </label>
              <div className="relative flex items-center">
                <input
                  id="reset-otp"
                  type="text"
                  inputMode="numeric"
                  value={otp}
                  onChange={(e) => setOtp(e.target.value)}
                  placeholder="请输入验证码"
                  className="w-full py-3 px-4 pr-28 border-2 border-gray-200 rounded-lg text-base transition-all box-border min-h-12 bg-white focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10"
                  disabled={loading}
                  maxLength={8}
                />
                <button
                  type="button"
                  className="absolute right-2 top-1/2 -translate-y-1/2 bg-transparent border-none text-blue-500 text-sm font-medium cursor-pointer px-2 py-1 rounded transition-all whitespace-nowrap hover:bg-blue-50 disabled:text-gray-400 disabled:cursor-not-allowed"
                  onClick={handleSendCode}
                  disabled={loading || countdown > 0}
                >
                  {countdown > 0 ? `${countdown}秒后重试` : '发送验证码'}
                </button>
              </div>
            </div>

            <div className="mb-5">
              <label htmlFor="reset-password" className="block mb-1.5 text-sm font-medium text-gray-700">
                新密码
              </label>
              <div className="relative flex items-center">
                <Lock size={18} className="absolute left-4 text-gray-400 z-[1] pointer-events-none" />
                <input
                  id="reset-password"
                  type={showPassword ? 'text' : 'password'}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="请输入新密码"
                  className={`${authModalStyles.inputClass} pr-12`}
                  disabled={loading}
                />
                <button
                  type="button"
                  className="absolute right-4 bg-transparent border-none text-gray-400 cursor-pointer p-1 rounded transition-all flex items-center justify-center min-w-6 min-h-6 hover:text-gray-600 hover:bg-gray-100"
                  onClick={() => setShowPassword((v) => !v)}
                  disabled={loading}
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            <div className="mb-5">
              <label htmlFor="reset-confirm-password" className="block mb-1.5 text-sm font-medium text-gray-700">
                确认密码
              </label>
              <div className="relative flex items-center">
                <Lock size={18} className="absolute left-4 text-gray-400 z-[1] pointer-events-none" />
                <input
                  id="reset-confirm-password"
                  type={showConfirmPassword ? 'text' : 'password'}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="请再次输入新密码"
                  className={`${authModalStyles.inputClass} pr-12`}
                  disabled={loading}
                />
                <button
                  type="button"
                  className="absolute right-4 bg-transparent border-none text-gray-400 cursor-pointer p-1 rounded transition-all flex items-center justify-center min-w-6 min-h-6 hover:text-gray-600 hover:bg-gray-100"
                  onClick={() => setShowConfirmPassword((v) => !v)}
                  disabled={loading}
                >
                  {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            {error && <div className={authModalStyles.errorClass}>{error}</div>}

            <button type="submit" className={authModalStyles.submitClass} disabled={loading}>
              {loading ? '提交中...' : '重置密码'}
            </button>
          </form>
        </div>
      </div>
    </AuthModalPortal>
  );
}
