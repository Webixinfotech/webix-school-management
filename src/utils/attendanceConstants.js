import { API_BASE_URL } from '../api/axios';

// Attendance System Constants
export const ATTENDANCE_STATUS = {
  PRESENT: 'Present',
  ABSENT: 'Absent',
  LATE: 'Late',
  LEAVE: 'Leave'
};

export const ATTENDANCE_METHODS = {
  QR_SCAN: 'qr_scan',
  MANUAL: 'manual',
  BULK: 'bulk'
};

export const ATTENDANCE_ROLES = {
  ADMIN: 'admin',
  TEACHER: 'teacher',
  PARENT: 'parent'
};

// API Base URLs — re-exported so existing imports keep working, but sourced
// from src/api/axios.js so this can't drift out of sync with the rest of the app.
export { API_BASE_URL };
export const ATTENDANCE_BASE_URL = `${API_BASE_URL}/attendance`;

// Date formats
export const DATE_FORMAT = 'YYYY-MM-DD';
export const TIME_FORMAT = 'HH:mm:ss';

// Pagination defaults
export const DEFAULT_PAGE_SIZE = 20;
export const DEFAULT_PAGE = 1;

export const SESSION_TIME_BUCKETS = {
  MORNING: { before: '12:00' },
  AFTERNOON: { from: '12:00', before: '16:00' },
  EVENING: { from: '16:00' },
};

export const CLASS_TYPES = {
  FIXED_TIME: 'FIXED_TIME',
  FLEX_TIME: 'FLEX_TIME',
  HOURS_BASED: 'HOURS_BASED',
};

export const FALLBACK_SESSION_LABEL = 'FULL_DAY';
