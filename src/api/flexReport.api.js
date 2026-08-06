import api from './axios.js';

/**
 * Flex Report API Service
 * Handles fetching and calculating flex hours data for students.
 *
 * IMPORTANT DATA NOTES (matches backend Attendance model):
 * - checkInTime / checkOutTime are real ISO Date values, NOT "HH:MM" strings.
 * - flexiHoursDeducted is the authoritative "flexi hours consumed" value for
 *   that visit — it is computed server-side (idle time beyond the student's
 *   scheduled class, minus a 15 min grace period). We should NOT re-derive
 *   hours from checkIn/checkOut ourselves; we only use that as a fallback
 *   display of "how long they stayed", not as the billed amount.
 * - stayMinutes = total time spent at the center that visit.
 * - scheduledMinutes = the student's scheduled class duration that day.
 * - extraMinutes = idle/extra time beyond the scheduled class (before the
 *   flexi grace period is applied).
 */

// ============= HELPERS =============

// Safely turn any of: ISO date string, Date object, epoch, or "HH:MM" string
// into a JS Date. Returns null if it can't be parsed.
const toDate = (value) => {
  if (!value) return null;
  if (value instanceof Date) return isNaN(value.getTime()) ? null : value;
  const d = new Date(value);
  return isNaN(d.getTime()) ? null : d;
};

// Format a Date (or parseable value) as "HH:MM" 24h in local time — used
// internally before display formatting.
const toHHMM = (value) => {
  const d = toDate(value);
  if (!d) return null;
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
};

// Format a Date (or parseable value) as a friendly 12h clock string, e.g.
// "1:45 PM" — used for the flexi time-window display.
const toClock12 = (value) => {
  const d = toDate(value);
  if (!d) return null;
  try {
    return d.toLocaleTimeString('en-IN', { hour: 'numeric', minute: '2-digit', hour12: true });
  } catch {
    return null;
  }
};

const minutesToHours = (mins) => (typeof mins === 'number' && !isNaN(mins) ? mins / 60 : 0);

// 15 min grace period around the scheduled class window before a visit
// starts counting as "before class" / "after class" extra time. Only used
// to *split* the already-authoritative extraMinutes into before/after
// buckets for display — it never changes the billed total.
const GRACE_MINUTES = 15;

// Combine a "YYYY-MM-DD" date key with a class's "HH:mm" time string into a
// real Date, so we can compare it against actual checkIn/checkOut timestamps.
const combineDateAndTime = (dateKey, timeStr) => {
  if (!dateKey || !timeStr) return null;
  const [y, m, d] = String(dateKey).split('-').map(Number);
  const [h, min] = String(timeStr).split(':').map(Number);
  if ([y, m, d, h, min].some((n) => isNaN(n))) return null;
  return new Date(y, m - 1, d, h, min, 0, 0);
};

/**
 * Converts a decimal-hours number into a clean "Xh Ym" string for display.
 * 6.6666 -> "6h 40m", 1 -> "1h", 0.25 -> "15m", 0 -> "0m"
 * Purely a display formatter — never used for the actual billed calculation.
 */
export const formatHoursMinutes = (hoursDecimal, { showZeroHours = false } = {}) => {
  if (hoursDecimal == null || isNaN(hoursDecimal)) return '—';
  const totalMinutes = Math.round(Math.max(0, hoursDecimal) * 60);
  let h = Math.floor(totalMinutes / 60);
  let m = totalMinutes % 60;
  if (m === 60) { h += 1; m = 0; } // rounding safety
  if (h === 0 && m === 0) return showZeroHours ? '0h 0m' : '0m';
  if (h === 0) return `${m}m`;
  if (m === 0) return `${h}h`;
  return `${h}h ${m}m`;
};

/**
 * Builds a clear before-class / class-time / after-class breakdown for a
 * single visit, each carrying its real clock start/end time — so an admin
 * can see exactly when the student checked in, when class actually ran, and
 * when they checked out, not just durations.
 *
 *   - "Before class": check-in time → scheduled start (beyond a 15 min grace)
 *   - "Class time": the scheduled class window itself (not flexi, not billed)
 *   - "After class": scheduled end (beyond grace) → check-out time
 *
 * The authoritative flexiHoursDeducted from the backend is always the number
 * actually shown/billed — when a visit has both a before- and after-class
 * portion, the total is split across the two segments in proportion to their
 * real minutes, so the two numbers always add back up to the billed total.
 *
 * When the class has no fixed schedule (an hours-based / flexi-time class),
 * there is no "class time" segment — the whole checkIn→checkOut session is
 * a single flexi segment.
 */
