import { FALLBACK_SESSION_LABEL, CLASS_TYPES, SESSION_TIME_BUCKETS } from './attendanceConstants.js';
import { classifyAlreadyMarked, formatElapsed } from './attendanceFlow.js';

const normalizeClassId = (value) => {
  if (value === null || value === undefined) return '';
  if (typeof value === 'object') return String(value._id || value.id || value.classId || '');
  return String(value);
};

const getClassTiming = (student = {}, classId = '') => {
  if (!student?.classTimings) return {};
  return student.classTimings[classId] || student.classTimings[classId.toString()] || {};
};

const toMinutes = (value) => {
  if (!value || typeof value !== 'string') return null;
  const match = value.trim().match(/^(\d{1,2}):(\d{2})/);
  if (!match) return null;
  const hours = Number(match[1]);
  const minutes = Number(match[2]);
  if (!Number.isFinite(hours) || !Number.isFinite(minutes)) return null;
  return hours * 60 + minutes;
};

const resolveTime = (cls, studentClassTiming) => {
  if (cls?.classType === CLASS_TYPES.FLEX_TIME) {
    return studentClassTiming?.startTime || cls?.startTime || null;
  }
  return cls?.startTime || null;
};

export function getSessionLabelForClass(cls, studentClassTiming) {
  const type = cls?.classType;
  if (type === CLASS_TYPES.HOURS_BASED) {
    return FALLBACK_SESSION_LABEL;
  }

  const startTime = type === CLASS_TYPES.FLEX_TIME
    ? studentClassTiming?.startTime || cls?.startTime || null
    : cls?.startTime || null;

  if (!startTime) {
    return FALLBACK_SESSION_LABEL;
  }

  const minutes = toMinutes(startTime);
  if (minutes === null) {
    return FALLBACK_SESSION_LABEL;
  }

  const morningThreshold = toMinutes(SESSION_TIME_BUCKETS.MORNING.before);
  const eveningThreshold = toMinutes(SESSION_TIME_BUCKETS.EVENING.from);

  if (minutes < morningThreshold) return 'MORNING';
  if (minutes < eveningThreshold) return 'AFTERNOON';
  return 'EVENING';
}

export function getActiveClasses(student, classesData = [], now = new Date()) {
  const classIds = Array.isArray(student?.classIds) ? student.classIds : [];
  const currentTime = now instanceof Date ? now : new Date(now);
  const currentMinutes = currentTime.getHours() * 60 + currentTime.getMinutes();

  const active = [];
  for (const classId of classIds) {
    const cls = (classesData || []).find((item) => normalizeClassId(item?.id || item?._id || item?.classId) === normalizeClassId(classId));
    if (!cls) continue;

    const studentClassTiming = getClassTiming(student, normalizeClassId(classId));
    const classType = cls?.classType;
    let isRunning = false;
    let timingLabel = '';

    if (classType === CLASS_TYPES.FIXED_TIME) {
      const start = cls?.startTime;
      const end = cls?.endTime;
      const startMinutes = toMinutes(start);
      const endMinutes = toMinutes(end);
      if (startMinutes !== null && endMinutes !== null && currentMinutes >= startMinutes && currentMinutes <= endMinutes) {
        isRunning = true;
        timingLabel = `${start || '—'} – ${end || '—'}`;
      }
    } else if (classType === CLASS_TYPES.FLEX_TIME) {
      const start = studentClassTiming?.startTime || cls?.startTime;
      const end = studentClassTiming?.endTime || cls?.endTime;
      const startMinutes = toMinutes(start);
      const endMinutes = toMinutes(end);
      if (startMinutes !== null && endMinutes !== null && currentMinutes >= startMinutes && currentMinutes <= endMinutes) {
        isRunning = true;
        timingLabel = `${start || '—'} – ${end || '—'}`;
      }
    } else if (classType === CLASS_TYPES.HOURS_BASED) {
      isRunning = true;
      timingLabel = 'Hours-based class';
    }

    if (!isRunning) continue;

    const sessionLabel = getSessionLabelForClass(cls, studentClassTiming);
    const item = {
      classId: normalizeClassId(classId),
      className: cls?.name || cls?.className || 'Class',
      classType,
      sessionLabel,
      isRunning,
      timingLabel,
    };

    active.push(item);
  }

  const sessionMap = new Map();
  active.forEach((entry) => {
    const key = entry.sessionLabel;
    const list = sessionMap.get(key) || [];
    list.push(entry);
    sessionMap.set(key, list);
  });

  return active.map((entry) => ({
    ...entry,
    conflict: (sessionMap.get(entry.sessionLabel) || []).length > 1
  }));
}

