'use client';

import { useEffect } from 'react';
import { useAuthStore } from '@/lib/auth-store';
import { wsClient } from '@/lib/websocket-client';

export function WebSocketProvider({ children }: { children: React.ReactNode }) {
  const { accessToken, isAuthenticated } = useAuthStore();

  useEffect(() => {
    if (isAuthenticated && accessToken) {
      wsClient.connect(accessToken);

      return () => {
        wsClient.disconnect();
      };
    }
  }, [isAuthenticated, accessToken]);

  return <>{children}</>;
}