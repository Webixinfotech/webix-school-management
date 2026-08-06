/**
 * Employee Auto-Absent Cron Job
 *
 * Daily sweep: persists a real "Absent" EmployeeAttendance record for every
 * active employee who never scanned/was never manually marked the day
 * before, excluding holidays, configured weekly-off days, and days before
 * an employee's dateOfJoining. Runs daily at 12:30 AM IST, for the day that
 * just ended (never "today") so late check-ins/checkouts are never at risk
 * of being overwritten.
 *
 * Uses node-cron's { timezone: 'Asia/Kolkata' } option (same pattern as
 * academicSession.cron.js) so the fire time is correct regardless of the
 * host OS's timezone.
 *
 * A wrongly auto-marked Absent record can still be corrected at any time via
 * the existing admin manual-mark flow (POST /employee-attendance/manual),
 * which overwrites any existing record.
 *
 * Usage — called from src/app.js after DB connects:
 *   const employeeAttendanceCron = require('./modules/employeeAttendance/employeeAttendance.cron');
 *   employeeAttendanceCron.startAutoAbsentCron();
 */

const cron = require('node-cron');
const employeeAttendanceService = require('./employeeAttendance.service');
const logger = require('../../config/logger');

// 12:30 AM IST daily — adjust EMPLOYEE_ABSENT_CRON_SCHEDULE in .env to override.
const DEFAULT_SCHEDULE = process.env.EMPLOYEE_ABSENT_CRON_SCHEDULE || '30 0 * * *';

let cronTask = null;

const startAutoAbsentCron = () => {
  if (cronTask) {
    logger.warn('[EmployeeAbsentCron] Cron already running, skipping re-register.');
    return;
  }

  cronTask = cron.schedule(DEFAULT_SCHEDULE, async () => {
    logger.info(`[EmployeeAbsentCron] Triggered at ${new Date().toISOString()}`);
    try {
      const result = await employeeAttendanceService.autoMarkAbsentForYesterday();
      logger.info(`[EmployeeAbsentCron] Completed — ${JSON.stringify(result)}`);
    } catch (err) {
      logger.error('[EmployeeAbsentCron] Fatal error:', err.message);
    }
  }, { timezone: 'Asia/Kolkata' });

  logger.info(`[EmployeeAbsentCron] Auto-absent cron registered (schedule: ${DEFAULT_SCHEDULE})`);
};

const stopAutoAbsentCron = () => {
  if (cronTask) {
    cronTask.destroy();
    cronTask = null;
    logger.info('[EmployeeAbsentCron] Cron stopped.');
  }
};

module.exports = {
  startAutoAbsentCron,
  stopAutoAbsentCron,
};
