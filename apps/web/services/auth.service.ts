import { api } from './api';
import { User } from '@/types';

interface LoginCredentials {
  username: string;
  password: string;
}

interface LoginResponse {
  accessToken: string;
  user: User;
}

interface RefreshResponse {
  accessToken: string;
  user: User;
}

export const authService = {
  async login(credentials: LoginCredentials): Promise<LoginResponse> {
    return api.post<LoginResponse>('/auth/login', credentials, { requireAuth: false });
  },

  async refreshToken(refreshToken: string): Promise<RefreshResponse> {
    return api.post<RefreshResponse>('/auth/refresh', { refreshToken }, { requireAuth: false });
  },

  async logout(refreshToken: string): Promise<void> {
    return api.post('/auth/logout', { refreshToken });
  },

  async getProfile(): Promise<User> {
    return api.get<User>('/auth/me');
  },
};
