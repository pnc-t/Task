import { AuthProvider } from '@/components/auth/auth-provider';
import { WebSocketProvider } from '@/components/websockets/websocket-provider';
import './globals.css';

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ja">
      <body>
      <AuthProvider>
          <WebSocketProvider>
            {children}
          </WebSocketProvider>
      </AuthProvider>

      </body>
    </html>
  );
}