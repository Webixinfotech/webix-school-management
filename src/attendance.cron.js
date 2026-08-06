
//========New code after refactor========

const cron = require('node-cron');
const CenterSession  = require('./modules/attendance/centerSession.model');
const Student  = require('./modules/student/student.model');
const logger         = require('./config/logger');
const attendanceService = require('./modules/attendance/attendance.service');

// ─── CRON 1: Every minute — Auto-mark class attendance for checked-in students
// Logic:
//   - Find all students with ACTIVE center session right now
//   - For each student, check if any assigned class is currently running
//   - If yes and not already marked → mark Present (method: system)
//   - Also auto-close checkOutTime for classes that have ended
// ─────────────────────────────────────────────────────────────────────────────
const startAutoClassAttendanceCron = () => {
  cron.schedule('* * * * *', async () => {
    try {
      const dateKey = attendanceService.getISTDateKey();

      // 1. Find all active center sessions today
      const activeSessions = await CenterSession.find({
        status:  'ACTIVE',
        dateKey: dateKey,
      }).lean();

      if (activeSessions.length === 0) return;

      // 2. For each active session → auto-mark running classes
      let totalMarked = 0;
      for (const session of activeSessions) {
        const student = await Student.findById(session.studentId)
          .select('classIds classTimings firstName lastName admissionNo qrCode parentUserId status')
          .lean();

        if (!student || student.status !== 'Active') continue;

        const marked = await attendanceService.autoMarkClassAttendance(
          student, dateKey, session.studentId // use studentId as systemUserId placeholder
        );
        totalMarked += marked.length;
      }

      // 3. Auto-close checkOutTime for classes that have ended
      const closed = await attendanceService.autoCloseClassAttendance(dateKey);

      if (totalMarked > 0 || closed > 0) {
        logger.info(`[CRON-1MIN] Auto-marked: ${totalMarked} class records | Auto-closed: ${closed} checkouts`);
      }
    } catch (err) {
      logger.error('[CRON-1MIN] Auto class attendance failed:', err.message, err.stack);
    }
  });
};

// STEP 1C: Use shared function from attendance.service, IST-safe via getCurrentISTTime
// ─── CRON 2: Every 10 minutes — Safety-net for auto checkout (calls shared function)
const startAutoCheckoutCron = () => {
  cron.schedule('*/10 * * * *', async () => {
    try {
      const dateKey = attendanceService.getISTDateKey();
      const closed = await attendanceService.autoCloseClassAttendance(dateKey);

      if (closed > 0) {
        logger.info(`[CRON-10MIN] Auto closed ${closed} checkOutTimes (safety net).`);
      }
    } catch (err) {
      logger.error('[CRON-10MIN] Auto checkout failed:', err.message);
    }
  });
};

// ─── CRON 3: Every day 8:00 PM — Close missed center sessions + flexi deduction
const startEveningSessionCleanupCron = () => {
  cron.schedule('0 20 * * *', async () => {
    try {
      logger.info('[CRON-8PM] Starting evening session cleanup...');
      const processedCount = await attendanceService.autoCloseMissedCenterSessions();
      if (processedCount > 0) {
        logger.info(`[CRON-8PM] Auto-closed ${processedCount} missed center checkouts.`);
      }
    } catch (err) {
      logger.error('[CRON-8PM] Evening cleanup failed:', err.message);
    }
  });
};

// ─── CRON 4: 1st of every month 12:00 AM — Generate invoices + credit free hours
const startMonthlyBillingCron = () => {
  cron.schedule('0 0 1 * *', async () => {
    try {
      const feeService = require('./modules/fee/fee.service');
      const ist = new Date(new Date().toLocaleString('en-US', { timeZone: 'Asia/Kolkata' }));
      const month = ist.getMonth() + 1;
      const year  = ist.getFullYear();

      logger.info(`[CRON-BILLING] Starting monthly billing for ${month}/${year}`);

      // Step 1: Credit free hours
      const credited = await feeService.creditMonthlyFreeHours();
      logger.info(`[CRON-BILLING] Free hours credited for ${credited} enrollments`);

      // Step 2: Generate invoices for all active students
      const result = await feeService.generateMonthlyInvoices(month, year);
      logger.info(`[CRON-BILLING] Invoices: ${result.success} generated, ${result.skipped} skipped, ${result.failed} failed`);

    } catch (err) {
      logger.error('[CRON-BILLING] Monthly billing failed:', err.message);
    }
  }, { timezone: 'Asia/Kolkata' });
};

module.exports = {
  startAutoClassAttendanceCron,
  startMonthlyBillingCron,
  startAutoCheckoutCron,
  startEveningSessionCleanupCron,
};