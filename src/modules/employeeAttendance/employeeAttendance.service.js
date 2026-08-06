

//------------------------New Code-------------------------

const crypto             = require('crypto');
const EmployeeAttendance = require('./employeeAttendance.model');
const Teacher            = require('../teacher/teacher.model');
const Holiday            = require('../holidayCalendar/holiday.model');
const AttendanceSettings = require('../holidayCalendar/attendanceSettings.model');
const ErrorResponse      = require('../../utils/errorResponse');
const logger             = require('../../config/logger');

// ─── CONFIG ───────────────────────────────────────────────────────────────────
const QR_WINDOW_SECONDS = 60;
const QR_SECRET = process.env.QR_SECRET || 'brainbuilder-qr-secret-change-this';

// ─── QR HELPERS ───────────────────────────────────────────────────────────────

// Uses Intl.DateTimeFormat directly rather than the `new Date(toLocaleString(...))`
// re-parse pattern, which depends on locale/ICU round-tripping correctly and
// has caused wrong-day bugs elsewhere in this codebase.
const getTodayIST = () => {
  const formatter = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Kolkata',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  });
  const parts = formatter.formatToParts(new Date());
  const year = parts.find((p) => p.type === 'year')?.value;
  const month = parts.find((p) => p.type === 'month')?.value;
  const day = parts.find((p) => p.type === 'day')?.value;
  return `${year}-${month}-${day}`;
};

// Same Intl-based approach as getTodayIST, just anchored 24h earlier — used
// by the daily auto-absent cron, which runs just after midnight IST and
// needs to mark the day that JUST ended, not the new day it's now in.
const getYesterdayIST = () => {
  const formatter = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Kolkata',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  });
  const parts = formatter.formatToParts(new Date(Date.now() - 24 * 60 * 60 * 1000));
  const year = parts.find((p) => p.type === 'year')?.value;
  const month = parts.find((p) => p.type === 'month')?.value;
  const day = parts.find((p) => p.type === 'day')?.value;
  return `${year}-${month}-${day}`;
};

const getCurrentWindow = () => {
  const now = Math.floor(Date.now() / 1000);
  return Math.floor(now / QR_WINDOW_SECONDS) * QR_WINDOW_SECONDS;
};

const generateQRToken = (windowTimestamp) =>
  crypto
    .createHmac('sha256', QR_SECRET)
    .update(`${QR_SECRET}:${windowTimestamp}`)
    .digest('hex')
    .substring(0, 16)
    .toUpperCase();

const validateQRToken = (scannedToken) => {
  const cur  = getCurrentWindow();
  const prev = cur - QR_WINDOW_SECONDS;
  if (scannedToken === generateQRToken(cur))  return { valid: true };
  if (scannedToken === generateQRToken(prev)) return { valid: true };
  return { valid: false };
};

// ─── ATTENDANCE CALCULATION HELPERS ──────────────────────────────────────────

const parseTimeOnDate = (timeStr, baseDate) => {
  const [hours, minutes] = timeStr.split(':').map(Number);
  const d = new Date(baseDate);
  d.setHours(hours, minutes, 0, 0);
  return d;
};

const calcFixedTime = (teacher, checkInTime, checkOutTime) => {
  const { entryTime, exitTime, gracePeriodMinutes, halfDayThresholdHours, extraHoursPayment } =
    teacher.fixedShift;

  const scheduledEntry = parseTimeOnDate(entryTime, checkInTime);
  let scheduledExit    = parseTimeOnDate(exitTime, checkInTime);
  // Overnight shift (e.g. entry 22:00, exit 06:00) — the exit time falls on
  // the calendar day AFTER entry. Without this, scheduledExit would land
  // before scheduledEntry on the same day, making checkout always look
  // "past scheduled exit" and inflating extraMinutes to nearly the whole
  // shift instead of just genuine overtime.
  if (scheduledExit <= scheduledEntry) {
    scheduledExit = new Date(scheduledExit.getTime() + 24 * 60 * 60 * 1000);
  }
  const graceCutoff    = new Date(scheduledEntry.getTime() + gracePeriodMinutes * 60 * 1000);

  const isLate        = checkInTime > graceCutoff;
  const lateByMinutes = isLate ? Math.floor((checkInTime - graceCutoff) / 60000) : 0;
  const totalMinutes  = Math.floor((checkOutTime - checkInTime) / 60000);
  const isHalfDay     = totalMinutes < halfDayThresholdHours * 60;

  let extraMinutes = 0;
  if (extraHoursPayment && checkOutTime > scheduledExit) {
    extraMinutes = Math.floor((checkOutTime - scheduledExit) / 60000);
  }

  let status = 'Present';
  if (isHalfDay)       status = 'Half Day';
  else if (isLate)     status = 'Late';

  return { status, isLate, isHalfDay, lateByMinutes, totalMinutes, extraMinutes };
};

