/**
 * Inventory & Library Cron Job
 *
 * Runs the due-date sweep (Section 4.12): due-soon reminders (2 days out)
 * and overdue alerts for active borrow transactions. Runs daily at
 * 8:00 AM IST.
 *
 * Usage — called from src/app.js after DB connects:
 *   const inventoryCron = require('./modules/inventory/inventory.cron');
 *   inventoryCron.startDueDateSweepCron();
 */

const cron = require('node-cron');
const lendingService = require('./lending.service');
const logger = require('../../config/logger');

const DEFAULT_SCHEDULE = process.env.INVENTORY_CRON_SCHEDULE || '30 2 * * *';

let cronTask = null;

const startDueDateSweepCron = () => {
  if (cronTask) {
    logger.warn('[InventoryCron] Cron already running, skipping re-register.');
    return;
  }

  cronTask = cron.schedule(DEFAULT_SCHEDULE, async () => {
    logger.info(`[InventoryCron] Triggered at ${new Date().toISOString()}`);
    try {
      const result = await lendingService.runDueDateSweep();
      logger.info(
        `[InventoryCron] Completed — due-soon: ${result.dueSoonCount}, overdue: ${result.overdueCount}`,
      );
    } catch (err) {
      logger.error('[InventoryCron] Fatal error:', err.message);
    }
  });

  logger.info(`[InventoryCron] Due-date sweep cron registered (schedule: ${DEFAULT_SCHEDULE})`);
};

const stopDueDateSweepCron = () => {
  if (cronTask) {
    cronTask.destroy();
    cronTask = null;
    logger.info('[InventoryCron] Cron stopped.');
  }
};

module.exports = {
  startDueDateSweepCron,
  stopDueDateSweepCron,
};
