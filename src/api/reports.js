import axios from './axios';

// `axios` here is already the shared, fully-configured instance (baseURL =
// VITE_API_URL, Bearer token interceptor) from src/api/axios.js — paths below
// are relative to it. Do NOT re-prepend a BASE_URL string; doing so used to
// break when VITE_API_URL was unset (producing a literal "undefined/..." URL).

// ─── Classes API ──────────────────────────────────────────────────────────────
export const fetchActiveClasses = async () => {
  const { data } = await axios.get('/classes', { params: { status: 'Active', limit: 100 } });
  return data.data || [];
};

// ─── Attendance Summary API ───────────────────────────────────────────────────
export const fetchDailyAttendanceSummary = async (date) => {
  const { data } = await axios.get('/attendance/summary/daily', { params: { date } });
  return data.data || { summary: {}, classWise: [] };
};

// ─── Present Students API ─────────────────────────────────────────────────────
export const fetchPresentStudents = async (date, classId = null) => {
  const params = { date, sessionLabel: 'FULL_DAY', status: 'Present', limit: 200 };
  if (classId) params.classId = classId;
  const { data } = await axios.get('/attendance', { params });
  return data.data || [];
};

// ─── Active Students API (for flexi hours + parent contact) ──────────────────
export const fetchActiveStudents = async (page = 1, limit = 200) => {
  const { data } = await axios.get('/students', { params: { status: 'Active', page, limit } });
  return data.data || [];
};

// ─── Students by Class ────────────────────────────────────────────────────────
export const fetchStudentsByClass = async (classId) => {
  const { data } = await axios.get(`/classes/${classId}/students`);
  return data.data || [];
};

// ─── Single Student ───────────────────────────────────────────────────────────
export const fetchStudentById = async (studentId) => {
  const { data } = await axios.get(`/students/${studentId}`);
  return data.data || null;
};

// ─── Teacher Dashboard Stats ──────────────────────────────────────────────────
export const fetchTeacherDashboardStats = async () => {
  const { data } = await axios.get('/teachers/dashboard/stats');
  return data.data || null;
};
