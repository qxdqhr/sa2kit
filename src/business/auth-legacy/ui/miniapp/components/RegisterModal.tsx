'use client';

import React, { useState } from 'react';
import { View, Text, Input, Button } from '@tarojs/components';
import { useAuth } from '../../../contexts/AuthContext';
import { validatePhoneNumber, validatePassword } from '../../../utils/authUtils';
import type { RegisterModalProps } from '../../../types';

type MiniappInputEvent = {
  detail: {
    value: string;
  };
};

export default function RegisterModal({ isOpen, onClose, onSuccess, onSwitchToLogin }: RegisterModalProps) {
  const { register } = useAuth();
  const [formData, setFormData] = useState({
    phone: '',
    name: '',
    password: '',
    confirmPassword: '',
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async () => {
    setError('');
    setLoading(true);

    if (!formData.phone || !formData.password || !formData.confirmPassword) {
      setError('请填写完整信息');
      setLoading(false);
      return;
    }

    if (!validatePhoneNumber(formData.phone)) {
      setError('请输入正确的手机号');
      setLoading(false);
      return;
    }

    const passwordValidation = validatePassword(formData.password);
    if (!passwordValidation.valid) {
      setError(passwordValidation.message || '密码格式错误');
      setLoading(false);
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      setError('两次输入的密码不一致');
      setLoading(false);
      return;
    }

    const result = await register({
      phone: formData.phone,
      password: formData.password,
      name: formData.name || undefined,
    });

    if (result.success) {
      onSuccess();
    } else {
      setError(result.message || '注册失败');
    }

    setLoading(false);
  };

  return (
    <View className="auth-modal">
      <View className="auth-card">
        <View className="auth-header">
          <Text className="auth-title">用户注册</Text>
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
            name="name"
            value={formData.name}
            onInput={(e: MiniappInputEvent) => setFormData(prev => ({ ...prev, name: e.detail.value }))}
            placeholder="请输入昵称"
            type="text"
          />
          <Input
            name="password"
            value={formData.password}
            onInput={(e: MiniappInputEvent) => setFormData(prev => ({ ...prev, password: e.detail.value }))}
            placeholder="请输入密码"
            type="password"
          />
          <Input
            name="confirmPassword"
            value={formData.confirmPassword}
            onInput={(e: MiniappInputEvent) => setFormData(prev => ({ ...prev, confirmPassword: e.detail.value }))}
            placeholder="请确认密码"
            type="password"
          />
          {error && <Text className="auth-error">{error}</Text>}
          <Button className="auth-submit" loading={loading} onClick={handleSubmit}>
            {loading ? '注册中...' : '注册'}
          </Button>
          {onSwitchToLogin && (
            <Button className="auth-switch" onClick={onSwitchToLogin}>
              去登录
            </Button>
          )}
        </View>
      </View>
    </View>
  );
}