export function getUnmarkedClasses(activeClasses = [], todaysAttendanceRecords = []) {
  const markedClassIds = new Set(
    (todaysAttendanceRecords || [])
      .map((record) => normalizeClassId(record?.classId))
      .filter(Boolean)
  );

  return (activeClasses || []).filter((entry) => !markedClassIds.has(normalizeClassId(entry.classId)));
}

export function getClassResolutionWarning(student, currentUserRole, classesData = []) {
  if (currentUserRole === 'teacher') return null;
  const ids = Array.isArray(student?.classIds) ? student.classIds : [];
  if (ids.length <= 1) return null;
  const firstClass = (classesData || []).find((cls) => normalizeClassId(cls?.id || cls?._id || cls?.classId) === normalizeClassId(ids[0]));
  const firstClassName = firstClass?.name || firstClass?.className || 'the first assigned class';
  return `Multiple classes assigned. This scan will be recorded under "${firstClassName}" (first assigned class). For accurate per-class attendance, have ${firstClassName}'s teacher scan instead.`;
}

export function getFlexiDisplay(student, classesData = []) {
  const enrolledClasses = (classesData || []).filter((cls) => {
    const classId = normalizeClassId(cls?.id || cls?._id || cls?.classId);
    return Array.isArray(student?.classIds) && student.classIds.some((id) => normalizeClassId(id) === classId);
  });

  const paid = enrolledClasses.reduce((sum, cls) => sum + Number(getClassTiming(student, normalizeClassId(cls?.id || cls?._id || cls?.classId)).paidFlexiHours || 0), 0);
  const free = enrolledClasses.reduce((sum, cls) => sum + Number(getClassTiming(student, normalizeClassId(cls?.id || cls?._id || cls?.classId)).freeFlexiHours || 0), 0);
  const used = enrolledClasses.reduce((sum, cls) => sum + Number(getClassTiming(student, normalizeClassId(cls?.id || cls?._id || cls?.classId)).consumedFlexiHours || 0), 0);

  const hasPlan = paid > 0 || free > 0;
  const left = hasPlan ? Math.max(0, paid + free - used) : 0;
  const overstayHours = Number(student?.consumedFlexiHours) || 0;
  const hasOverstay = !hasPlan && overstayHours > 0;
  return { hasPlan, paid, free, used, left, overstayHours, hasOverstay };
}

/**
 * Single source of truth for "what time did this student check out".
 *
 * Attendance and Center Session are two separate backend collections
 * (see attendanceFlow.js) that only get merged for display. The Center
 * Session's `outTime` — what POST /attendance/center-out actually returns
 * as `data.session.outTime` — is the authoritative checkout timestamp.
 * The Attendance record's own `checkOutTime` field (if the backend sends
 * one on the record itself) is a secondary/legacy fallback only.
 *
 * Because there is no GET endpoint to list Center Sessions, a freshly
 * completed checkout is reflected immediately (without waiting on a
 * backend re-fetch) by passing a `sessionMap` — a small local cache the
 * page keeps, populated straight from the center-checkout API response.
 *
 * Priority:
 *   1. Center Session outTime  - sessionMap cache entry, or a session
 *      object the backend embedded directly on the record
 *      (record.session / record.centerSession / record.currentSession).
 *   2. Attendance checkOutTime - record.checkOutTime.
 *   3. null - student hasn't checked out.
 *
 * @param {object} record - an attendance record (table row, card, history item...)
 * @param {object} [sessionMap] - optional cache of live checkouts, keyed by
 *   `${studentId}_${dateKey}` and/or plain `${studentId}`, each value being
 *   either an ISO time string or `{ outTime }`.
 * @returns {string|null}
 */
