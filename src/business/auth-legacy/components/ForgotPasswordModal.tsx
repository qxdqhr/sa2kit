'use client';

import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X, Phone, Lock, Eye, EyeOff } from 'lucide-react';
import { validatePhoneNumber, validatePassword } from '../utils/authUtils';
import type { ForgotPasswordModalProps } from '../types';

export default function ForgotPasswordModal({ isOpen, onClose, onSuccess }: ForgotPasswordModalProps) {
  const [formData, setFormData] = useState({
    phone: '',
    newPassword: '',
    confirmPassword: '',
    verificationCode: '',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [countdown, setCountdown] = useState(0);
  const [mounted, setMounted] = useState(false);

  // 确保在客户端渲染
  useEffect(() => {
    setMounted(true);
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (error) setError(''); // 清除错误信息
  };

  const validateForm = () => {
    if (!formData.phone || !formData.newPassword || !formData.confirmPassword || !formData.verificationCode) {
      setError('请填写完整信息');
      return false;
    }

    if (!validatePhoneNumber(formData.phone)) {
      setError('请输入正确的手机号格式');
      return false;
    }

    const passwordValidation = validatePassword(formData.newPassword);
    if (!passwordValidation.valid) {
      setError(passwordValidation.message || '密码格式错误');
      return false;
    }

    if (formData.newPassword !== formData.confirmPassword) {
      setError('两次输入的密码不一致');
      return false;
    }

    if (!/^\d{6}$/.test(formData.verificationCode)) {
      setError('请输入6位数字验证码');
      return false;
    }

    return true;
  };

  const handleSendCode = async () => {
    if (!formData.phone) {
      setError('请输入手机号');
      return;
    }

    if (!validatePhoneNumber(formData.phone)) {
      setError('请输入正确的手机号格式');
      return;
    }

    try {
      setLoading(true);
      setError(''); // 清除之前的错误信息
      
      const response = await fetch('/api/auth/send-verification-code', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone: formData.phone }),
      });

      const data = await response.json();
      if (data.success) {
        // 开始倒计时
        setCountdown(60);
        const timer = setInterval(() => {
          setCountdown(prev => {
            if (prev <= 1) {
              clearInterval(timer);
              return 0;
            }
            return prev - 1;
          });
        }, 1000);
        
        // 显示成功提示
        console.log('✅ 验证码发送成功');
      } else {
        setError(data.message || '发送验证码失败');
      }
    } catch (error) {
      console.error('发送验证码异常:', error);
      setError('发送验证码失败，请稍后重试');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (!validateForm()) {
        return;
      }

      const response = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          phone: formData.phone,
          newPassword: formData.newPassword,
          verificationCode: formData.verificationCode,
        }),
      });

      const data = await response.json();
      if (data.success) {
        onSuccess();
      } else {
        setError(data.message || '重置密码失败');
      }
    } catch (error) {
      setError('重置密码失败，请稍后重试');
    } finally {
      setLoading(false);
    }
  };

  const handleOverlayClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  if (!isOpen || !mounted) return null;

  const modalContent = (
    <div 
      className="fixed top-0 left-0 right-0 bottom-0 w-screen h-screen bg-black/50 backdrop-blur-sm flex items-center justify-center z-[9999] p-4"
      style={{ margin: 0 }}
      onClick={handleOverlayClick}
    >
      <div 
        className="bg-white rounded-2xl shadow-xl w-full max-w-[420px] max-h-[90vh] overflow-y-auto relative"
        onClick={(e) => e.stopPropagation()}
      >
        {/* 关闭按钮 */}
        <button 
          className="absolute top-5 right-5 bg-transparent border-none text-gray-500 cursor-pointer p-2 rounded-lg transition-all hover:bg-gray-100 hover:text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 min-w-9 min-h-9 flex items-center justify-center"
          onClick={onClose}
        >
          <X size={20} />
        </button>

        {/* 标题 */}
        <div className="px-6 pt-6 pb-4 text-center border-b border-gray-100">
          <h2 className="text-2xl font-semibold text-gray-800 mb-2">重置密码</h2>
          <p className="text-gray-500 text-sm">请输入手机号和验证码重置密码</p>
        </div>

        {/* 重置密码表单 */}
        <form onSubmit={handleSubmit} className="p-6">
          {/* 手机号输入 */}
          <div className="mb-5">
            <label htmlFor="phone" className="block mb-1.5 text-sm font-medium text-gray-700">
              手机号
            </label>
            <div className="relative flex items-center">
              <Phone size={18} className="absolute left-4 text-gray-400 z-[1] pointer-events-none" />
              <input
                id="phone"
                name="phone"
                type="tel"
                value={formData.phone}
                onChange={handleInputChange}
                placeholder="请输入手机号"
                className="w-full py-3 px-4 pl-12 border-2 border-gray-200 rounded-lg text-base transition-all box-border min-h-12 bg-white focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10 placeholder:text-gray-400 disabled:bg-gray-50 disabled:text-gray-500 disabled:cursor-not-allowed"
                disabled={loading}
              />
            </div>
          </div>

          {/* 验证码输入 */}
          <div className="mb-5">
            <label htmlFor="verificationCode" className="block mb-1.5 text-sm font-medium text-gray-700">
              验证码
            </label>
            <div className="relative flex items-center">
              <input
                id="verificationCode"
                name="verificationCode"
                type="text"
                value={formData.verificationCode}
                onChange={handleInputChange}
                placeholder="请输入验证码"
                className="w-full py-3 px-4 pr-28 border-2 border-gray-200 rounded-lg text-base transition-all box-border min-h-12 bg-white focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10 placeholder:text-gray-400 disabled:bg-gray-50 disabled:text-gray-500 disabled:cursor-not-allowed"
                disabled={loading}
                maxLength={6}
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

          {/* 新密码输入 */}
          <div className="mb-5">
            <label htmlFor="newPassword" className="block mb-1.5 text-sm font-medium text-gray-700">
              新密码
            </label>
            <div className="relative flex items-center">
              <Lock size={18} className="absolute left-4 text-gray-400 z-[1] pointer-events-none" />
              <input
                id="newPassword"
                name="newPassword"
                type={showPassword ? 'text' : 'password'}
                value={formData.newPassword}
                onChange={handleInputChange}
                placeholder="请输入新密码"
                className="w-full py-3 px-4 pl-12 pr-12 border-2 border-gray-200 rounded-lg text-base transition-all box-border min-h-12 bg-white focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10 placeholder:text-gray-400 disabled:bg-gray-50 disabled:text-gray-500 disabled:cursor-not-allowed"
                disabled={loading}
              />
              <button
                type="button"
                className="absolute right-4 bg-transparent border-none text-gray-400 cursor-pointer p-1 rounded transition-all flex items-center justify-center min-w-6 min-h-6 hover:text-gray-600 hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-50"
                onClick={() => setShowPassword(!showPassword)}
                disabled={loading}
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          {/* 确认密码输入 */}
          <div className="mb-5">
            <label htmlFor="confirmPassword" className="block mb-1.5 text-sm font-medium text-gray-700">
              确认密码
            </label>
            <div className="relative flex items-center">
              <Lock size={18} className="absolute left-4 text-gray-400 z-[1] pointer-events-none" />
              <input
                id="confirmPassword"
                name="confirmPassword"
                type={showConfirmPassword ? 'text' : 'password'}
                value={formData.confirmPassword}
                onChange={handleInputChange}
                placeholder="请再次输入新密码"
                className="w-full py-3 px-4 pl-12 pr-12 border-2 border-gray-200 rounded-lg text-base transition-all box-border min-h-12 bg-white focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10 placeholder:text-gray-400 disabled:bg-gray-50 disabled:text-gray-500 disabled:cursor-not-allowed"
                disabled={loading}
              />
              <button
                type="button"
                className="absolute right-4 bg-transparent border-none text-gray-400 cursor-pointer p-1 rounded transition-all flex items-center justify-center min-w-6 min-h-6 hover:text-gray-600 hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-50"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                disabled={loading}
              >
                {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          {/* 错误信息 */}
          {error && (
            <div className="text-red-500 text-sm my-4 p-3 bg-red-50 border border-red-200 rounded-lg leading-relaxed">
              {error}
            </div>
          )}

          {/* 提交按钮 */}
          <button
            type="submit"
            className="w-full bg-blue-500 text-white border-none py-3.5 px-6 rounded-lg text-base font-medium cursor-pointer transition-all mt-2 min-h-[52px] hover:bg-blue-600 hover:-translate-y-0.5 hover:shadow-lg hover:shadow-blue-500/30 active:translate-y-0 disabled:bg-gray-400 disabled:cursor-not-allowed disabled:transform-none disabled:shadow-none focus:outline-none focus:ring-2 focus:ring-blue-700 focus:ring-offset-2"
            disabled={loading}
          >
            {loading ? '提交中...' : '重置密码'}
          </button>
        </form>
      </div>
    </div>
  );

  // 使用 Portal 渲染到 body，避免父组件样式影响
  return createPortal(modalContent, document.body);
}
