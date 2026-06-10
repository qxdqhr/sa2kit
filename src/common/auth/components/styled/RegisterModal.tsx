'use client';

import React, { useState } from 'react';
import { X, User, Lock, Phone, Mail, Eye, EyeOff } from 'lucide-react';
import { useAuthContext } from '../../context/AuthProvider';
import { RegisterFormHeadless } from '../headless/RegisterForm';
import type { RegisterModalProps } from '../types';
import { AuthModalPortal, authModalStyles } from './modal-shared';

export function RegisterModal({ isOpen, onClose, onSuccess, onSwitchToLogin }: RegisterModalProps) {
  const { authClient, refreshSession } = useAuthContext();
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const handleSuccess = async () => {
    await refreshSession();
    onSuccess?.();
  };

  if (!isOpen) return null;

  return (
    <AuthModalPortal>
      <div className={authModalStyles.overlayClass} style={{ margin: 0 }} onClick={(e) => e.target === e.currentTarget && onClose()}>
        <RegisterFormHeadless authClient={authClient} initialChannel="phone" onSuccess={handleSuccess}>
          {(state) => (
            <div className={authModalStyles.panelClass} onClick={(e) => e.stopPropagation()}>
              <button type="button" className={authModalStyles.closeBtnClass} onClick={onClose}>
                <X size={20} />
              </button>

              <div className="px-6 pt-6 pb-4 text-center border-b border-gray-100">
                <h2 className="text-2xl font-semibold text-gray-800 mb-2">用户注册</h2>
                <p className="text-gray-500 text-sm">请填写以下信息创建账户</p>
              </div>

              <div className="px-6 pt-4 flex gap-2">
                <button
                  type="button"
                  onClick={() => state.setChannel('phone')}
                  className={`px-3 py-1.5 text-xs rounded-full border transition-all ${
                    state.channel === 'phone'
                      ? 'bg-blue-500 text-white border-blue-500'
                      : 'bg-white text-gray-600 border-gray-200 hover:border-blue-300'
                  }`}
                >
                  手机号注册
                </button>
                <button
                  type="button"
                  onClick={() => state.setChannel('email')}
                  className={`px-3 py-1.5 text-xs rounded-full border transition-all ${
                    state.channel === 'email'
                      ? 'bg-blue-500 text-white border-blue-500'
                      : 'bg-white text-gray-600 border-gray-200 hover:border-blue-300'
                  }`}
                >
                  邮箱注册
                </button>
              </div>

              <form onSubmit={state.handleSubmit} className="p-6">
                {state.channel === 'email' && (
                  <div className="mb-5">
                    <label htmlFor="register-email" className="block mb-1.5 text-sm font-medium text-gray-700">
                      邮箱 *
                    </label>
                    <div className="relative flex items-center">
                      <Mail size={18} className="absolute left-4 text-gray-400 z-[1] pointer-events-none" />
                      <input
                        id="register-email"
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

                {state.channel === 'phone' && state.step === 'credentials' && (
                  <div className="mb-5">
                    <label htmlFor="register-phone" className="block mb-1.5 text-sm font-medium text-gray-700">
                      手机号 *
                    </label>
                    <div className="relative flex items-center">
                      <Phone size={18} className="absolute left-4 text-gray-400 z-[1] pointer-events-none" />
                      <input
                        id="register-phone"
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

                {state.channel === 'email' && (
                  <div className="mb-5">
                    <label htmlFor="register-name" className="block mb-1.5 text-sm font-medium text-gray-700">
                      昵称 *
                    </label>
                    <div className="relative flex items-center">
                      <User size={18} className="absolute left-4 text-gray-400 z-[1] pointer-events-none" />
                      <input
                        id="register-name"
                        type="text"
                        autoComplete="name"
                        value={state.name}
                        onChange={(e) => state.setName(e.target.value)}
                        placeholder="请输入昵称"
                        className={authModalStyles.inputClass}
                        disabled={state.loading}
                      />
                    </div>
                  </div>
                )}

                {state.step === 'credentials' && (
                  <>
                    <div className="mb-5">
                      <label htmlFor="register-password" className="block mb-1.5 text-sm font-medium text-gray-700">
                        密码 *
                      </label>
                      <div className="relative flex items-center">
                        <Lock size={18} className="absolute left-4 text-gray-400 z-[1] pointer-events-none" />
                        <input
                          id="register-password"
                          type={showPassword ? 'text' : 'password'}
                          autoComplete="new-password"
                          value={state.password}
                          onChange={(e) => state.setPassword(e.target.value)}
                          placeholder="请输入密码（至少6位）"
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

                    <div className="mb-5">
                      <label htmlFor="register-confirm-password" className="block mb-1.5 text-sm font-medium text-gray-700">
                        确认密码 *
                      </label>
                      <div className="relative flex items-center">
                        <Lock size={18} className="absolute left-4 text-gray-400 z-[1] pointer-events-none" />
                        <input
                          id="register-confirm-password"
                          type={showConfirmPassword ? 'text' : 'password'}
                          autoComplete="new-password"
                          value={state.confirmPassword}
                          onChange={(e) => state.setConfirmPassword(e.target.value)}
                          placeholder="请再次输入密码"
                          className={`${authModalStyles.inputClass} pr-12`}
                          disabled={state.loading}
                        />
                        <button
                          type="button"
                          className="absolute right-4 bg-transparent border-none text-gray-400 cursor-pointer p-1 rounded transition-all flex items-center justify-center min-w-6 min-h-6 hover:text-gray-600 hover:bg-gray-100"
                          onClick={() => setShowConfirmPassword((v) => !v)}
                          disabled={state.loading}
                        >
                          {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                        </button>
                      </div>
                    </div>
                  </>
                )}

                {state.channel === 'phone' && state.step === 'otp' && (
                  <div className="mb-5">
                    <label htmlFor="register-otp" className="block mb-1.5 text-sm font-medium text-gray-700">
                      验证码 *
                    </label>
                    <input
                      id="register-otp"
                      type="text"
                      inputMode="numeric"
                      value={state.otp}
                      onChange={(e) => state.setOtp(e.target.value)}
                      placeholder="请输入验证码"
                      className="w-full py-3 px-4 border-2 border-gray-200 rounded-lg text-base transition-all box-border min-h-12 bg-white focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10"
                      disabled={state.loading}
                      maxLength={8}
                    />
                  </div>
                )}

                {state.error && <div className={authModalStyles.errorClass}>{state.error}</div>}

                <button type="submit" className={authModalStyles.submitClass} disabled={state.loading}>
                  {state.loading
                    ? '处理中...'
                    : state.channel === 'phone' && state.step === 'credentials'
                      ? '发送验证码'
                      : state.channel === 'phone' && state.step === 'otp'
                        ? '完成注册'
                        : '注册'}
                </button>

                {onSwitchToLogin && (
                  <div className="text-center mt-5 pt-4 border-t border-gray-100">
                    <span className="text-gray-500 text-sm mr-1">已有账号？</span>
                    <button type="button" onClick={onSwitchToLogin} className={authModalStyles.linkBtnClass}>
                      立即登录
                    </button>
                  </div>
                )}
              </form>
            </div>
          )}
        </RegisterFormHeadless>
      </div>
    </AuthModalPortal>
  );
}
