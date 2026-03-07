'use client';

import React, { useEffect } from 'react';
import { useAuthStore } from '@/lib/auth-store';

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const { fetchCurrentUser, isAuthenticated } = useAuthStore();

  useEffect(() => {
    // 初回ロード時にユーザー情報を取得
    if (!isAuthenticated) {
      fetchCurrentUser();
    }
  }, [fetchCurrentUser, isAuthenticated]);

  return <>{children}</>;
}