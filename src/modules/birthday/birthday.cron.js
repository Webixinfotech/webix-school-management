/**
 * Birthday Cron Job
 *
 * Sends push notifications to parents for upcoming student birthdays.
 * Runs daily at 8:00 AM IST.
 *
 * Schedule: "0 8 * * *"  (cron syntax: minute hour day month weekday)
 *
 * Deduplication: BirthdayNotificationLog ensures no duplicate sends per year.
 *
 * Usage — called from src/app.js after DB connects:
 *   const birthdayCron = require('./modules/birthday/birthday.cron');
 *   birthdayCron.startBirthdayNotificationCron();
 */

const cron = require("node-cron");
const birthdayService = require("./birthday.service");
const logger = require("../../config/logger");

// 8:00 AM IST daily
// If your server runs in UTC, IST = UTC+5:30, so 8:00 AM IST = 2:30 AM UTC → "30 2 * * *"
// Adjust BIRTHDAY_CRON_SCHEDULE in .env to override.
const DEFAULT_SCHEDULE =
  process.env.BIRTHDAY_CRON_SCHEDULE || "30 2 * * *";

let cronTask = null;

const startBirthdayNotificationCron = () => {
  if (cronTask) {
    logger.warn("[BirthdayCron] Cron already running, skipping re-register.");
    return;
  }

  cronTask = cron.schedule(DEFAULT_SCHEDULE, async () => {
    logger.info(
      `[BirthdayCron] Triggered at ${new Date().toISOString()}`
    );

    try {
      const result = await birthdayService.sendBirthdayNotifications();
      logger.info(
        `[BirthdayCron] Completed — sent: ${result.sent}, skipped: ${result.skipped}, failed: ${result.failed}`
      );
    } catch (err) {
      logger.error("[BirthdayCron] Fatal error:", err.message);
    }
  });

  logger.info(
    `[BirthdayCron] Birthday notification cron registered (schedule: ${DEFAULT_SCHEDULE})`
  );
};

const stopBirthdayNotificationCron = () => {
  if (cronTask) {
    cronTask.destroy();
    cronTask = null;
    logger.info("[BirthdayCron] Cron stopped.");
  }
};

module.exports = {
  startBirthdayNotificationCron,
  stopBirthdayNotificationCron,
};
