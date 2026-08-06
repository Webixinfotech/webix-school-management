import axios from 'axios';

const runtimeEnv = (typeof import.meta !== 'undefined' && import.meta.env) ? import.meta.env : {};
// Single source of truth for the API base URL — every other file that needs
// it (raw fetch() calls, photoUtils, attendanceConstants, etc.) should import
// this instead of redefining its own fallback, so they can't silently drift.
export const API_BASE_URL = runtimeEnv.VITE_API_URL;

const api = axios.create({
  baseURL: API_BASE_URL,
  // We use Bearer tokens from localStorage, not cookie-based auth.
  // Keeping credentials disabled avoids stricter credentialed-CORS requirements.
  withCredentials: false,
});

// Request interceptor - attach token
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Response interceptor - handle 401 (expired/invalid token OR deactivated account)
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401 && window.location.pathname !== '/login') {
      const message = error.response?.data?.message || 'Your session has expired. Please log in again.';
      // window.location.href below does a hard navigation, which unmounts React -
      // stash the message so LoginPage can show it after the redirect.
      sessionStorage.setItem('auth_notice', JSON.stringify({ type: 'error', message }));
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export default api;