const buildFlexiBreakdown = ({ dateKey, checkInDate, checkOutDate, classStartTime, classEndTime, flexiHours, stillCheckedIn }) => {
  const segments = []; // chronological: before -> class -> after
  if (!checkInDate) return { segments, flexiWindows: [], classTimeHours: null };

  const effectiveEnd = checkOutDate || new Date();
  const schedStart = combineDateAndTime(dateKey, classStartTime);
  const schedEnd = combineDateAndTime(dateKey, classEndTime);

  if (schedStart && schedEnd) {
    const graceStart = new Date(schedStart.getTime() - GRACE_MINUTES * 60000);
    const graceEnd = new Date(schedEnd.getTime() + GRACE_MINUTES * 60000);

    const preMinutes = checkInDate < graceStart ? Math.round((graceStart - checkInDate) / 60000) : 0;
    const postMinutes = effectiveEnd > graceEnd ? Math.round((effectiveEnd - graceEnd) / 60000) : 0;
    const totalExtraMinutes = preMinutes + postMinutes;

    // The portion of the visit that overlaps the actual scheduled class
    // window (not flexi, this is the paid/regular class time).
    const overlapStart = checkInDate > schedStart ? checkInDate : schedStart;
    const overlapEnd = effectiveEnd < schedEnd ? effectiveEnd : schedEnd;
    const classTimeMinutes = overlapEnd > overlapStart ? Math.round((overlapEnd - overlapStart) / 60000) : 0;

    let preHours = 0;
    let postHours = 0;
    if (totalExtraMinutes > 0 && flexiHours > 0) {
      // Apportion the authoritative billed total across before/after in
      // proportion to their real minutes, so they always sum back to it.
      preHours = flexiHours * (preMinutes / totalExtraMinutes);
      postHours = flexiHours * (postMinutes / totalExtraMinutes);
    }

    if (preMinutes > 0) {
      segments.push({ type: 'before', label: 'Before class', startClock: toClock12(checkInDate), endClock: toClock12(graceStart), hours: preHours });
    }
    if (classTimeMinutes > 0) {
      segments.push({ type: 'class', label: 'Class time', startClock: toClock12(overlapStart), endClock: toClock12(overlapEnd), hours: minutesToHours(classTimeMinutes) });
    }
    if (postMinutes > 0) {
      segments.push({ type: 'after', label: stillCheckedIn ? 'After class (ongoing)' : 'After class', startClock: toClock12(graceEnd), endClock: toClock12(effectiveEnd), hours: postHours });
    }

    return { segments, flexiWindows: segments.filter(s => s.type !== 'class'), classTimeHours: minutesToHours(classTimeMinutes) };
  }

  // No fixed schedule known for this visit — the whole session is flexi time.
  if (flexiHours > 0) {
    segments.push({
      type: 'flexi',
      label: stillCheckedIn ? 'Flexi session (ongoing)' : 'Flexi session',
      startClock: toClock12(checkInDate),
      endClock: toClock12(effectiveEnd),
      hours: flexiHours,
    });
  }
  return { segments, flexiWindows: segments, classTimeHours: null };
};

// ============= FETCH ATTENDANCE HISTORY (single student) =============
// Uses the dedicated backend route GET /attendance/student/:id which:
//  - accepts either the Mongo _id or the admissionNo
//  - already scopes/validates access for the logged-in user
//  - returns fully-populated records (class, teacher, marker) + a status summary
export const getAttendanceHistory = async (studentId, filters = {}) => {
  try {
    const params = {};
    if (filters.dateFrom) params.dateFrom = filters.dateFrom;
    if (filters.dateTo) params.dateTo = filters.dateTo;

    const response = await api.get(
      `/attendance/student/${encodeURIComponent(String(studentId).trim())}`,
      { params, timeout: 15000 }
    );

    const payload = response.data?.data || response.data || {};

    return {
      success: true,
      student: payload.student || null,
      summary: payload.summary || null,
      data: Array.isArray(payload.data) ? payload.data : [],
      total: payload.count ?? (Array.isArray(payload.data) ? payload.data.length : 0),
    };
  } catch (error) {
    console.error('Error fetching attendance history:', error);
    return {
      success: false,
      student: null,
      summary: null,
      data: [],
      total: 0,
      error: error.response?.data?.message || error.message,
    };
  }
};