const calcFixedHours = (teacher, checkInTime, checkOutTime) => {
  const { minimumHours, halfDayThresholdHours, extraHoursPayment } = teacher.fixedHours;

  const totalMinutes = Math.floor((checkOutTime - checkInTime) / 60000);
  const isHalfDay    = totalMinutes < halfDayThresholdHours * 60;

  let extraMinutes = 0;
  if (extraHoursPayment && totalMinutes > minimumHours * 60) {
    extraMinutes = totalMinutes - minimumHours * 60;
  }

  const status = isHalfDay ? 'Half Day' : 'Present';
  return { status, isLate: false, isHalfDay, lateByMinutes: 0, totalMinutes, extraMinutes };
};

// Inclusive list of YYYY-MM-DD date keys between two date keys.
const enumerateDateKeys = (startKey, endKey) => {
  const keys = [];
  let cur = new Date(`${startKey}T00:00:00Z`);
  const end = new Date(`${endKey}T00:00:00Z`);
  while (cur <= end) {
    keys.push(cur.toISOString().slice(0, 10));
    cur = new Date(cur.getTime() + 24 * 60 * 60 * 1000);
  }
  return keys;
};

const isHolidayForEmployee = async (dateKey, employeeCalendar, userId = null) => {
  // Check for user-specific holiday first
  if (userId) {
    const userHoliday = await Holiday.findOne({
      date: dateKey,
      users: userId,
    }).lean();
    if (userHoliday) return userHoliday;
  }

  // Check calendar-wide holiday
  const calendarHoliday = await Holiday.findOne({
    date: dateKey,
    applicableTo: { $in: [employeeCalendar, 'BOTH'] },
    users: { $size: 0 },
  }).lean();
  if (calendarHoliday) return calendarHoliday;

  // School-wide weekly-off (e.g. every Sunday) — checked last since a
  // specific Holiday document, if present, is more specific than the
  // recurring weekly setting. Treated identically to a holiday by every
  // caller of this helper (scanQR, scanStaticQR, getDailySummary,
  // _computeMonthlySummary) so weekly-off days stop being wrongly counted
  // as Absent, and scanning is blocked the same way it already is on a
  // real holiday.
  const settings = await AttendanceSettings.findOne({ key: 'global' }).select('weeklyOffDays').lean();
  if (settings?.weeklyOffDays?.length) {
    const dayOfWeek = new Date(`${dateKey}T00:00:00Z`).getUTCDay();
    if (settings.weeklyOffDays.includes(dayOfWeek)) {
      return { name: 'Weekly Off' };
    }
  }

  return null;
};

// ─── SERVICE ──────────────────────────────────────────────────────────────────

class EmployeeAttendanceService {

  // ── GET CURRENT QR ────────────────────────────────────────────────────────
  async getCurrentQR() {
    const window    = getCurrentWindow();
    const token     = generateQRToken(window);
    const expiresIn = QR_WINDOW_SECONDS - (Math.floor(Date.now() / 1000) % QR_WINDOW_SECONDS);
    return { qrPayload: `BB-ATT:${token}`, token, expiresIn, generatedAt: new Date() };
  }

