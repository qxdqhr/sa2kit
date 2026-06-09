'use client';

import React, { useState } from 'react';
import { View, Text, Input, Button } from '@tarojs/components';
import { useAuth } from '../../../contexts/AuthContext';
import { validatePhoneNumber } from '../../../utils/authUtils';
import type { LoginModalProps } from '../../../types';

type MiniappInputEvent = {
  detail: {
    value: string;
  };
};

export default function LoginModal({ isOpen, onClose, onSuccess, onSwitchToRegister }: LoginModalProps) {
  const { login } = useAuth();
  const [formData, setFormData] = useState({ phone: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async () => {
    setError('');
    setLoading(true);

    if (!formData.phone || !formData.password) {
      setError('请填写完整信息');
      setLoading(false);
      return;
    }

    if (!validatePhoneNumber(formData.phone)) {
      setError('请输入正确的手机号');
      setLoading(false);
      return;
    }

    const result = await login(formData);
    if (result.success) {
      onSuccess();
    } else {
      setError(result.message || '登录失败');
    }
    setLoading(false);
  };

  return (
    <View className="auth-modal">
      <View className="auth-card">
        <View className="auth-header">
          <Text className="auth-title">用户登录</Text>
          <Button className="auth-close" onClick={onClose}>
            关闭
          </Button>
        </View>
        <View className="auth-form">
          <Input
            name="phone"
            value={formData.phone}
            onInput={(e: MiniappInputEvent) => setFormData(prev => ({ ...prev, phone: e.detail.value }))}
            placeholder="请输入手机号"
            type="text"
          />
          <Input
            name="password"
            value={formData.password}
            onInput={(e: MiniappInputEvent) => setFormData(prev => ({ ...prev, password: e.detail.value }))}
            placeholder="请输入密码"
            type="password"
          />
          {error && <Text className="auth-error">{error}</Text>}
          <Button className="auth-submit" loading={loading} onClick={handleSubmit}>
            {loading ? '登录中...' : '登录'}
          </Button>
          {onSwitchToRegister && (
            <Button className="auth-switch" onClick={onSwitchToRegister}>
              去注册
            </Button>
          )}
        </View>
      </View>
    </View>
  );
}