// ============= FETCH ALL STUDENTS WITH FLEX DATA =============
export const getAllStudentsWithFlexData = async (filters = {}) => {
  try {
    const response = await api.get('/students', {
      params: {
        status: filters.status || 'Active',
        limit: filters.limit || 1000,
        page: filters.page || 1,
      },
      timeout: 15000,
    });

    // response.data is the backend envelope: { success, total, data: [...] }
    const body = response.data || {};
    const students = Array.isArray(body) ? body : (Array.isArray(body.data) ? body.data : []);

    return {
      success: true,
      data: students,
      total: body.total ?? students.length,
    };
  } catch (error) {
    console.error('Error fetching students:', error);
    return { success: false, data: [], total: 0, error: error.response?.data?.message || error.message };
  }
};

// ============= CALCULATE FLEX HOURS SUMMARY (per-student totals) =============
// This reflects the student's aggregate plan (paid/free hours purchased) vs
// aggregate consumption stored on the student document — the same source of
// truth used across the rest of the admin app.
export const calculateFlexHoursSummary = (student, classesData = []) => {
  const enrolledClassIds = new Set(student.classIds || Object.keys(student.classTimings || {}));
  const hourClasses = classesData.filter((c) => enrolledClassIds.has(c.id) || enrolledClassIds.has(c._id));

  const totalPaid = hourClasses.reduce(
    (sum, c) => sum + (student.classTimings?.[c.id]?.paidFlexiHours || student.classTimings?.[c._id]?.paidFlexiHours || 0),
    0
  );
  const totalFree = hourClasses.reduce(
    (sum, c) => sum + (student.classTimings?.[c.id]?.freeFlexiHours || student.classTimings?.[c._id]?.freeFlexiHours || 0),
    0
  );
  const totalConsumedFromClasses = hourClasses.reduce(
    (sum, c) => sum + (student.classTimings?.[c.id]?.consumedFlexiHours || student.classTimings?.[c._id]?.consumedFlexiHours || 0),
    0
  );
  const totalConsumed = totalConsumedFromClasses + (student.consumedFlexiHours || 0);

  const rawLeft = totalPaid + totalFree - totalConsumed;
  const totalLeft = Math.max(0, rawLeft);
  const hasAnyFlexi = totalPaid > 0 || totalFree > 0;
  const overstayHours = hasAnyFlexi ? Math.max(0, -rawLeft) : Number(student.consumedFlexiHours || 0);

  return {
    totalPaid,
    totalFree,
    totalConsumed,
    totalLeft,
    rawLeft,
    hasAnyFlexi,
    overstayHours,
    isLow: hasAnyFlexi && totalLeft < 6,
    hasOverstay: overstayHours > 0,
  };
};

