import axios from 'axios';

const apiClient = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001',
  headers: {
    'Content-Type': 'application/json',
  },
  // Cookie を自動送信（HttpOnly Cookie による認証に必要）
  withCredentials: true,
});

// リクエストインターセプター
// JWT は HttpOnly Cookie で自動送信されるため、手動設定不要
// CSRF保護: SameSite=strict Cookie により、クロスサイトリクエストでは
// Cookieが送信されないため、追加のCSRFトークンは不要
apiClient.interceptors.request.use(
  (config) => config,
  (error) => Promise.reject(error)
);

// レスポンスインターセプター（401エラーでログインページへリダイレクト）
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // ログインページ以外からの401エラーの場合、リダイレクト
      if (
        typeof window !== 'undefined' &&
        !window.location.pathname.startsWith('/login')
      ) {
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

export default apiClient;