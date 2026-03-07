import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import apiClient from './api-client';
import { User, RegisterData, LoginData } from '@/types/auth';

// HttpOnly Cookie を使用するため、accessToken は JavaScript から直接アクセスできない
// 認証状態は fetchCurrentUser の成功/失敗で判断する
interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;

  register: (data: RegisterData) => Promise<void>;
  login: (data: LoginData) => Promise<void>;
  logout: () => Promise<void>;
  fetchCurrentUser: () => Promise<void>;
  updateUser: (updates: Partial<User>) => void;
  clearError: () => void;
  setIsLoading: (loading: boolean) => void;
}

// 認証レスポンスの型（トークンは含まない）
interface AuthResponseWithoutToken {
  user: User;
  message: string;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      isAuthenticated: false,
      isLoading: true,
      error: null,

      setIsLoading: (loading: boolean) => set({ isLoading: loading }),

      register: async (data: RegisterData) => {
        try {
          set({ isLoading: true, error: null });
          const response = await apiClient.post<AuthResponseWithoutToken>(
            '/auth/register',
            data
          );
          const { user } = response.data;

          // トークンは HttpOnly Cookie に設定されるため、localStorage は不要
          set({
            user,
            isAuthenticated: true,
            isLoading: false,
          });
        } catch (error: unknown) {
          const axiosError = error as { response?: { data?: { message?: string } } };
          const errorMessage =
            axiosError.response?.data?.message || '登録に失敗しました';
          set({ error: errorMessage, isLoading: false });
          throw error;
        }
      },

      login: async (data: LoginData) => {
        try {
          set({ isLoading: true, error: null });
          const response = await apiClient.post<AuthResponseWithoutToken>(
            '/auth/login',
            data
          );
          const { user } = response.data;

          // トークンは HttpOnly Cookie に設定されるため、localStorage は不要
          set({
            user,
            isAuthenticated: true,
            isLoading: false,
          });
        } catch (error: unknown) {
          const axiosError = error as { response?: { data?: { message?: string } } };
          const errorMessage =
            axiosError.response?.data?.message || 'ログインに失敗しました';
          set({ error: errorMessage, isLoading: false });
          throw error;
        }
      },

      logout: async () => {
        try {
          // バックエンドにログアウトリクエストを送信（Cookie をクリア）
          await apiClient.post('/auth/logout');
        } catch {
          // ログアウト失敗してもフロントエンドの状態はクリアする
          console.error('Logout request failed');
        } finally {
          set({
            user: null,
            isAuthenticated: false,
            error: null,
          });
        }
      },

      fetchCurrentUser: async () => {
        try {
          set({ isLoading: true });
          // Cookie が自動送信されるため、明示的なトークンチェック不要
          const response = await apiClient.get<User>('/auth/me');
          set({
            user: response.data,
            isAuthenticated: true,
            isLoading: false,
          });
        } catch {
          // 認証失敗（Cookie が無効または期限切れ）
          set({
            user: null,
            isAuthenticated: false,
            isLoading: false,
          });
        }
      },

      updateUser: (updates: Partial<User>) => {
        const currentUser = get().user;
        if (currentUser) {
          set({ user: { ...currentUser, ...updates } });
        }
      },

      clearError: () => set({ error: null }),
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({
        user: state.user,
        isAuthenticated: state.isAuthenticated,
      }),
      onRehydrateStorage: () => (state) => {
        // ストレージから復元後、Cookie の有効性を確認
        if (state?.isAuthenticated) {
          state.fetchCurrentUser();
        } else {
          state?.setIsLoading(false);
        }
      },
    }
  )
);