// ============= PROCESS RAW ATTENDANCE RECORDS INTO PER-DAY HISTORY =============
// Groups by calendar date (attendanceDateKey, already "YYYY-MM-DD" on the
// backend) and produces a rich, display-ready record per visit + day totals.
export const processFlexHistory = (attendanceData = []) => {
  const historyByDate = {};

  (attendanceData || []).forEach((record) => {
    const dateKey = record.attendanceDateKey || (record.attendanceDate ? String(record.attendanceDate).split('T')[0] : null);
    if (!dateKey) return;

    if (!historyByDate[dateKey]) {
      historyByDate[dateKey] = {
        date: dateKey,
        records: [],
        totalStayHours: 0,
        totalScheduledHours: 0,
        totalBeforeClassHours: 0,
        totalAfterClassHours: 0,
        totalFlexiHours: 0,
        hasExtraStay: false,
      };
    }

    const checkInDate = toDate(record.checkInTime);
    const checkOutDate = toDate(record.checkOutTime);

    // Prefer server-computed stayMinutes; fall back to a raw diff of the
    // actual Date objects if it's missing (e.g. legacy/manual records).
    const stayMinutes = typeof record.stayMinutes === 'number'
      ? record.stayMinutes
      : (checkInDate && checkOutDate ? Math.max(0, (checkOutDate - checkInDate) / 60000) : null);

    const scheduledMinutes = typeof record.scheduledMinutes === 'number' ? record.scheduledMinutes : null;
    const extraMinutes = typeof record.extraMinutes === 'number' ? record.extraMinutes : null;

    // flexiHoursDeducted is the authoritative billed amount for this visit.
    const flexiHours = typeof record.flexiHoursDeducted === 'number' ? record.flexiHoursDeducted : 0;

    const className = record.classId?.name || record.className || 'Full Day';
    const classStartTime = record.classId?.startTime || null;
    const classEndTime = record.classId?.endTime || null;

    const stillCheckedIn = !!checkInDate && !checkOutDate;

    const { segments, flexiWindows, classTimeHours } = buildFlexiBreakdown({
      dateKey,
      checkInDate,
      checkOutDate,
      classStartTime,
      classEndTime,
      flexiHours,
      stillCheckedIn,
    });

    // Split hours purely for display: how much of the visit was the actual
    // scheduled class vs. before-class vs. after-class extra time. These
    // three always add up to the total stay.
    const beforeClassHours = segments.find(s => s.type === 'before')?.hours || 0;
    const afterClassHours = segments
      .filter(s => s.type === 'after')
      .reduce((s, seg) => s + seg.hours, 0);

    const entry = {
      id: record._id,
      className,
      sessionLabel: record.sessionLabel || 'FULL_DAY',
      status: record.status || 'Present',
      method: record.method || 'manual',
      checkInTime: checkInDate,
      checkOutTime: checkOutDate,
      checkInHHMM: toHHMM(checkInDate),
      checkOutHHMM: toHHMM(checkOutDate),
      checkInClock: toClock12(checkInDate),
      checkOutClock: checkOutDate ? toClock12(checkOutDate) : null,
      stayMinutes,
      stayHours: stayMinutes != null ? minutesToHours(stayMinutes) : null,
      scheduledMinutes,
      scheduledHours: classTimeHours != null ? classTimeHours : (scheduledMinutes != null ? minutesToHours(scheduledMinutes) : null),
      extraMinutes,
      extraHours: extraMinutes != null ? minutesToHours(extraMinutes) : null,
      flexiHoursDeducted: flexiHours,
      // Clean before/after/class-time split, all in hours, for direct display.
      beforeClassHours,
      afterClassHours,
      // Full chronological breakdown (before -> class -> after), each with
      // real clock start/end times, for the visual stay-breakdown bar.
      segments,
      // Display-only: exact clock-time window(s) the flexi hours fall in
      // (same as segments, minus the non-flexi "class time" segment).
      flexiWindows,
      isAutoCheckedOut: !!record.isAutoCheckedOut,
      checkoutSource: record.checkoutSource || null,
      remarks: record.remarks || '',
      stillCheckedIn,
    };

    historyByDate[dateKey].records.push(entry);
    if (entry.stayHours) historyByDate[dateKey].totalStayHours += entry.stayHours;
    if (entry.scheduledHours) historyByDate[dateKey].totalScheduledHours += entry.scheduledHours;
    historyByDate[dateKey].totalFlexiHours += flexiHours;
    historyByDate[dateKey].totalBeforeClassHours += beforeClassHours;
    historyByDate[dateKey].totalAfterClassHours += afterClassHours;
    if (flexiHours > 0) historyByDate[dateKey].hasExtraStay = true;
  });

  return Object.values(historyByDate).sort((a, b) => new Date(b.date) - new Date(a.date));
};

// ============= GROUP PER-DAY HISTORY INTO MONTHS (for calendar display) =============
export const formatFlexHistoryDisplay = (flexHistory = []) => {
  const byMonth = {};

  flexHistory.forEach((day) => {
    // Parse "YYYY-MM-DD" as local date, not UTC, to avoid off-by-one day bugs.
    const [y, m, d] = day.date.split('-').map(Number);
    const dateObj = new Date(y, m - 1, d);
    const monthKey = `${y}-${String(m).padStart(2, '0')}`;
    const monthName = dateObj.toLocaleDateString('en-IN', { month: 'long', year: 'numeric' });

    if (!byMonth[monthKey]) {
      byMonth[monthKey] = {
        monthKey,
        monthName,
        year: y,
        month: m, // 1-indexed
        days: [],
        totalStayHours: 0,
        totalScheduledHours: 0,
        totalBeforeClassHours: 0,
        totalAfterClassHours: 0,
        totalFlexiHours: 0,
        daysWithExtraStay: 0,
      };
    }

    byMonth[monthKey].days.push(day);
    byMonth[monthKey].totalStayHours += day.totalStayHours;
    byMonth[monthKey].totalScheduledHours += day.totalScheduledHours;
    byMonth[monthKey].totalBeforeClassHours += day.totalBeforeClassHours;
    byMonth[monthKey].totalAfterClassHours += day.totalAfterClassHours;
    byMonth[monthKey].totalFlexiHours += day.totalFlexiHours;
    if (day.hasExtraStay) byMonth[monthKey].daysWithExtraStay += 1;
  });

  return Object.values(byMonth).sort((a, b) => (b.year * 12 + b.month) - (a.year * 12 + a.month));
};

