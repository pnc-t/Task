export interface User {
  id: string;
  email: string;
  name: string;
  avatar?: string | null;
}

// 認証レスポンス（トークンは HttpOnly Cookie で設定されるため含まない）
export interface AuthResponse {
  user: User;
  message: string;
}

export interface RegisterData {
  email: string;
  password: string;
  name: string;
}

export interface LoginData {
  email: string;
  password: string;
}