  // ── EMPLOYEE SCANS QR ─────────────────────────────────────────────────────
  async scanQR(scannedToken, user, location = null) {

    // 1. Validate token
    if (!validateQRToken(scannedToken).valid) {
      throw new ErrorResponse('Invalid or expired QR code. Please scan the current QR on screen.', 400);
    }

    // 2. Get teacher profile
    const teacher = await Teacher.findOne({ userId: user._id })
      .select('_id employeeId name status employeeType fixedShift fixedHours holidayCalendar userId')
      .lean();

    if (!teacher)                    throw new ErrorResponse('Employee profile not found', 404);
    if (teacher.status !== 'Active') throw new ErrorResponse('Your account is inactive. Contact admin.', 403);

    const today = getTodayIST();

    // 3. Holiday check
    const holiday = await isHolidayForEmployee(today, teacher.holidayCalendar, user._id);
    if (holiday) {
      throw new ErrorResponse(`Today is a holiday: ${holiday.name}`, 400);
    }

    // 4. Check existing record
    const existing = await EmployeeAttendance.findOne({ teacherId: teacher._id, attendanceDate: today });

    // FLEXIBLE marks attendance once per day on the first scan — there is
    // no check-out flow for this type. Without this, a 2nd same-day scan
    // (accidental double-tap, re-entry) fell through to _handleCheckOut
    // below, which wrongly overwrote the correct 'Present' status using
    // calcFixedHours thresholds this role was never configured against.
    if (teacher.employeeType === 'FLEXIBLE' && existing?.checkInTime) {
      return {
        action: 'already_marked',
        message: 'Attendance already marked for today — Present',
        status: 'Present',
        checkInTime: existing.checkInTime,
      };
    }

    // Already checked out
    if (existing?.checkInTime && existing?.checkOutTime) {
      throw new ErrorResponse(
        `Attendance complete. In: ${new Date(existing.checkInTime).toLocaleTimeString('en-IN', { timeZone: 'Asia/Kolkata' })}, Out: ${new Date(existing.checkOutTime).toLocaleTimeString('en-IN', { timeZone: 'Asia/Kolkata' })}`,
        409
      );
    }

    // Second scan = check-out
    if (existing?.checkInTime && !existing?.checkOutTime) {
      return this._handleCheckOut(existing, teacher, scannedToken);
    }

    // First scan = check-in
    return this._handleCheckIn(teacher, scannedToken, today, location);
  }

  // markedBy/markedByRole default to the self-scan values so every existing
  // caller (scanQR) keeps identical behaviour; scanStaticQR passes the
  // scanning peer's identity explicitly.
  async _handleCheckIn(teacher, token, today, location, markedBy = teacher.userId, markedByRole = 'self') {
    const now = new Date();

    const record = await EmployeeAttendance.create({
      teacherId:    teacher._id,
      userId:       teacher.userId,
      employeeId:   teacher.employeeId,
      employeeName: teacher.name,
      employeeType: teacher.employeeType,
      attendanceDate: today,
      checkInTime:   now,
      checkInMethod: 'qr',
      checkInToken:  token,
      status:        'Present',
      markedBy,
      markedByRole,
      checkInLocation: location ? { lat: location.lat, lng: location.lng } : { lat: null, lng: null },
    });

    // FLEXIBLE: mark done immediately
    if (teacher.employeeType === 'FLEXIBLE') {
      logger.info(`[EMP-ATT] CHECK-IN FLEXIBLE ${teacher.employeeId} | ${today}`);
      return {
        action: 'checked_in', message: 'Attendance marked — Present',
        status: 'Present', checkInTime: record.checkInTime,
        note: 'No check-out required for your role',
      };
    }

    // FIXED_TIME: show late info at checkin itself
    let note = 'Scan QR again when you leave';
    if (teacher.employeeType === 'FIXED_TIME') {
      const { entryTime, gracePeriodMinutes } = teacher.fixedShift;
      const grace = new Date(parseTimeOnDate(entryTime, now).getTime() + gracePeriodMinutes * 60000);
      if (now > grace) {
        note = `You are ${Math.floor((now - grace) / 60000)} min late. Scan QR again when you leave.`;
      }
    }

    logger.info(`[EMP-ATT] CHECK-IN ${teacher.employeeId} | ${today} | ${teacher.employeeType}`);
    return {
      action: 'checked_in', message: 'Check-in recorded',
      checkInTime: record.checkInTime, note,
    };
  }

