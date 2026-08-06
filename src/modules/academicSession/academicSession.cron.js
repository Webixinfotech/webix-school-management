/**
 * Academic Session Auto-Transition Cron Job
 *
 * Daily sweep: completes the Active session once its endDate has passed,
 * and activates the next Upcoming session once its startDate has arrived
 * (if no session is Active). Runs daily at 12:30 AM IST.
 *
 * Uses node-cron's { timezone: 'Asia/Kolkata' } option (same pattern as the
 * monthly billing cron in attendance.cron.js) so the fire time is correct
 * regardless of the host OS's timezone — a bare "hour" in the cron
 * expression would otherwise be interpreted in the server's local time.
 *
 * Manual/early activation via PUT /:id/activate is unaffected — admins can
 * still activate a session ahead of its startDate at any time.
 *
 * Usage — called from src/app.js after DB connects:
 *   const academicSessionCron = require('./modules/academicSession/academicSession.cron');
 *   academicSessionCron.startAutoTransitionCron();
 */

const cron = require('node-cron');
const academicSessionService = require('./academicSession.service');
const logger = require('../../config/logger');

// 12:30 AM IST daily — interpreted in Asia/Kolkata via the schedule options below.
// Adjust ACADEMIC_SESSION_CRON_SCHEDULE in .env to override.
const DEFAULT_SCHEDULE = process.env.ACADEMIC_SESSION_CRON_SCHEDULE || '30 0 * * *';

let cronTask = null;

const startAutoTransitionCron = () => {
  if (cronTask) {
    logger.warn('[AcademicSessionCron] Cron already running, skipping re-register.');
    return;
  }

  cronTask = cron.schedule(DEFAULT_SCHEDULE, async () => {
    logger.info(`[AcademicSessionCron] Triggered at ${new Date().toISOString()}`);
    try {
      const result = await academicSessionService.autoTransitionSessions();
      logger.info(
        `[AcademicSessionCron] Completed — completedId: ${result.completedId || 'none'}, activatedId: ${result.activatedId || 'none'}`,
      );
    } catch (err) {
      logger.error('[AcademicSessionCron] Fatal error:', err.message);
    }
  }, { timezone: 'Asia/Kolkata' });

  logger.info(`[AcademicSessionCron] Auto-transition cron registered (schedule: ${DEFAULT_SCHEDULE})`);
};

const stopAutoTransitionCron = () => {
  if (cronTask) {
    cronTask.destroy();
    cronTask = null;
    logger.info('[AcademicSessionCron] Cron stopped.');
  }
};

module.exports = {
  startAutoTransitionCron,
  stopAutoTransitionCron,
};
