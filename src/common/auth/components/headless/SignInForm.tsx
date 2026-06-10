'use client';

import React, { useState } from 'react';
import { useAuthActions } from '../../hooks/useAuthActions';
import type { HeadlessSignInFormProps, SignInFormState } from '../types';
import { validateEmail, validatePassword, validatePhoneNumber } from '../utils';

export function SignInForm({
  authClient,
  initialMode = 'email-password',
  onSuccess,
  onError,
  children,
}: HeadlessSignInFormProps) {
  const actions = useAuthActions(authClient);
  const [mode, setMode] = useState(initialMode);
  const [step, setStep] = useState<'credentials' | 'otp'>('credentials');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
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
      if (mode === 'phone-otp') {
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
      } else if (mode === 'email-otp') {
        if (!validateEmail(email)) {
          fail('请输入正确的邮箱');
          return;
        }
        const result = await actions.sendEmailOtp(email.trim(), 'sign-in');
        if (!result.success) {
          fail(result.error);
          return;
        }
        setStep('otp');
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
      if (mode === 'email-password') {
        if (!validateEmail(email)) return fail('请输入正确的邮箱');
        const pwd = validatePassword(password);
        if (!pwd.valid) return fail(pwd.message ?? '密码无效');
        const result = await actions.signInWithEmail(email.trim(), password);
        if (!result.success) return fail(result.error);
        onSuccess?.();
        return;
      }

      if (mode === 'phone-password') {
        if (!validatePhoneNumber(phone)) return fail('请输入正确的手机号');
        const pwd = validatePassword(password);
        if (!pwd.valid) return fail(pwd.message ?? '密码无效');
        const result = await actions.signInWithPhonePassword(phone.trim(), password);
        if (!result.success) return fail(result.error);
        onSuccess?.();
        return;
      }

      if (mode === 'phone-otp') {
        if (step === 'credentials') {
          await sendOtp();
          return;
        }
        if (!/^\d{4,8}$/.test(otp)) return fail('请输入验证码');
        const result = await actions.verifyPhoneOtp(phone.trim(), otp);
        if (!result.success) return fail(result.error);
        onSuccess?.();
        return;
      }

      if (mode === 'email-otp') {
        if (step === 'credentials') {
          await sendOtp();
          return;
        }
        if (!/^\d{4,8}$/.test(otp)) return fail('请输入验证码');
        const result = await actions.signInWithEmailOtp(email.trim(), otp);
        if (!result.success) return fail(result.error);
        onSuccess?.();
      }
    } finally {
      setLoading(false);
    }
  };

  const state: SignInFormState = {
    mode,
    step,
    email,
    phone,
    password,
    otp,
    loading,
    error,
    setMode: (next) => {
      setMode(next);
      setStep('credentials');
      setError(null);
    },
    setEmail,
    setPhone,
    setPassword,
    setOtp,
    sendOtp,
    handleSubmit,
  };

  return <>{children(state)}</>;
}