  async _handleCheckOut(record, teacher, token, markedBy = teacher.userId, markedByRole = 'self') {
    const now = new Date();

    let calc;
    if (teacher.employeeType === 'FIXED_TIME') {
      calc = calcFixedTime(teacher, record.checkInTime, now);
    } else {
      calc = calcFixedHours(teacher, record.checkInTime, now);
    }

    await EmployeeAttendance.findByIdAndUpdate(record._id, {
      $set: {
        checkOutTime: now, checkOutMethod: 'qr', checkOutToken: token,
        status: calc.status, isLate: calc.isLate, isHalfDay: calc.isHalfDay,
        lateByMinutes: calc.lateByMinutes, totalMinutes: calc.totalMinutes,
        extraMinutes: calc.extraMinutes,
        markedBy, markedByRole,
      },
    });

    logger.info(`[EMP-ATT] CHECK-OUT ${teacher.employeeId} | ${calc.status} | ${Math.floor(calc.totalMinutes/60)}h${calc.totalMinutes%60}m`);

    return {
      action: 'checked_out', message: `Check-out recorded — ${calc.status}`,
      status: calc.status, checkInTime: record.checkInTime, checkOutTime: now,
      totalHours: `${Math.floor(calc.totalMinutes / 60)}h ${calc.totalMinutes % 60}m`,
      extraHours: calc.extraMinutes > 0 ? `${Math.floor(calc.extraMinutes / 60)}h ${calc.extraMinutes % 60}m` : null,
      isLate: calc.isLate, isHalfDay: calc.isHalfDay, lateByMinutes: calc.lateByMinutes,
    };
  }

  // ── ADMIN: Manual Mark ────────────────────────────────────────────────────
  async manualMark(body, adminUser) {
    const { teacherId, status, attendanceDate, checkInTime, checkOutTime, remarks } = body;

    const teacher = await Teacher.findById(teacherId)
      .select('_id employeeId name status employeeType fixedShift fixedHours userId')
      .lean();

    if (!teacher) throw new ErrorResponse('Employee not found', 404);

    const dateKey = attendanceDate || getTodayIST();
    if (dateKey > getTodayIST()) {
      throw new ErrorResponse('Cannot mark attendance for a future date', 400);
    }
    if (checkInTime && checkOutTime && new Date(checkOutTime) <= new Date(checkInTime)) {
      throw new ErrorResponse('checkOutTime must be after checkInTime', 400);
    }

    // Base fields the admin is always allowed to set. Check-in/out times
    // (and the fields calculated from them) are only included below when the
    // admin actually supplies them — otherwise an existing QR-based
    // check-in/out on this record is left untouched instead of being wiped.
    const setFields = {
      teacherId: teacher._id, userId: teacher.userId,
      employeeId: teacher.employeeId, employeeName: teacher.name,
      employeeType: teacher.employeeType, attendanceDate: dateKey,
      status,
      markedBy: adminUser._id, markedByRole: adminUser.role,
      remarks: remarks || '',
    };

    if (checkInTime && checkOutTime) {
      const cin = new Date(checkInTime), cout = new Date(checkOutTime);
      // FLEXIBLE has no entry/exit thresholds to compute status/lateness
      // against, but totalMinutes should still be recorded when the admin
      // supplies both times manually — leaving it null silently dropped
      // the worked duration.
      const calcFields = teacher.employeeType === 'FIXED_TIME'
        ? calcFixedTime(teacher, cin, cout)
        : teacher.employeeType === 'FIXED_HOURS'
        ? calcFixedHours(teacher, cin, cout)
        : { totalMinutes: Math.floor((cout - cin) / 60000) };

      setFields.checkInTime = cin;
      setFields.checkOutTime = cout;
      setFields.checkInMethod = 'manual';
      setFields.checkOutMethod = 'manual';
      setFields.status = calcFields.status || status;
      setFields.isLate = calcFields.isLate || false;
      setFields.isHalfDay = calcFields.isHalfDay || false;
      setFields.lateByMinutes = calcFields.lateByMinutes || 0;
      setFields.totalMinutes = calcFields.totalMinutes || null;
      setFields.extraMinutes = calcFields.extraMinutes || 0;
    } else if (checkInTime) {
      setFields.checkInTime = new Date(checkInTime);
      setFields.checkInMethod = 'manual';
    } else if (checkOutTime) {
      setFields.checkOutTime = new Date(checkOutTime);
      setFields.checkOutMethod = 'manual';
    }

    const record = await EmployeeAttendance.findOneAndUpdate(
      { teacherId: teacher._id, attendanceDate: dateKey },
      { $set: setFields },
      { new: true, upsert: true, setDefaultsOnInsert: true }
    );

    logger.info(`[EMP-ATT] MANUAL ${teacher.employeeId} | ${dateKey} | ${record.status}`);
    return record;
  }

