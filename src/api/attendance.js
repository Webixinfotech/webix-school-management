import api from './axios.js';
import {
  ATTENDANCE_BASE_URL,
  DEFAULT_PAGE,
  DEFAULT_PAGE_SIZE,
  FALLBACK_SESSION_LABEL
} from '../utils/attendanceConstants.js';

/**
 * Attendance API Service
 * Handles all attendance-related API calls
 */

// ============= SCAN QR CODE =============
export const scanAttendanceAPI = async (qrCode, date, sessionLabel = FALLBACK_SESSION_LABEL) => {
  const response = await api.post(`${ATTENDANCE_BASE_URL}/scan`, {
    qrCode: qrCode.trim(),
    attendanceDate: date || new Date().toISOString().split('T')[0],
    sessionLabel
  });
  return response.data;
};

// ============= MARK ATTENDANCE MANUALLY =============
export const markAttendanceAPI = async (studentId, status, date, remarks = '', sessionLabel = FALLBACK_SESSION_LABEL, options = {}) => {
  const { method = 'manual', checkInTime, checkOutTime } = options;
  const response = await api.post(`${ATTENDANCE_BASE_URL}/manual`, {
    studentId: studentId.trim(),
    status,
    attendanceDate: date || new Date().toISOString().split('T')[0],
    sessionLabel,
    remarks: remarks.trim(),
    method,
    ...(checkInTime !== undefined && checkInTime !== null && { checkInTime }),
    ...(checkOutTime !== undefined && checkOutTime !== null && { checkOutTime }),
  });
  return response.data;
};

// Backwards Compatibility Aliases
export const markAttendanceByQR = scanAttendanceAPI;
export const markAttendanceManually = markAttendanceAPI;

// Get Attendance List
export const getAttendanceList = async (filters = {}) => {
    const MAX_LIMIT = 100;
    const pageStart = filters.page || DEFAULT_PAGE;
    const requestedLimit = filters.limit || DEFAULT_PAGE_SIZE;
    const perPage = Math.min(requestedLimit, MAX_LIMIT);

    // Helper to build params for each request
    const buildParams = (page) => new URLSearchParams({
      page,
      limit: perPage,
      ...(filters.date && { date: filters.date }),
      ...(filters.dateFrom && { dateFrom: filters.dateFrom }),
      ...(filters.dateTo && { dateTo: filters.dateTo }),
      ...(filters.classId && { classId: filters.classId }),
      ...(filters.studentId && { studentId: filters.studentId }),
      ...(filters.status && { status: filters.status }),
      ...(filters.sessionLabel && { sessionLabel: filters.sessionLabel }),
      ...(filters.sessionId && { sessionId: filters.sessionId })
    });

    // If caller asked for more than MAX_LIMIT, fetch multiple pages and combine
    if (requestedLimit > MAX_LIMIT) {
      let results = [];
      let page = pageStart;
      let overallTotal = 0;
      while (results.length < requestedLimit) {
        const params = buildParams(page);
        const res = await api.get(`${ATTENDANCE_BASE_URL}?${params}`);
        // Track the backend's reported total (from the first page) so callers
        // that read `.total` still get an accurate count.
        if (page === pageStart && typeof res.data?.total === 'number') {
          overallTotal = res.data.total;
        }
        const data = res.data && (Array.isArray(res.data) ? res.data : res.data.data || res.data) || [];
        const arr = Array.isArray(data) ? data : [];
        if (arr.length === 0) break;
        results = results.concat(arr);
        if (arr.length < perPage) break; // no more pages
        page += 1;
      }
      const finalData = results.slice(0, requestedLimit);
      // IMPORTANT: always return the same shape as the single-page branch below
      // ({ success, total, page, pages, count, data }). Previously this branch
      // returned a bare array, which meant `res?.data` (used by every caller)
      // was `undefined` and attendance records silently disappeared from the UI
      // any time a caller requested limit > 100 (e.g. AttendancePage.jsx uses
      // limit: 5000) — even though the backend had returned valid data.
      return {
        success: true,
        total: overallTotal || finalData.length,
        page: pageStart,
        pages: Math.max(1, Math.ceil((overallTotal || finalData.length) / perPage)),
        count: finalData.length,
        data: finalData,
      };
    }

    const params = buildParams(pageStart);
    const response = await api.get(`${ATTENDANCE_BASE_URL}?${params}`);
    return response.data;
};

