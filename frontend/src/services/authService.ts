import { api } from '../lib/axios';
import type { LoginRequest } from '../types';

export const authService = {
  login: (creds: LoginRequest) => api.post('/auth/login', creds).then((r) => r.data),
  logout: () => api.post('/auth/logout').then((r) => r.data),
  refreshToken: (refreshToken: string) => api.post('/auth/refresh', { refreshToken }).then((r) => r.data),
  me: () => api.get('/auth/me').then((r) => r.data),
  myActivity: (limit = 50) => api.get('/auth/my-activity', { params: { limit } }).then((r) => r.data),
};
