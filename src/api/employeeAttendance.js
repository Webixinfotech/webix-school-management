import api from './axios';

/**
 * Employee Attendance Service — Brain Builder International
 *
 * Endpoints:
 * - GET  /api/employee-attendance/qr
 * - POST /api/employee-attendance/scan
 * - POST /api/employee-attendance/scan-by-id-card
 * - GET  /api/employee-attendance/summary
 * - GET  /api/employee-attendance/summary?date=YYYY-MM-DD
 * - POST /api/employee-attendance/manual
 * - GET  /api/employee-attendance/:teacherId/history
 * - DELETE /api/employee-attendance/:recordId
 *
 * Holiday Endpoints:
 * - POST   /api/holidays
 * - GET    /api/holidays?year=&month=&applicableTo=
 * - PUT    /api/holidays/:holidayId
 * - DELETE /api/holidays/:holidayId
 * - GET    /api/holidays/weekly-off
 * - PUT    /api/holidays/weekly-off
 */

// ─── EMPLOYEE ATTENDANCE ──────────────────────────────────────────────────────

/**
 * Get current QR code token (60-second validity)
 * Access: Admin, Sub-Admin, Teacher with canDisplayStaffQR permission
 * Response: { success: true, data: { qrPayload, token, expiresIn, generatedAt } }
 */
export const getQRCode = async () => {
  const res = await api.get('/employee-attendance/qr');
  return res.data;
};

/**
 * Scan QR code for check-in/check-out
 * First scan = check-in, second scan = check-out
 * Access: All teachers
 * @param {string} token - QR token to scan
 * @param {Object} location - Optional location { lat, lng }
 * Response: { success, action, message, status, checkInTime, checkOutTime, totalHours, isLate, note }
 */
export const scanQRCode = async (token, location = null) => {
  const payload = { token };
  if (location) {
    payload.location = { lat: location.lat, lng: location.lng };
  }
  const res = await api.post('/employee-attendance/scan', payload);
  return res.data;
};

/**
 * Scan another employee's static ID-card QR (Teacher.qrCode) to mark THEIR
 * attendance — for staff without a phone. First scan = check-in, second =
 * check-out (same auto-detection as scanQRCode, just for a different person).
 * Access: Admin, or a teacher with canScanEmployeeQR permission. The scanned
 * employee must themselves have attendanceViaQR enabled.
 * @param {string} qrCode - Raw static QR string printed on the employee's ID card
 * @param {Object} location - Optional location { lat, lng }
 * Response: { success, action, message, status, checkInTime, checkOutTime, totalHours, isLate, employeeName, employeeId }
 */
export const scanEmployeeIdCard = async (qrCode, location = null) => {
  const payload = { qrCode };
  if (location) {
    payload.location = { lat: location.lat, lng: location.lng };
  }
  const res = await api.post('/employee-attendance/scan-by-id-card', payload);
  return res.data;
};

/**
 * Get daily attendance summary for all employees
 * @param {string|null} date - YYYY-MM-DD, defaults to today
 * Response: { success, data: { summary: { date, total, present, late, halfDay, absent, onLeave, holiday }, employees: [...] }
 */
export const getEmployeeAttendanceSummary = async (date = null) => {
  const params = date ? { date } : {};
  const res = await api.get('/employee-attendance/summary', { params });
  return res.data;
};

/**
 * Manually mark attendance for an employee
 * @param {Object} payload
 * @param {string} payload.teacherId        - MongoDB _id of the teacher (required)
 * @param {string} payload.status           - Present | Absent | Late | Half Day | Leave | Holiday (required)
 * @param {string} payload.attendanceDate   - YYYY-MM-DD (required)
 * @param {string} [payload.checkInTime]    - ISO timestamp e.g. "2026-04-19T03:45:00.000Z"
 * @param {string} [payload.checkOutTime]   - ISO timestamp
 * @param {string} [payload.remarks]        - Max 500 chars
 * Response: { success, message, data: { ...record } }
 */
export const markEmployeeAttendanceManual = async (payload) => {
  const res = await api.post('/employee-attendance/manual', payload);
  return res.data;
};

/**
 * Get attendance history for a specific employee (Admin view)
 * @param {string} teacherId - MongoDB _id
 * @param {Object} filters
 * @param {string} [filters.startDate] - YYYY-MM-DD
 * @param {string} [filters.endDate]   - YYYY-MM-DD
 * @param {number} [filters.page]      - default 1
 * @param {number} [filters.limit]     - default 31
 * Response: { success, total, page, pages, monthlySummary: { present, late, halfDay, absent, leave, holiday, totalExtraMinutes }, data: [...] }
 */
export const getTeacherAttendanceHistory = async (teacherId, filters = {}) => {
  const params = {
    ...(filters.startDate && { startDate: filters.startDate }),
    ...(filters.endDate   && { endDate:   filters.endDate   }),
    ...(filters.page      && { page:      filters.page      }),
    ...(filters.limit     && { limit:     filters.limit     }),
  };
  const res = await api.get(`/employee-attendance/${teacherId}/history`, { params });
  return res.data;
};

/**
 * Delete an attendance record
 * @param {string} recordId - MongoDB _id of the attendance record
 * Response: { success, message }
 */
export const deleteAttendanceRecord = async (recordId) => {
  const res = await api.delete(`/employee-attendance/${recordId}`);
  return res.data;
};

