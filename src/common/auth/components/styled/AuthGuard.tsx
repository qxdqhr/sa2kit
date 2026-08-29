'use client';

import React, { useEffect, useState } from 'react';
import { useAuthContext } from '../../context/AuthProvider';
import type { AuthGuardProps } from '../types';
import { LoginModal } from './LoginModal';
import { RegisterModal } from './RegisterModal';
import { AuthGateFallback, AuthLoadingGate } from '../../../ui/auth';

export function AuthGuard({ children, fallback, requireAuth = true }: AuthGuardProps) {
  const { isAuthenticated, loading, refreshSession } = useAuthContext();
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [showRegisterModal, setShowRegisterModal] = useState(false);
  const [sessionRefreshing, setSessionRefreshing] = useState(false);

  useEffect(() => {
    if (isAuthenticated) {
      setShowLoginModal(false);
      setShowRegisterModal(false);
      setSessionRefreshing(false);
      return;
    }

    if (!loading && requireAuth && !isAuthenticated && !sessionRefreshing) {
      setShowLoginModal(true);
      setShowRegisterModal(false);
    }
  }, [loading, requireAuth, isAuthenticated, sessionRefreshing]);

  useEffect(() => {
    if (sessionRefreshing && !loading && !isAuthenticated) {
      setSessionRefreshing(false);
      setShowLoginModal(true);
    }
  }, [sessionRefreshing, loading, isAuthenticated]);

  const handleAuthSuccess = async () => {
    setSessionRefreshing(true);
    setShowLoginModal(false);
    setShowRegisterModal(false);
    await refreshSession();
  };

  if (loading || sessionRefreshing) {
    return <AuthLoadingGate />;
  }

  if (requireAuth && !isAuthenticated) {
    return (
      <>
        {fallback ?? (
          <AuthGateFallback
            onLogin={() => {
              setShowRegisterModal(false);
              setShowLoginModal(true);
            }}
            onRegister={() => {
              setShowLoginModal(false);
              setShowRegisterModal(true);
            }}
          />
        )}
        <LoginModal
          isOpen={showLoginModal}
          onClose={() => setShowLoginModal(false)}
          onSuccess={handleAuthSuccess}
          onSwitchToRegister={() => {
            setShowLoginModal(false);
            setShowRegisterModal(true);
          }}
        />
        <RegisterModal
          isOpen={showRegisterModal}
          onClose={() => setShowRegisterModal(false)}
          onSuccess={handleAuthSuccess}
          onSwitchToLogin={() => {
            setShowRegisterModal(false);
            setShowLoginModal(true);
          }}
        />
      </>
    );
  }

  return <>{children}</>;
}