  // ── ADMIN: Daily Summary ──────────────────────────────────────────────────
  async getDailySummary(date) {
    const dateKey  = date || getTodayIST();
    const teachers = await Teacher.find({ status: 'Active' })
      .select('_id employeeId name employeeType holidayCalendar userId').lean();
    const records  = await EmployeeAttendance.find({ attendanceDate: dateKey }).lean();

    const recordMap = {};
    records.forEach((r) => { recordMap[String(r.teacherId)] = r; });

    const list = await Promise.all(teachers.map(async (t) => {
      const record  = recordMap[String(t._id)];
      const holiday = await isHolidayForEmployee(dateKey, t.holidayCalendar, t.userId);
      return {
        teacherId: t._id, employeeId: t.employeeId,
        employeeName: t.name, employeeType: t.employeeType,
        status: holiday ? 'Holiday' : (record?.status || 'Absent'),
        checkInTime: record?.checkInTime || null,
        checkOutTime: record?.checkOutTime || null,
        totalHours: record?.totalMinutes
          ? `${Math.floor(record.totalMinutes/60)}h ${record.totalMinutes%60}m` : null,
        isLate: record?.isLate || false, isHalfDay: record?.isHalfDay || false,
        holidayName: holiday?.name || null,
      };
    }));

    return {
      summary: {
        date: dateKey, total: teachers.length,
        present: list.filter((e) => e.status === 'Present').length,
        late:    list.filter((e) => e.status === 'Late').length,
        halfDay: list.filter((e) => e.status === 'Half Day').length,
        absent:  list.filter((e) => e.status === 'Absent').length,
        onLeave: list.filter((e) => e.status === 'Leave').length,
        holiday: list.filter((e) => e.status === 'Holiday').length,
      },
      employees: list,
    };
  }

  // ── Employee History ──────────────────────────────────────────────────────
  async getEmployeeHistory(teacherId, query, requestingUser) {
    if (requestingUser?.role === 'teacher') {
      const ownTeacher = await Teacher.findOne({ userId: requestingUser._id }).select('_id').lean();
      if (!ownTeacher || String(ownTeacher._id) !== String(teacherId)) {
        throw new ErrorResponse('Not authorized to view this attendance history', 403);
      }
    }
    const { startDate, endDate, page = 1, limit = 31 } = query;
    const filter = { teacherId };
    if (startDate || endDate) {
      filter.attendanceDate = {};
      if (startDate) filter.attendanceDate.$gte = startDate;
      if (endDate)   filter.attendanceDate.$lte = endDate;
    }
    const skip  = (Number(page) - 1) * Number(limit);
    const total = await EmployeeAttendance.countDocuments(filter);
    const data  = await EmployeeAttendance.find(filter).sort({ attendanceDate: -1 }).skip(skip).limit(Number(limit)).lean();
    const all   = await EmployeeAttendance.find(filter).lean();

    const monthlySummary = await this._computeMonthlySummary(teacherId, all, startDate, endDate);

    return {
      total, page: Number(page), pages: Math.ceil(total / Number(limit)),
      monthlySummary,
      data,
    };
  }

