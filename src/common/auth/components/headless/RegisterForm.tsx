'use client';

import React, { useState } from 'react';
import { useAuthActions } from '../../hooks/useAuthActions';
import type { HeadlessRegisterFormProps, RegisterFormHeadlessState } from '../types';
import { validateEmail, validatePassword, validatePhoneNumber } from '../utils';

export function RegisterFormHeadless({
  authClient,
  initialChannel = 'email',
  onSuccess,
  onError,
  children,
}: HeadlessRegisterFormProps) {
  const actions = useAuthActions(authClient);
  const [channel, setChannel] = useState<'email' | 'phone'>(initialChannel);
  const [step, setStep] = useState<'credentials' | 'otp'>('credentials');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [name, setName] = useState('');
  const [otp, setOtp] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fail = (message: string) => {
    setError(message);
    onError?.(message);
  };

  const sendOtp = async () => {
    setLoading(true);
    setError(null);
    try {
      if (!validatePhoneNumber(phone)) {
        fail('请输入正确的手机号');
        return;
      }
      const result = await actions.sendPhoneOtp(phone.trim());
      if (!result.success) {
        fail(result.error);
        return;
      }
      setStep('otp');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e?: React.FormEvent) => {
    e?.preventDefault();
    setLoading(true);
    setError(null);

    try {
      if (channel === 'email') {
        if (!validateEmail(email)) return fail('请输入正确的邮箱');
        const pwd = validatePassword(password);
        if (!pwd.valid) return fail(pwd.message ?? '密码无效');
        if (password !== confirmPassword) return fail('两次密码不一致');
        if (!name.trim()) return fail('请填写昵称');
        const result = await actions.signUpWithEmail(email.trim(), password, name.trim());
        if (!result.success) return fail(result.error);
        onSuccess?.();
        return;
      }

      if (step === 'credentials') {
        const pwd = validatePassword(password);
        if (!pwd.valid) return fail(pwd.message ?? '密码无效');
        if (password !== confirmPassword) return fail('两次密码不一致');
        await sendOtp();
        return;
      }

      if (!/^\d{4,8}$/.test(otp)) return fail('请输入验证码');
      const verify = await actions.verifyPhoneOtp(phone.trim(), otp);
      if (!verify.success) return fail(verify.error);
      onSuccess?.();
    } finally {
      setLoading(false);
    }
  };

  const state: RegisterFormHeadlessState = {
    channel,
    step,
    email,
    phone,
    password,
    confirmPassword,
    name,
    otp,
    loading,
    error,
    setChannel: (next) => {
      setChannel(next);
      setStep('credentials');
      setError(null);
    },
    setEmail,
    setPhone,
    setPassword,
    setConfirmPassword,
    setName,
    setOtp,
    sendOtp,
    handleSubmit,
  };

  return <>{children(state)}</>;
}
