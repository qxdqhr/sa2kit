'use client';

import React, { useState } from 'react';
import { useAuthActions } from '../../hooks/useAuthActions';
import type { HeadlessVerifyOtpFormProps, VerifyOtpFormState } from '../types';
import { validateEmail, validatePhoneNumber } from '../utils';

export function VerifyOtpForm({
  authClient,
  channel,
  target,
  onSuccess,
  onError,
  children,
}: HeadlessVerifyOtpFormProps) {
  const actions = useAuthActions(authClient);
  const [otp, setOtp] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fail = (message: string) => {
    setError(message);
    onError?.(message);
  };

  const resendOtp = async () => {
    setLoading(true);
    setError(null);
    try {
      if (channel === 'phone') {
        if (!validatePhoneNumber(target)) return fail('手机号无效');
        const result = await actions.sendPhoneOtp(target.trim());
        if (!result.success) fail(result.error);
      } else {
        if (!validateEmail(target)) return fail('邮箱无效');
        const result = await actions.sendEmailOtp(target.trim(), 'sign-in');
        if (!result.success) fail(result.error);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e?: React.FormEvent) => {
    e?.preventDefault();
    setLoading(true);
    setError(null);
    try {
      if (!/^\d{4,8}$/.test(otp)) return fail('请输入验证码');
      if (channel === 'phone') {
        const result = await actions.verifyPhoneOtp(target.trim(), otp);
        if (!result.success) return fail(result.error);
      } else {
        const result = await actions.signInWithEmailOtp(target.trim(), otp);
        if (!result.success) return fail(result.error);
      }
      onSuccess?.();
    } finally {
      setLoading(false);
    }
  };

  const state: VerifyOtpFormState = {
    channel,
    target,
    otp,
    loading,
    error,
    setOtp,
    resendOtp,
    handleSubmit,
  };

  return <>{children(state)}</>;
}