  // Counting only EmployeeAttendance documents that exist undercounts
  // absences — a teacher who never scans QR (and is never manually marked)
  // has NO record at all for that day, not a 'status: Absent' record. This
  // walks every calendar day in [startDate, endDate] (bounded by the
  // teacher's dateOfJoining and today) and treats any day with no record
  // and no holiday as an absence, matching what getDailySummary already
  // does for a single date.
  async _computeMonthlySummary(teacherId, records, startDate, endDate) {
    const base = {
      present:  records.filter((r) => r.status === 'Present').length,
      late:     records.filter((r) => r.status === 'Late').length,
      halfDay:  records.filter((r) => r.status === 'Half Day').length,
      absent:   records.filter((r) => r.status === 'Absent').length,
      leave:    records.filter((r) => r.status === 'Leave').length,
      holiday:  records.filter((r) => r.status === 'Holiday').length,
      totalExtraMinutes: records.reduce((s, r) => s + (r.extraMinutes || 0), 0),
    };

    // Without a bounded range there's no upper limit to stop enumerating
    // at, so fall back to counting only the records that exist — same as
    // before — rather than guessing a default window.
    if (!startDate || !endDate) return base;

    const teacher = await Teacher.findById(teacherId)
      .select('dateOfJoining holidayCalendar userId')
      .lean();
    if (!teacher) return base;

    const todayKey = getTodayIST();
    const joinKey = teacher.dateOfJoining
      ? teacher.dateOfJoining.toISOString().slice(0, 10)
      : startDate;
    const rangeStart = [startDate, joinKey].sort().pop(); // later of the two
    const rangeEnd = [endDate, todayKey].sort()[0]; // earlier — never count future days

    if (rangeStart > rangeEnd) return base;

    const recordedDates = new Set(records.map((r) => r.attendanceDate));
    let missingAbsent = 0;

    for (const dateKey of enumerateDateKeys(rangeStart, rangeEnd)) {
      if (recordedDates.has(dateKey)) continue;
      const holiday = await isHolidayForEmployee(dateKey, teacher.holidayCalendar, teacher.userId);
      if (holiday) continue;
      missingAbsent++;
    }

    return { ...base, absent: base.absent + missingAbsent };
  }

  // ── PROXY SCAN: mark another employee's attendance via their static ID-card QR ──
  // For staff without a phone: an admin-designated scanner (permission
  // canScanEmployeeQR) scans the TARGET employee's static Teacher.qrCode
  // (printed on their ID card) instead of the rotating kiosk token used by
  // scanQR. Deliberately independent of scanQR — reuses only the generic
  // _handleCheckIn/_handleCheckOut helpers, so the self-scan flow above is
  // completely unaffected by this method.
  async scanStaticQR(qrCode, scanningUser, location = null) {
    if (!qrCode || !qrCode.trim()) {
      throw new ErrorResponse('ID card QR code is required', 400);
    }

    // Not .lean() — same reasoning as auth.middleware.js's req.teacherDoc
    // lookup: a hydrated document applies the schema default for
    // permissions.attendanceViaQR even on Teacher docs saved before this
    // flag existed, instead of returning undefined.
    const teacher = await Teacher.findOne({ qrCode: qrCode.trim() })
      .select('_id employeeId name status employeeType fixedShift fixedHours holidayCalendar userId permissions.attendanceViaQR');

    if (!teacher) throw new ErrorResponse('Invalid ID card QR code', 404);
    if (teacher.status !== 'Active') {
      throw new ErrorResponse('This employee\'s account is inactive. Contact admin.', 403);
    }
    if (teacher.permissions?.attendanceViaQR !== true) {
      throw new ErrorResponse('This employee is not enabled for QR-based attendance. Contact admin.', 403);
    }

    const today = getTodayIST();

    const holiday = await isHolidayForEmployee(today, teacher.holidayCalendar, teacher.userId);
    if (holiday) {
      throw new ErrorResponse(`Today is a holiday: ${holiday.name}`, 400);
    }

    const existing = await EmployeeAttendance.findOne({ teacherId: teacher._id, attendanceDate: today });

    const markedBy = scanningUser._id;
    const markedByRole = String(scanningUser._id) === String(teacher.userId) ? 'self' : 'peer';

    if (teacher.employeeType === 'FLEXIBLE' && existing?.checkInTime) {
      return {
        action: 'already_marked',
        message: `Attendance already marked for today — Present (${teacher.name})`,
        status: 'Present',
        checkInTime: existing.checkInTime,
        employeeName: teacher.name,
        employeeId: teacher.employeeId,
      };
    }

    if (existing?.checkInTime && existing?.checkOutTime) {
      throw new ErrorResponse(
        `Attendance complete for ${teacher.name}. In: ${new Date(existing.checkInTime).toLocaleTimeString('en-IN', { timeZone: 'Asia/Kolkata' })}, Out: ${new Date(existing.checkOutTime).toLocaleTimeString('en-IN', { timeZone: 'Asia/Kolkata' })}`,
        409
      );
    }

    let result;
    if (existing?.checkInTime && !existing?.checkOutTime) {
      result = await this._handleCheckOut(existing, teacher, qrCode.trim(), markedBy, markedByRole);
    } else {
      result = await this._handleCheckIn(teacher, qrCode.trim(), today, location, markedBy, markedByRole);
    }

    logger.info(`[EMP-ATT] PROXY-SCAN ${teacher.employeeId} | by ${scanningUser._id} | ${markedByRole}`);
    return { ...result, employeeName: teacher.name, employeeId: teacher.employeeId };
  }

