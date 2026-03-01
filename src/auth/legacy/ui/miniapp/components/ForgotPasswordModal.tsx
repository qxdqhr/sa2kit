'use client';

import React, { useState } from 'react';
import { View, Text, Input, Button } from '@tarojs/components';
import { validatePhoneNumber, validatePassword } from '../../../utils/authUtils';
import type { ForgotPasswordModalProps } from '../../../types';

type MiniappInputEvent = {
  detail: {
    value: string;
  };
};

export default function ForgotPasswordModal({ isOpen, onClose, onSuccess }: ForgotPasswordModalProps) {
  const [step, setStep] = useState<'phone' | 'verify' | 'reset'>('phone');
  const [formData, setFormData] = useState({
    phone: '',
    verificationCode: '',
    newPassword: '',
    confirmPassword: '',
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const handleSendCode = async () => {
    setError('');
    setLoading(true);

    if (!validatePhoneNumber(formData.phone)) {
      setError('请输入正确的手机号');
      setLoading(false);
      return;
    }

    try {
      const response = await fetch('/api/auth/send-verification-code', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone: formData.phone }),
      });
      const data = await response.json();
      if (data.success) {
        setStep('verify');
      } else {
        setError(data.message || '发送失败');
      }
    } catch (error) {
      console.error('💥 [ForgotPasswordModal] 发送验证码异常:', error);
      setError('发送失败，请稍后重试');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyCode = () => {
    if (!formData.verificationCode) {
      setError('请输入验证码');
      return;
    }
    setStep('reset');
  };

  const handleResetPassword = async () => {
    const passwordValidation = validatePassword(formData.newPassword);
    if (!passwordValidation.valid) {
      setError(passwordValidation.message || '密码格式错误');
      return;
    }
    if (formData.newPassword !== formData.confirmPassword) {
      setError('两次输入的密码不一致');
      return;
    }

    setLoading(true);
    try {
      const response = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          phone: formData.phone,
          verificationCode: formData.verificationCode,
          newPassword: formData.newPassword,
        }),
      });
      const data = await response.json();
      if (data.success) {
        onSuccess();
      } else {
        setError(data.message || '重置失败');
      }
    } catch (error) {
      console.error('💥 [ForgotPasswordModal] 重置密码异常:', error);
      setError('重置失败，请稍后重试');
    } finally {
      setLoading(false);
    }
  };

  const renderContent = () => {
    if (step === 'phone') {
      return (
        <>
          <Input
            name="phone"
            value={formData.phone}
            onInput={(e: MiniappInputEvent) => setFormData(prev => ({ ...prev, phone: e.detail.value }))}
            placeholder="请输入手机号"
            type="text"
          />
          <Button className="auth-submit" loading={loading} onClick={handleSendCode}>
            {loading ? '发送中...' : '发送验证码'}
          </Button>
        </>
      );
    }

    if (step === 'verify') {
      return (
        <>
          <Input
            name="verificationCode"
            value={formData.verificationCode}
            onInput={(e: MiniappInputEvent) => setFormData(prev => ({ ...prev, verificationCode: e.detail.value }))}
            placeholder="请输入验证码"
            type="text"
          />
          <Button className="auth-submit" onClick={handleVerifyCode}>
            下一步
          </Button>
        </>
      );
    }

    return (
      <>
        <Input
          name="newPassword"
          value={formData.newPassword}
          onInput={(e: MiniappInputEvent) => setFormData(prev => ({ ...prev, newPassword: e.detail.value }))}
          placeholder="请输入新密码"
          type="password"
        />
        <Input
          name="confirmPassword"
          value={formData.confirmPassword}
          onInput={(e: MiniappInputEvent) => setFormData(prev => ({ ...prev, confirmPassword: e.detail.value }))}
          placeholder="请确认新密码"
          type="password"
        />
        <Button className="auth-submit" loading={loading} onClick={handleResetPassword}>
          {loading ? '提交中...' : '重置密码'}
        </Button>
      </>
    );
  };

  return (
    <View className="auth-modal">
      <View className="auth-card">
        <View className="auth-header">
          <Text className="auth-title">找回密码</Text>
          <Button className="auth-close" onClick={onClose}>
            关闭
          </Button>
        </View>
        <View className="auth-form">
          {renderContent()}
          {error && <Text className="auth-error">{error}</Text>}
        </View>
      </View>
    </View>
  );
}