// Get Student Attendance History
export const getStudentAttendanceHistory = async (studentAdmissionNo, filters = {}) => {
  const params = new URLSearchParams({
    ...(filters.dateFrom && { dateFrom: filters.dateFrom }),
    ...(filters.dateTo && { dateTo: filters.dateTo }),
    ...(filters.page && { page: filters.page }),
    ...(filters.limit && { limit: filters.limit })
  });

  const response = await api.get(`${ATTENDANCE_BASE_URL}/student/${studentAdmissionNo}?${params}`);
  return response.data;
};

export const getStudentAttendanceRecords = async (studentId, filters = {}) => {
  const response = await getAttendanceList({
    studentId,
    ...(filters.date && { date: filters.date }),
    ...(filters.dateFrom && { dateFrom: filters.dateFrom }),
    ...(filters.dateTo && { dateTo: filters.dateTo }),
    ...(filters.limit && { limit: filters.limit }),
    ...(filters.page && { page: filters.page }),
    ...(filters.sessionLabel && { sessionLabel: filters.sessionLabel })
  });
  const data = response?.data || response;
  if (Array.isArray(data)) return data;
  if (Array.isArray(data?.data)) return data.data;
  return [];
};

// Get Daily Attendance Summary
export const getDailyAttendanceSummary = async (date) => {
  const params = new URLSearchParams({
    ...(date && { date })
  });

  const response = await api.get(`${ATTENDANCE_BASE_URL}/summary/daily?${params}`);
  return response.data;
};

// Update Attendance Record
export const updateAttendanceRecord = async (recordId, updateData) => {
  const response = await api.put(`${ATTENDANCE_BASE_URL}/${recordId}`, {
    ...(updateData.attendanceDate && { attendanceDate: updateData.attendanceDate }),
    ...(updateData.status && { status: updateData.status }),
    ...(updateData.sessionLabel && { sessionLabel: updateData.sessionLabel }),
    ...(updateData.method && { method: updateData.method }),
    ...(updateData.remarks !== undefined && { remarks: updateData.remarks }),
    ...(updateData.checkInTime !== undefined && { checkInTime: updateData.checkInTime }),
    ...(updateData.checkOutTime !== undefined && { checkOutTime: updateData.checkOutTime }),
    ...(updateData.note !== undefined && { note: updateData.note }),
  });
  return response.data;
};

// ============= CENTER TRACKING APIs =============
// These map 1:1 to the backend routes actually implemented in
// attendance.routes.js: POST /attendance/center-in and POST /attendance/center-out
export const centerCheckInAPI = async (qrCode, studentId) => {
  const requestBody = {};
  if (qrCode) requestBody.qrCode = qrCode.trim();
  if (studentId) requestBody.studentId = studentId.trim();

  const response = await api.post(`${ATTENDANCE_BASE_URL}/center-in`, requestBody);
  return response.data;
};

export const centerCheckOutAPI = async (qrCode, studentId) => {
  const requestBody = {};
  if (qrCode) requestBody.qrCode = qrCode.trim();
  if (studentId) requestBody.studentId = studentId.trim();

  const response = await api.post(`${ATTENDANCE_BASE_URL}/center-out`, requestBody);
  return response.data;
};

// NOTE: The following endpoints were previously defined here but do NOT
// exist on the backend (no matching route in attendance.routes.js), so
// calling them would always 404:
//   - GET  /attendance/center-sessions
//   - GET  /attendance/center-activity/:studentId
//   - POST /attendance/qr/generate
//   - GET  /attendance/qr/:classId
//   - GET  /attendance/export
// They were removed to avoid wiring UI to dead endpoints. If/when the
// backend adds these routes, re-add the corresponding functions here.