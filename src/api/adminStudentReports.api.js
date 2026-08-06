import api from './axios';

// Admin/Sub-admin only — mounted at /api/admin/students, separate from the
// regular /api/students CRUD (src/api/students.js). See backend
// admin.student.routes.js for the full query-param reference.

export const getAdminStudentStatsAPI = () => api.get('/admin/students/stats');

// filters: { fromDate, toDate, classId } — dates default to the current month.
export const getStudentFreeDaysReportAPI = (params = {}) =>
  api.get('/admin/students/free-days-report', { params });

// filters: { order: 'asc'|'desc', fromDate, toDate }
export const getStudentAttendanceRankingAPI = (params = {}) =>
  api.get('/admin/students/attendance-ranking', { params });

export const getRedFlaggedStudentsAPI = () => api.get('/admin/students/red-flagged');

// Same filters as the main student list (search, status, className, section,
// gender, admissionYear, dateFrom, dateTo, ...) minus pagination — returns a
// flat, unpaginated array capped at 10,000 rows.
export const exportStudentsAPI = (params = {}) =>
  api.get('/admin/students/export', { params });