  // ── DAILY CRON: persist "Absent" for anyone who never scanned ─────────────
  // Runs once/day (see employeeAttendance.cron.js) just after midnight IST,
  // for the day that just ended. Only ever CREATES a missing record — an
  // employee who already has any record for that day (Present/Late/Leave/
  // manually marked/etc.) is left untouched, and admin can still correct a
  // wrongly-created Absent record afterwards via the existing manualMark
  // upsert. Holiday / weekly-off days and days before an employee's
  // dateOfJoining are skipped entirely.
  async autoMarkAbsentForYesterday() {
    const dateKey = getYesterdayIST();
    const teachers = await Teacher.find({ status: 'Active' })
      .select('_id employeeId name employeeType holidayCalendar userId dateOfJoining')
      .lean();

    let created = 0, skippedHoliday = 0, skippedExisting = 0, skippedNotJoined = 0;

    for (const t of teachers) {
      if (t.dateOfJoining && t.dateOfJoining.toISOString().slice(0, 10) > dateKey) {
        skippedNotJoined++;
        continue;
      }

      const holiday = await isHolidayForEmployee(dateKey, t.holidayCalendar, t.userId);
      if (holiday) {
        skippedHoliday++;
        continue;
      }

      const existing = await EmployeeAttendance.findOneAndUpdate(
        { teacherId: t._id, attendanceDate: dateKey },
        {
          $setOnInsert: {
            teacherId: t._id,
            userId: t.userId,
            employeeId: t.employeeId,
            employeeName: t.name,
            employeeType: t.employeeType,
            attendanceDate: dateKey,
            status: 'Absent',
            markedByRole: 'system',
          },
        },
        { upsert: true, new: false, setDefaultsOnInsert: true },
      );

      if (existing === null) created++; else skippedExisting++;
    }

    const summary = { dateKey, total: teachers.length, created, skippedHoliday, skippedExisting, skippedNotJoined };
    logger.info(`[EMP-ATT] AUTO-ABSENT ${dateKey} | ${JSON.stringify(summary)}`);
    return summary;
  }

  // ── Delete Record ─────────────────────────────────────────────────────────
  async deleteRecord(recordId) {
    const record = await EmployeeAttendance.findByIdAndDelete(recordId);
    if (!record) throw new ErrorResponse('Attendance record not found', 404);
    logger.info(`[EMP-ATT] DELETED ${recordId}`);
    return record;
  }
}

module.exports = new EmployeeAttendanceService();


//------------------------End of New Code-------------------------//