export function getRecordCheckOut(record = {}, sessionMap = {}) {
  if (!record) return null;

  const studentId = record.studentId && typeof record.studentId === 'object'
    ? String(record.studentId._id || record.studentId.id || '')
    : String(record.studentId || '');
  const dateKey = record.attendanceDateKey
    || (typeof record.attendanceDate === 'string' ? record.attendanceDate.slice(0, 10) : '');

  const cacheEntry = (sessionMap && (sessionMap[`${studentId}_${dateKey}`] ?? sessionMap[studentId])) || null;
  const cachedOutTime = typeof cacheEntry === 'string' ? cacheEntry : cacheEntry?.outTime;
  const embeddedOutTime = record?.session?.outTime || record?.centerSession?.outTime || record?.currentSession?.outTime;
  const centerOutTime = cachedOutTime || embeddedOutTime;
  if (centerOutTime) return centerOutTime;

  if (record?.checkOutTime) return record.checkOutTime;

  return null;
}

export function describeAttendanceResult(resultType, payload = {}) {
  const name = payload?.name || 'Student';
  const time = payload?.time || '';
  const duration = payload?.duration || '';
  const hours = payload?.hours || 0;
  const minutes = payload?.minutes || 0;
  const elapsed = payload?.elapsed;
  const { withinWindow } = classifyAlreadyMarked(payload?.checkInTime || payload?.markedAt);
  const elapsedLabel = typeof elapsed === 'number' ? formatElapsed(elapsed) : '';
  const titleMap = {
    MARKED: 'Attendance marked',
    ALREADY_MARKED_RECENT: 'Attendance already recorded',
    ALREADY_MARKED_STALE: 'Attendance already recorded',
    CHECKED_IN: 'Checked in',
    ALREADY_INSIDE: 'Already inside',
    CHECKED_OUT: 'Checked out',
    INVALID_QR: 'Invalid QR',
    STUDENT_INACTIVE: 'Inactive student',
    NETWORK_ERROR: 'Connection issue'
  };

  const messageMap = {
    MARKED: `Welcome ${name}! Attendance marked successfully.`,
    ALREADY_MARKED_RECENT: `Attendance already recorded. ${name} is currently inside the center.`,
    ALREADY_MARKED_STALE: `${name} is already inside the center. Checked in at ${time || elapsedLabel || 'the recorded time'}.`,
    CHECKED_IN: `${name} has been checked in successfully.`,
    ALREADY_INSIDE: `${name} is already inside the center.`,
    CHECKED_OUT: `Checkout completed successfully. Total stay: ${duration}.`,
    INVALID_QR: 'QR code could not be recognized. Please scan a valid student QR.',
    STUDENT_INACTIVE: `${name}'s record is currently inactive — attendance can't be marked.`,
    NETWORK_ERROR: "Couldn't reach the server. Check your connection and try again."
  };

  const toneMap = {
    MARKED: 'success',
    ALREADY_MARKED_RECENT: 'info',
    ALREADY_MARKED_STALE: 'warning',
    CHECKED_IN: 'success',
    ALREADY_INSIDE: 'info',
    CHECKED_OUT: 'success',
    INVALID_QR: 'error',
    STUDENT_INACTIVE: 'warning',
    NETWORK_ERROR: 'error'
  };

  const title = titleMap[resultType] || 'Attendance update';
  let message = messageMap[resultType] || 'Attendance update completed.';

  if (resultType === 'ALREADY_MARKED_RECENT' && !withinWindow) {
    message = `${name} is already inside the center. Checked in at ${time || elapsedLabel || 'the recorded time'}.`;
  }

  if (resultType === 'MARKED' && payload?.hasPlan !== undefined) {
    const suffix = payload.hasPlan
      ? `${hours}h ${minutes}m used from available flexi hours.`
      : `${name} has exceeded available hours by ${duration} (no flexi plan on file).`;
    message = payload.hasPlan ? `${hours}h ${minutes}m used from available flexi hours.` : `${name} has exceeded available hours by ${duration} (no flexi plan on file).`;
    if (payload.hasPlan) {
      message = `${hours}h ${minutes}m used from available flexi hours.`;
    }
  }

  return { title, message, tone: toneMap[resultType] || 'info' };
}
