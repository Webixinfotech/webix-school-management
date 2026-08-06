import api from './axios';
import { API_ORIGIN } from '../utils/photoUtils';

// Uses the shared axios instance (src/api/axios.js) so baseURL correctly
// respects VITE_API_URL instead of a hardcoded production URL — paths here
// are relative to that instance's baseURL (".../api"), so every call is
// prefixed with "/teachers".

export const teacherService = {
  // Queries
  getAll: (params) => api.get('/teachers', { params }).then(res => res.data),
  getById: (id) => api.get(`/teachers/${id}`).then(res => res.data),
  getMyProfile: () => api.get('/teachers/my-profile').then(res => res.data),

  // Mutations
  create: (formData) => api.post('/teachers', formData).then(res => res.data),
  updateBasic: (id, data) => api.put(`/teachers/${id}`, data).then(res => res.data),
  // NOTE: backend has no dedicated "/employment" sub-route — PUT /:id already
  // whitelists all employment fields (employeeType, fixedShift, fixedHours,
  // monthlySalary, extraHourlyRate, holidayCalendar) via teacher.service.js's
  // updateTeacher, so this reuses the same endpoint as updateBasic.
  updateEmployment: (id, data) => api.put(`/teachers/${id}`, data).then(res => res.data),
  updatePermissions: (id, permissions) => api.put(`/teachers/${id}/permissions`, { permissions }).then(res => res.data),
  updatePhoto: (id, file) => {
    const formData = new FormData();
    formData.append('photo', file);
    return api.put(`/teachers/${id}/photo`, formData, { headers: { 'Content-Type': 'multipart/form-data' }}).then(res => res.data);
  },
  delete: (id) => api.delete(`/teachers/${id}`).then(res => res.data),

  // Admin Notes
  getNotes: (id) => api.get(`/teachers/${id}/notes`).then(res => res.data),
  addNote: (id, data) => api.post(`/teachers/${id}/notes`, data).then(res => res.data),
  updateNote: (id, noteId, data) => api.put(`/teachers/${id}/notes/${noteId}`, data).then(res => res.data),
  deleteNote: (id, noteId) => api.delete(`/teachers/${id}/notes/${noteId}`).then(res => res.data),

  // Admin change-password endpoint (uses auth service path). The shared `api`
  // instance already attaches the Bearer token via its request interceptor.
  changeUserPassword: (userId, newPassword) =>
    api.put(`/auth/admin/change-password/${userId}`, { newPassword }).then(res => res.data),
};

// Helper function to resolve photo URLs safely
export const getTeacherPhotoUrl = (path) => {
  if (!path) return null;
  if (path.startsWith('http')) return path;
  return `${API_ORIGIN}${path.startsWith('/') ? '' : '/'}${path}`;
};

// ─── Backward Compatibility Aliases for Older Components ───
// Taki purani files (jaise ClassesPage.jsx) bina break hue chalte rahein
export const getTeachersAPI = (params) => teacherService.getAll(params);
export const getTeacherAPI = (id) => teacherService.getById(id);
export const getMyProfileAPI = () => teacherService.getMyProfile();
export const getMyTeacherProfileAPI = () => teacherService.getMyProfile();
export const createTeacherAPI = (formData) => teacherService.create(formData);
export const updateTeacherAPI = (id, data) => teacherService.updateBasic(id, data);
export const updateTeacherPermissionsAPI = (id, permissions) => teacherService.updatePermissions(id, permissions);
export const updateTeacherPhotoAPI = (id, file) => teacherService.updatePhoto(id, file);
export const deleteTeacherAPI = (id) => teacherService.delete(id);
export const getTeacherNotesAPI = (id) => teacherService.getNotes(id);
export const addTeacherNoteAPI = (id, note, visibleToSubAdmin) => teacherService.addNote(id, { note, visibleToSubAdmin });
export const updateTeacherNoteAPI = (id, noteId, data) => teacherService.updateNote(id, noteId, data);
export const deleteTeacherNoteAPI = (id, noteId) => teacherService.deleteNote(id, noteId);
export const changeUserPasswordAPI = (userId, newPassword) => teacherService.changeUserPassword(userId, newPassword);
export const updateTeacherEmploymentAPI = (id, data) => teacherService.updateEmployment(id, data);

// Dashboard
export const getTeacherDashboardStats = () => api.get('/teachers/dashboard/stats').then(res => res.data);

// Attendance Summary
export const getEmployeeAttendanceSummary = (date) =>
  api.get('/employee-attendance/summary', { params: { date } }).then(res => res.data);

// Backwards-compatible alias
export const getTeacherDashboardAPI = () => getTeacherDashboardStats();