// ─── HOLIDAY CALENDAR ─────────────────────────────────────────────────────────

/**
 * Create a new holiday
 * @param {Object} payload
 * @param {string} payload.date          - YYYY-MM-DD (required)
 * @param {string} payload.name          - Holiday name (required)
 * @param {string} payload.applicableTo  - BOTH | TEACHING | NON_TEACHING (required)
 * @param {string} [payload.description] - Optional description
 * @param {boolean} [payload.isPaid]     - Default true
 * Response: { success, message, data: { ...holiday } }
 */
export const createHoliday = async (payload) => {
  const res = await api.post('/holidays', payload);
  return res.data;
};

/**
 * Get holidays list with optional filters
 * @param {Object} filters
 * @param {number} [filters.year]          - e.g. 2026
 * @param {number} [filters.month]         - 1–12
 * @param {string} [filters.applicableTo]  - BOTH | TEACHING | NON_TEACHING
 * Response: { success, count, data: [ ...holidays ] }
 */
export const getHolidays = async (filters = {}) => {
  const params = {
    ...(filters.year          && { year:          filters.year          }),
    ...(filters.month         && { month:         filters.month         }),
    ...(filters.applicableTo  && { applicableTo:  filters.applicableTo  }),
  };
  const res = await api.get('/holidays', { params });
  return res.data;
};

/**
 * Update an existing holiday
 * @param {string} holidayId - MongoDB _id
 * @param {Object} payload   - Fields to update (any subset of createHoliday payload)
 * Response: { success, message, data: { ...updatedHoliday } }
 */
export const updateHoliday = async (holidayId, payload) => {
  const res = await api.put(`/holidays/${holidayId}`, payload);
  return res.data;
};

/**
 * Delete a holiday
 * @param {string} holidayId - MongoDB _id
 * Response: { success, message }
 */
export const deleteHoliday = async (holidayId) => {
  const res = await api.delete(`/holidays/${holidayId}`);
  return res.data;
};

/**
 * Get the school-wide weekly-off days (e.g. every Sunday off for all staff)
 * Access: Admin, Teacher (read-only for teachers)
 * Response: { success, data: { weeklyOffDays: number[] (0=Sun..6=Sat), ... } }
 */
export const getWeeklyOffDays = async () => {
  const res = await api.get('/holidays/weekly-off');
  return res.data;
};

/**
 * Update the school-wide weekly-off days
 * Access: Admin only
 * @param {number[]} weeklyOffDays - e.g. [0] for Sunday off
 * Response: { success, message, data: { weeklyOffDays, ... } }
 */
export const updateWeeklyOffDays = async (weeklyOffDays) => {
  const res = await api.put('/holidays/weekly-off', { weeklyOffDays });
  return res.data;
};

// ─── HELPERS ──────────────────────────────────────────────────────────────────

export const fmtTime = (value) => {
  if (!value) return '-';
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return String(value);
  return d.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true });
};

export const fmtDate = (value) => {
  if (!value) return '-';
  const d = new Date(`${value}T00:00:00`);
  return d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
};

export const fmtMinutes = (totalMinutes) => {
  if (totalMinutes === null || totalMinutes === undefined) return '-';
  const h = Math.floor(totalMinutes / 60);
  const m = totalMinutes % 60;
  return `${h}h ${m}m`;
};

export const getStatusConfig = (status) => {
  const map = {
    Present:  { bg: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-200', dot: 'bg-emerald-500', badge: 'bg-emerald-100 text-emerald-800' },
    Absent:   { bg: 'bg-rose-50',    text: 'text-rose-700',    border: 'border-rose-200',    dot: 'bg-rose-500',    badge: 'bg-rose-100 text-rose-800'    },
    Late:     { bg: 'bg-amber-50',   text: 'text-amber-700',   border: 'border-amber-200',   dot: 'bg-amber-500',   badge: 'bg-amber-100 text-amber-800'   },
    'Half Day': { bg: 'bg-orange-50', text: 'text-orange-700', border: 'border-orange-200',  dot: 'bg-orange-500',  badge: 'bg-orange-100 text-orange-800' },
    Leave:    { bg: 'bg-sky-50',     text: 'text-sky-700',     border: 'border-sky-200',     dot: 'bg-sky-500',     badge: 'bg-sky-100 text-sky-800'     },
    'On Leave': { bg: 'bg-sky-50',   text: 'text-sky-700',     border: 'border-sky-200',     dot: 'bg-sky-500',     badge: 'bg-sky-100 text-sky-800'     },
    Holiday:  { bg: 'bg-violet-50',  text: 'text-violet-700',  border: 'border-violet-200',  dot: 'bg-violet-500',  badge: 'bg-violet-100 text-violet-800' },
  };
  return map[status] || { bg: 'bg-slate-50', text: 'text-slate-600', border: 'border-slate-200', dot: 'bg-slate-400', badge: 'bg-slate-100 text-slate-700' };
};

export default {
  getQRCode,
  scanQRCode,
  scanEmployeeIdCard,
  getEmployeeAttendanceSummary,
  markEmployeeAttendanceManual,
  getTeacherAttendanceHistory,
  deleteAttendanceRecord,
  createHoliday,
  getHolidays,
  updateHoliday,
  deleteHoliday,
  getWeeklyOffDays,
  updateWeeklyOffDays,
  fmtTime,
  fmtDate,
  fmtMinutes,
  getStatusConfig,
};