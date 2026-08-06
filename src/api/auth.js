import api from './axios';

// Login - supports both email and phone
export const loginAPI = (payload) =>
  api.post('/auth/login', payload);

// Get current user
export const getMeAPI = () =>
  api.get('/auth/me');

// Logout
export const logoutAPI = () =>
  api.post('/auth/logout');

// Update profile
export const updateProfileAPI = (data) =>
  api.put('/auth/update-profile', data);

// Change password
export const changePasswordAPI = (data) =>
  api.put('/auth/change-password', data);

// Get teacher profile (for permissions)
export const getTeacherProfileAPI = () =>
  api.get('/teachers/my-profile');