// ============= BUILD A DATE -> DAY LOOKUP MAP (for calendar grid cells) =============
export const buildCalendarMap = (flexHistory = []) => {
  const map = {};
  flexHistory.forEach((day) => { map[day.date] = day; });
  return map;
};

// ============= GENERATE EXCEL/CSV DATA FOR SUMMARY DOWNLOAD =============
export const generateFlexReportExcelData = (students, classesData = []) => {
  const headers = [
    'Student Name', 'Enrollment ID', 'Status',
    'Total Paid Hours', 'Total Free Hours', 'Total Consumed',
    'Remaining Hours', 'Extra Stay Hours', 'Last Updated',
  ];

  const rows = students.map((student) => {
    const summary = calculateFlexHoursSummary(student, classesData);
    return [
      student.name || student.fullName || '',
      student.enrollmentId || student.admissionNo || '',
      student.status || 'Active',
      formatHoursMinutes(summary.totalPaid, { showZeroHours: true }),
      formatHoursMinutes(summary.totalFree, { showZeroHours: true }),
      formatHoursMinutes(summary.totalConsumed, { showZeroHours: true }),
      formatHoursMinutes(summary.totalLeft, { showZeroHours: true }),
      formatHoursMinutes(summary.overstayHours, { showZeroHours: true }),
      new Date().toLocaleDateString('en-IN'),
    ];
  });

  return { headers, rows };
};

// ============= GENERATE CSV FOR A SINGLE STUDENT'S DAILY HISTORY =============
export const generateDailyHistoryCsvRows = (flexHistory = []) => {
  const headers = [
    'Date', 'Day', 'Class', 'Check In', 'Check Out',
    'Stay (h:m)', 'Class Time (h:m)', 'Before Class (h:m)', 'After Class (h:m)',
    'Flexi Hours Used (h:m)', 'Flexi Time Window(s)', 'Status',
  ];
  const rows = [];
  flexHistory.forEach((day) => {
    day.records.forEach((rec) => {
      const [y, m, d] = day.date.split('-').map(Number);
      const dateObj = new Date(y, m - 1, d);
      rows.push([
        dateObj.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }),
        dateObj.toLocaleDateString('en-IN', { weekday: 'short' }),
        rec.className,
        rec.checkInHHMM || '—',
        rec.checkOutHHMM || (rec.stillCheckedIn ? 'Still In' : '—'),
        rec.stayHours != null ? formatHoursMinutes(rec.stayHours, { showZeroHours: true }) : '—',
        rec.scheduledHours != null ? formatHoursMinutes(rec.scheduledHours, { showZeroHours: true }) : '—',
        formatHoursMinutes(rec.beforeClassHours, { showZeroHours: true }),
        formatHoursMinutes(rec.afterClassHours, { showZeroHours: true }),
        formatHoursMinutes(rec.flexiHoursDeducted, { showZeroHours: true }),
        rec.flexiWindows.length
          ? rec.flexiWindows.map(w => `${w.label}: ${w.startClock}-${w.endClock} (${formatHoursMinutes(w.hours)})`).join(' | ')
          : '—',
        rec.status,
      ]);
    });
  });
  return { headers, rows };
};

export default {
  getAttendanceHistory,
  getAllStudentsWithFlexData,
  calculateFlexHoursSummary,
  processFlexHistory,
  formatFlexHistoryDisplay,
  buildCalendarMap,
  generateFlexReportExcelData,
  generateDailyHistoryCsvRows,
  formatHoursMinutes,
};