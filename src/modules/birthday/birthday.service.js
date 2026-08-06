// /**
//  * Birthday Service
//  *
//  * Core business logic for upcoming birthday queries.
//  * Reads from: Student, Teacher, User (parents), Parent
//  * Writes to:  BirthdayNotificationLog, BirthdayCardShareLog (new collections only)
//  *
//  * IMPORTANT: No modifications to existing collections.
//  */

// const Student = require("../student/student.model");
// const Teacher = require("../teacher/teacher.model");
// const User = require("../auth/user.model");
// const Parent = require("../shared/parent.model");
// const { BirthdayNotificationLog, BirthdayCardShareLog } = require("./birthday.model");
// const { NotificationLog } = require("../notification/notification.model");
// const NotificationService = require("../notification/notification.service");
// const logger = require("../../config/logger");
// const ErrorResponse = require("../../utils/errorResponse");

// const TIMEZONE = process.env.APP_TIMEZONE || "Asia/Kolkata";
// const UPCOMING_DAYS = 7;

// // ─── Helpers ─────────────────────────────────────────────────────────────────

// /**
//  * Get today's date parts in IST (day, month, year, dayOfYear).
//  */
// function getTodayIST() {
//   const now = new Date();
//   const formatter = new Intl.DateTimeFormat("en-CA", {
//     timeZone: TIMEZONE,
//     year: "numeric",
//     month: "2-digit",
//     day: "2-digit",
//   });
//   const parts = formatter.formatToParts(now);
//   const year = parseInt(parts.find((p) => p.type === "year").value, 10);
//   const month = parseInt(parts.find((p) => p.type === "month").value, 10);
//   const day = parseInt(parts.find((p) => p.type === "day").value, 10);
//   return { year, month, day };
// }

// /**
//  * Convert a DOB to { month, day } — ignores the birth year.
//  * Returns null for invalid/null DOB.
//  */
// function extractMonthDay(dob) {
//   if (!dob) return null;
//   const d = new Date(dob);
//   if (isNaN(d.getTime())) return null;
//   return { month: d.getUTCMonth() + 1, day: d.getUTCDate() };
// }

// /**
//  * Calculate how many days until the next birthday from today (IST).
//  * Handles year-end crossing. Returns 0 if birthday is TODAY.
//  * Handles Feb 29 leap-year birthdays (shown on Feb 28 or Mar 1 in non-leap years).
//  *
//  * @param {number} bMonth - birth month (1-12)
//  * @param {number} bDay   - birth day  (1-31)
//  * @returns {number|null}  days remaining (0–6) or null if not in next 7 days
//  */
// function daysUntilBirthday(bMonth, bDay, todayIST) {
//   const { year, month, day } = todayIST;

//   // Handle Feb 29 in non-leap years → treat as Feb 28
//   if (bMonth === 2 && bDay === 29) {
//     const isLeap = (y) => (y % 4 === 0 && y % 100 !== 0) || y % 400 === 0;
//     if (!isLeap(year)) {
//       bDay = 28;
//     }
//   }

//   // Build this year's birthday date as UTC midnight
//   let bdayYear = year;
//   let bdayDate = new Date(Date.UTC(bdayYear, bMonth - 1, bDay));

//   // Build today's UTC midnight
//   const todayDate = new Date(Date.UTC(year, month - 1, day));

//   // If birthday already passed this year, check next year
//   if (bdayDate < todayDate) {
//     bdayYear = year + 1;
//     // Re-handle Feb 29 for next year
//     let nextBDay = bDay;
//     if (bMonth === 2 && bDay === 29) {
//       const isLeap = (y) => (y % 4 === 0 && y % 100 !== 0) || y % 400 === 0;
//       if (!isLeap(bdayYear)) nextBDay = 28;
//       else nextBDay = 29;
//     }
//     bdayDate = new Date(Date.UTC(bdayYear, bMonth - 1, nextBDay));
//   }

//   const diffMs = bdayDate.getTime() - todayDate.getTime();
//   const diffDays = Math.round(diffMs / (1000 * 60 * 60 * 24));

//   if (diffDays < 0 || diffDays >= UPCOMING_DAYS) return null;
//   return diffDays;
// }

// /**
//  * Format a DOB date to "YYYY-MM-DD" string.
//  */
// function formatDOB(dob) {
//   if (!dob) return null;
//   const d = new Date(dob);
//   if (isNaN(d.getTime())) return null;
//   const m = String(d.getUTCMonth() + 1).padStart(2, "0");
//   const day = String(d.getUTCDate()).padStart(2, "0");
//   return `${d.getUTCFullYear()}-${m}-${day}`;
// }

// /**
//  * Format birthday date for THIS occurrence (month/day, with this/next year).
//  */
// function formatBirthdayDate(bMonth, bDay, daysRemaining, todayIST) {
//   let year = todayIST.year;
//   // If daysRemaining crosses into next year
//   const checkMonth = todayIST.month;
//   const checkDay = todayIST.day;
//   const futureDate = new Date(
//     Date.UTC(year, checkMonth - 1, checkDay + daysRemaining)
//   );
//   const mm = String(futureDate.getUTCMonth() + 1).padStart(2, "0");
//   const dd = String(futureDate.getUTCDate()).padStart(2, "0");
//   const yy = futureDate.getUTCFullYear();
//   return `${yy}-${mm}-${dd}`;
// }

// // ─── Core Service ─────────────────────────────────────────────────────────────

// const birthdayService = {
//   /**
//    * Fetch upcoming student birthdays within next 7 days.
//    * Excludes: deleted, inactive, no DOB students.
//    */
//   async getStudentBirthdays() {
//     const today = getTodayIST();

//     // Pull only the fields we need — no N+1
//     const students = await Student.find({
//       status: "Active",
//       isDeleted: { $ne: true },
//       dateOfBirth: { $ne: null, $exists: true },
//     })
//       .select(
//         "_id firstName lastName dateOfBirth photo className section rollNo admissionNo"
//       )
//       .lean();

//     const results = [];

//     for (const s of students) {
//       const md = extractMonthDay(s.dateOfBirth);
//       if (!md) continue;

//       const days = daysUntilBirthday(md.month, md.day, today);
//       if (days === null) continue;

//       results.push({
//         id: s._id,
//         name: `${s.firstName} ${s.lastName}`.trim(),
//         role: "student",
//         dob: formatDOB(s.dateOfBirth),
//         birthdayDate: formatBirthdayDate(md.month, md.day, days, today),
//         daysRemaining: days,
//         photo: s.photo || null,
//         class: s.className || "",
//         section: s.section || "",
//         rollNo: s.rollNo || "",
//         admissionNo: s.admissionNo || "",
//         department: "",
//       });
//     }

//     // Sort by nearest birthday
//     results.sort((a, b) => a.daysRemaining - b.daysRemaining);
//     return results;
//   },

//   /**
//    * Fetch upcoming staff/teacher birthdays within next 7 days.
//    * Excludes: inactive, no DOB teachers.
//    */
//   async getStaffBirthdays() {
//     const today = getTodayIST();

//     const teachers = await Teacher.find({
//       status: "Active",
//       dob: { $ne: null, $exists: true },
//     })
//       .select("_id name dob photo department employeeId subjects")
//       .lean();

//     const results = [];

//     for (const t of teachers) {
//       const md = extractMonthDay(t.dob);
//       if (!md) continue;

//       const days = daysUntilBirthday(md.month, md.day, today);
//       if (days === null) continue;

//       results.push({
//         id: t._id,
//         name: t.name,
//         role: "staff",
//         dob: formatDOB(t.dob),
//         birthdayDate: formatBirthdayDate(md.month, md.day, days, today),
//         daysRemaining: days,
//         photo: t.photo || null,
//         class: "",
//         department: t.department || t.subjects || "",
//       });
//     }

//     results.sort((a, b) => a.daysRemaining - b.daysRemaining);
//     return results;
//   },

//   /**
//    * Fetch upcoming parent birthdays within next 7 days.
//    * Parents are stored in User collection (role = 'parent').
//    * DOB field on User model: check if exists, else skip.
//    *
//    * NOTE: User model currently has no DOB field.
//    * We safely check and return empty if no DOB exists.
//    * When DOB is added to User model in the future, this will auto-work.
//    */
//   async getParentBirthdays() {
//     const today = getTodayIST();

//     // Only query if the user model has a dob field
//     // This is safe — if the field doesn't exist, the $exists filter returns nothing
//     const parents = await User.find({
//       role: "parent",
//       isActive: true,
//       dob: { $ne: null, $exists: true },
//     })
//       .select("_id name avatar dob phone")
//       .lean();

//     const results = [];

//     for (const p of parents) {
//       const md = extractMonthDay(p.dob);
//       if (!md) continue;

//       const days = daysUntilBirthday(md.month, md.day, today);
//       if (days === null) continue;

//       results.push({
//         id: p._id,
//         name: p.name,
//         role: "parent",
//         dob: formatDOB(p.dob),
//         birthdayDate: formatBirthdayDate(md.month, md.day, days, today),
//         daysRemaining: days,
//         photo: p.avatar || null,
//         class: "",
//         department: "",
//       });
//     }

//     results.sort((a, b) => a.daysRemaining - b.daysRemaining);
//     return results;
//   },

//   /**
//    * Get all upcoming birthdays for admin (students + parents + staff).
//    * Optionally filter by category.
//    * @param {string[]} categories - ['student','parent','staff'] — default all
//    */
//   async getAllBirthdays(categories = ["student", "parent", "staff"]) {
//     const results = {};

//     const fetchers = {
//       student: () => this.getStudentBirthdays(),
//       parent: () => this.getParentBirthdays(),
//       staff: () => this.getStaffBirthdays(),
//     };

//     await Promise.all(
//       categories.map(async (cat) => {
//         if (fetchers[cat]) {
//           results[cat] = await fetchers[cat]();
//         }
//       })
//     );

//     return results;
//   },

//   /**
//    * Generate birthday card payload for a given person.
//    * Returns metadata for card rendering (no image generation server-side).
//    */
//   async getBirthdayCardData(targetId, targetRole) {
//     const today = getTodayIST();
//     let person = null;

//     if (targetRole === "student") {
//       person = await Student.findOne({
//         _id: targetId,
//         status: "Active",
//         isDeleted: { $ne: true },
//       })
//         .select("firstName lastName dateOfBirth photo className section")
//         .lean();

//       if (!person) throw new ErrorResponse("Student not found", 404);

//       const md = extractMonthDay(person.dateOfBirth);
//       const days = md ? daysUntilBirthday(md.month, md.day, today) : null;

//       return {
//         id: person._id,
//         name: `${person.firstName} ${person.lastName}`.trim(),
//         role: "student",
//         dob: formatDOB(person.dateOfBirth),
//         birthdayDate: md
//           ? formatBirthdayDate(md.month, md.day, days ?? 0, today)
//           : null,
//         daysRemaining: days,
//         photo: person.photo || null,
//         hasPhoto: !!person.photo,
//         class: person.className || "",
//         section: person.section || "",
//         department: "",
//         // Card metadata
//         cardTemplate: person.photo ? "photo_card" : "name_card",
//         fallbackInitials: `${person.firstName?.[0] || ""}${person.lastName?.[0] || ""}`.toUpperCase(),
//       };
//     }

//     if (targetRole === "staff") {
//       person = await Teacher.findOne({
//         _id: targetId,
//         status: "Active",
//       })
//         .select("name dob photo department")
//         .lean();

//       if (!person) throw new ErrorResponse("Staff not found", 404);

//       const md = extractMonthDay(person.dob);
//       const days = md ? daysUntilBirthday(md.month, md.day, today) : null;

//       return {
//         id: person._id,
//         name: person.name,
//         role: "staff",
//         dob: formatDOB(person.dob),
//         birthdayDate: md
//           ? formatBirthdayDate(md.month, md.day, days ?? 0, today)
//           : null,
//         daysRemaining: days,
//         photo: person.photo || null,
//         hasPhoto: !!person.photo,
//         class: "",
//         department: person.department || "",
//         cardTemplate: person.photo ? "photo_card" : "name_card",
//         fallbackInitials: (person.name || "").slice(0, 2).toUpperCase(),
//       };
//     }

//     if (targetRole === "parent") {
//       person = await User.findOne({
//         _id: targetId,
//         role: "parent",
//         isActive: true,
//       })
//         .select("name avatar dob")
//         .lean();

//       if (!person) throw new ErrorResponse("Parent not found", 404);

//       const md = extractMonthDay(person.dob);
//       const days = md ? daysUntilBirthday(md.month, md.day, today) : null;

//       return {
//         id: person._id,
//         name: person.name,
//         role: "parent",
//         dob: formatDOB(person.dob),
//         birthdayDate: md
//           ? formatBirthdayDate(md.month, md.day, days ?? 0, today)
//           : null,
//         daysRemaining: days,
//         photo: person.avatar || null,
//         hasPhoto: !!person.avatar,
//         class: "",
//         department: "",
//         cardTemplate: person.avatar ? "photo_card" : "name_card",
//         fallbackInitials: (person.name || "").slice(0, 2).toUpperCase(),
//       };
//     }

//     throw new ErrorResponse("Invalid target role", 400);
//   },

//   /**
//    * Log a birthday card share event.
//    */
//   async logCardShare(targetId, targetRole, sharedByUserId, shareChannel = "whatsapp") {
//     try {
//       await BirthdayCardShareLog.create({
//         targetId,
//         targetRole,
//         sharedBy: sharedByUserId,
//         shareChannel,
//       });
//     } catch (err) {
//       // Non-critical — log but don't throw
//       logger.warn("Failed to log birthday card share:", err.message);
//     }
//   },

//   /**
//    * Send birthday push notifications to parents whose children have
//    * birthdays TODAY or TOMORROW.
//    * Called by the cron job. Deduplicated by BirthdayNotificationLog.
//    */
//   async sendBirthdayNotifications() {
//     const today = getTodayIST();
//     logger.info(`[BirthdayCron] Running for ${today.year}-${today.month}-${today.day}`);

//     // Get students with birthdays in next 2 days (today + tomorrow)
//     const allStudents = await this.getStudentBirthdays();
//     const targetStudents = allStudents.filter((s) => s.daysRemaining <= 1);

//     if (targetStudents.length === 0) {
//       logger.info("[BirthdayCron] No upcoming student birthdays today/tomorrow.");
//       return { sent: 0, skipped: 0, failed: 0 };
//     }

//     const notifService = new NotificationService();
//     let sent = 0, skipped = 0, failed = 0;

//     for (const student of targetStudents) {
//       try {
//         // Find parents of this student
//         const studentDoc = await Student.findById(student.id)
//           .select("parentUserId")
//           .lean();

//         if (!studentDoc?.parentUserId) continue;

//         const parentUserId = studentDoc.parentUserId;

//         // Check if notification already sent this year
//         const alreadySent = await BirthdayNotificationLog.findOne({
//           targetId: student.id,
//           recipientUserId: parentUserId,
//           year: today.year,
//         });

//         if (alreadySent) {
//           skipped++;
//           continue;
//         }

//         // Build notification message
//         const isToday = student.daysRemaining === 0;
//         const title = isToday
//           ? `🎂 Happy Birthday ${student.name}!`
//           : `🎈 Tomorrow is ${student.name}'s Birthday!`;
//         const body = isToday
//           ? `Wishing ${student.name} a wonderful birthday! 🎉`
//           : `Don't forget — ${student.name}'s birthday is tomorrow! 🎁`;

//         // Send push via existing NotificationService
//         await notifService.sendToUser(parentUserId.toString(), title, body, {
//           type: "birthday",
//           studentId: student.id.toString(),
//           birthdayDate: student.birthdayDate,
//         });

//         // Log to prevent duplicate sends
//         await BirthdayNotificationLog.create({
//           targetId: student.id,
//           targetRole: "student",
//           year: today.year,
//           recipientUserId: parentUserId,
//           status: "sent",
//         });

//         sent++;
//       } catch (err) {
//         failed++;
//         logger.error(
//           `[BirthdayCron] Failed to notify for student ${student.id}: ${err.message}`
//         );

//         // Try to log failure
//         try {
//           await BirthdayNotificationLog.create({
//             targetId: student.id,
//             targetRole: "student",
//             year: today.year,
//             recipientUserId: null,
//             status: "failed",
//             errorMessage: err.message,
//           });
//         } catch (_) {}
//       }
//     }

//     logger.info(
//       `[BirthdayCron] Done — sent: ${sent}, skipped: ${skipped}, failed: ${failed}`
//     );
//     return { sent, skipped, failed };
//   },
// };

// module.exports = birthdayService;

/**
 * Birthday Service
 *
 * Core business logic for upcoming birthday queries.
 * Reads from: Student, Teacher, User (parents), Parent
 * Writes to:  BirthdayNotificationLog, BirthdayCardShareLog (new collections only)
 *
 * IMPORTANT: No modifications to existing collections.
 */

const Student = require("../student/student.model");
const Teacher = require("../teacher/teacher.model");
const User = require("../auth/user.model");
const Parent = require("../shared/parent.model");
const {
  BirthdayNotificationLog,
  BirthdayCardShareLog,
} = require("./birthday.model");
const { NotificationLog } = require("../notification/notification.model");
const notificationService = require("../notification/notification.service");
const logger = require("../../config/logger");
const ErrorResponse = require("../../utils/errorResponse");

const TIMEZONE = process.env.APP_TIMEZONE || "Asia/Kolkata";
const UPCOMING_DAYS = 7;

// ─── Helpers ─────────────────────────────────────────────────────────────────

/**
 * Get today's date parts in IST (day, month, year, dayOfYear).
 */
function getTodayIST() {
  const now = new Date();
  const formatter = new Intl.DateTimeFormat("en-CA", {
    timeZone: TIMEZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
  const parts = formatter.formatToParts(now);
  const year = parseInt(parts.find((p) => p.type === "year").value, 10);
  const month = parseInt(parts.find((p) => p.type === "month").value, 10);
  const day = parseInt(parts.find((p) => p.type === "day").value, 10);
  return { year, month, day };
}

/**
 * Convert a DOB to { month, day } — ignores the birth year.
 * Returns null for invalid/null DOB.
 */
function extractMonthDay(dob) {
  if (!dob) return null;
  const d = new Date(dob);
  if (isNaN(d.getTime())) return null;
  return { month: d.getUTCMonth() + 1, day: d.getUTCDate() };
}

/**
 * Calculate how many days until the next birthday from today (IST).
 * Handles year-end crossing. Returns 0 if birthday is TODAY.
 * Handles Feb 29 leap-year birthdays (shown on Feb 28 or Mar 1 in non-leap years).
 *
 * @param {number} bMonth - birth month (1-12)
 * @param {number} bDay   - birth day  (1-31)
 * @returns {number|null}  days remaining (0–6) or null if not in next 7 days
 */
function daysUntilBirthday(bMonth, bDay, todayIST) {
  const { year, month, day } = todayIST;

  // Handle Feb 29 in non-leap years → treat as Feb 28
  if (bMonth === 2 && bDay === 29) {
    const isLeap = (y) => (y % 4 === 0 && y % 100 !== 0) || y % 400 === 0;
    if (!isLeap(year)) {
      bDay = 28;
    }
  }

  // Build this year's birthday date as UTC midnight
  let bdayYear = year;
  let bdayDate = new Date(Date.UTC(bdayYear, bMonth - 1, bDay));

  // Build today's UTC midnight
  const todayDate = new Date(Date.UTC(year, month - 1, day));

  // If birthday already passed this year, check next year
  if (bdayDate < todayDate) {
    bdayYear = year + 1;
    // Re-handle Feb 29 for next year
    let nextBDay = bDay;
    if (bMonth === 2 && bDay === 29) {
      const isLeap = (y) => (y % 4 === 0 && y % 100 !== 0) || y % 400 === 0;
      if (!isLeap(bdayYear)) nextBDay = 28;
      else nextBDay = 29;
    }
    bdayDate = new Date(Date.UTC(bdayYear, bMonth - 1, nextBDay));
  }

  const diffMs = bdayDate.getTime() - todayDate.getTime();
  const diffDays = Math.round(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays < 0 || diffDays >= UPCOMING_DAYS) return null;
  return diffDays;
}

/**
 * Format a DOB date to "YYYY-MM-DD" string.
 */
function formatDOB(dob) {
  if (!dob) return null;
  const d = new Date(dob);
  if (isNaN(d.getTime())) return null;
  const m = String(d.getUTCMonth() + 1).padStart(2, "0");
  const day = String(d.getUTCDate()).padStart(2, "0");
  return `${d.getUTCFullYear()}-${m}-${day}`;
}

/**
 * Format birthday date for THIS occurrence (month/day, with this/next year).
 */
function formatBirthdayDate(bMonth, bDay, daysRemaining, todayIST) {
  let year = todayIST.year;
  // If daysRemaining crosses into next year
  const checkMonth = todayIST.month;
  const checkDay = todayIST.day;
  const futureDate = new Date(
    Date.UTC(year, checkMonth - 1, checkDay + daysRemaining),
  );
  const mm = String(futureDate.getUTCMonth() + 1).padStart(2, "0");
  const dd = String(futureDate.getUTCDate()).padStart(2, "0");
  const yy = futureDate.getUTCFullYear();
  return `${yy}-${mm}-${dd}`;
}

// ─── Core Service ─────────────────────────────────────────────────────────────

const birthdayService = {
  /**
   * Fetch upcoming student birthdays within next 7 days.
   * Excludes: deleted, inactive, no DOB students.
   */
  async getStudentBirthdays() {
    const today = getTodayIST();

    // Pull only the fields we need — no N+1
    const students = await Student.find({
      status: "Active",
      dateOfBirth: { $ne: null, $exists: true },
    })
      .select(
        "_id firstName lastName dateOfBirth photo className section rollNo admissionNo parentDetails.primaryPhone",
      )
      .lean();

    const results = [];

    for (const s of students) {
      const md = extractMonthDay(s.dateOfBirth);
      if (!md) continue;

      const days = daysUntilBirthday(md.month, md.day, today);
      if (days === null) continue;

      results.push({
        id: s._id,
        name: `${s.firstName} ${s.lastName}`.trim(),
        role: "student",
        dob: formatDOB(s.dateOfBirth),
        birthdayDate: formatBirthdayDate(md.month, md.day, days, today),
        daysRemaining: days,
        photo: s.photo || null,
        class: s.className || "",
        section: s.section || "",
        rollNo: s.rollNo || "",
        admissionNo: s.admissionNo || "",
        department: "",
        phone: s.parentDetails?.primaryPhone || "",
      });
    }

    // Sort by nearest birthday
    results.sort((a, b) => a.daysRemaining - b.daysRemaining);
    return results;
  },

  /**
   * Fetch upcoming staff/teacher birthdays within next 7 days.
   * Excludes: inactive, no DOB teachers.
   */
  async getStaffBirthdays() {
    const today = getTodayIST();

    const teachers = await Teacher.find({
      status: "Active",
      dob: { $ne: null, $exists: true },
    })
      .select("_id name dob photo subjects employeeId phone")
      .lean();

    const results = [];

    for (const t of teachers) {
      const md = extractMonthDay(t.dob);
      if (!md) continue;

      const days = daysUntilBirthday(md.month, md.day, today);
      if (days === null) continue;

      results.push({
        id: t._id,
        name: t.name,
        role: "staff",
        dob: formatDOB(t.dob),
        birthdayDate: formatBirthdayDate(md.month, md.day, days, today),
        daysRemaining: days,
        photo: t.photo || null,
        class: "",
        department: Array.isArray(t.subjects)
          ? t.subjects.join(", ")
          : t.subjects || "",
        phone: t.phone || "",
      });
    }

    results.sort((a, b) => a.daysRemaining - b.daysRemaining);
    return results;
  },

  /**
   * Fetch upcoming parent birthdays within next 7 days.
   * Parent DOB is stored in Student model as fatherDob/motherDob.
   */
  async getParentBirthdays() {
    const today = getTodayIST();

    const students = await Student.find({
      status: "Active",
      parentUserId: { $ne: null },
      $or: [{ fatherDob: { $ne: null } }, { motherDob: { $ne: null } }],
    })
      .select("parentUserId fatherDob motherDob")
      .lean();

    const parentsWithDob = [];
    const seenParents = new Set();

    for (const student of students) {
      if (
        student.parentUserId &&
        !seenParents.has(student.parentUserId.toString())
      ) {
        seenParents.add(student.parentUserId.toString());

        const parent = await User.findOne({
          _id: student.parentUserId,
          role: "parent",
          isActive: true,
        })
          .select("_id name avatar phone")
          .lean();

        if (parent) {
          // Check father DOB
          if (student.fatherDob) {
            const md = extractMonthDay(student.fatherDob);
            if (md) {
              const days = daysUntilBirthday(md.month, md.day, today);
              if (days !== null) {
                parentsWithDob.push({
                  id: `${parent._id}-father`,
                  name: parent.name,
                  role: "parent-father",
                  dob: formatDOB(student.fatherDob),
                  birthdayDate: formatBirthdayDate(
                    md.month,
                    md.day,
                    days,
                    today,
                  ),
                  daysRemaining: days,
                  photo: parent.avatar || null,
                  class: "",
                  department: "",
                  phone: parent.phone || "",
                });
              }
            }
          }

          // Check mother DOB
          if (student.motherDob) {
            const md = extractMonthDay(student.motherDob);
            if (md) {
              const days = daysUntilBirthday(md.month, md.day, today);
              if (days !== null) {
                parentsWithDob.push({
                  id: `${parent._id}-mother`,
                  name: parent.name,
                  role: "parent-mother",
                  dob: formatDOB(student.motherDob),
                  birthdayDate: formatBirthdayDate(
                    md.month,
                    md.day,
                    days,
                    today,
                  ),
                  daysRemaining: days,
                  photo: parent.avatar || null,
                  class: "",
                  department: "",
                  phone: parent.phone || "",
                });
              }
            }
          }
        }
      }
    }

    parentsWithDob.sort((a, b) => a.daysRemaining - b.daysRemaining);
    return parentsWithDob;
  },

  /**
   * Get all upcoming birthdays for admin (students + parents + staff).
   * Optionally filter by category.
   * @param {string[]} categories - ['student','parent','staff'] — default all
   */
  async getAllBirthdays(categories = ["student", "parent", "staff"]) {
    const results = {};

    const fetchers = {
      student: () => this.getStudentBirthdays(),
      parent: () => this.getParentBirthdays(),
      staff: () => this.getStaffBirthdays(),
    };

    await Promise.all(
      categories.map(async (cat) => {
        if (fetchers[cat]) {
          results[cat] = await fetchers[cat]();
        }
      }),
    );

    return results;
  },

  /**
   * Generate birthday card payload for a given person.
   * Returns metadata for card rendering (no image generation server-side).
   */
  async getBirthdayCardData(targetId, targetRole) {
    const today = getTodayIST();
    let person = null;

    if (targetRole === "student") {
      person = await Student.findOne({
        _id: targetId,
        status: "Active",
      })
        .select("firstName lastName dateOfBirth photo className section parentDetails.primaryPhone")
        .lean();

      if (!person) throw new ErrorResponse("Student not found", 404);

      const md = extractMonthDay(person.dateOfBirth);
      const days = md ? daysUntilBirthday(md.month, md.day, today) : null;

      return {
        id: person._id,
        name: `${person.firstName} ${person.lastName}`.trim(),
        role: "student",
        dob: formatDOB(person.dateOfBirth),
        birthdayDate: md
          ? formatBirthdayDate(md.month, md.day, days ?? 0, today)
          : null,
        daysRemaining: days,
        photo: person.photo || null,
        hasPhoto: !!person.photo,
        class: person.className || "",
        section: person.section || "",
        department: "",
        // Card metadata
        cardTemplate: person.photo ? "photo_card" : "name_card",
        fallbackInitials:
          `${person.firstName?.[0] || ""}${person.lastName?.[0] || ""}`.toUpperCase(),
        phone: person.parentDetails?.primaryPhone || "",
      };
    }

    if (targetRole === "staff") {
      person = await Teacher.findOne({
        _id: targetId,
        status: "Active",
      })
        .select("name dob photo phone subjects employeeId")
        .lean();

      if (!person) throw new ErrorResponse("Staff not found", 404);

      const md = extractMonthDay(person.dob);
      const days = md ? daysUntilBirthday(md.month, md.day, today) : null;

      return {
        id: person._id,
        name: person.name,
        role: "staff",
        dob: formatDOB(person.dob),
        birthdayDate: md
          ? formatBirthdayDate(md.month, md.day, days ?? 0, today)
          : null,
        daysRemaining: days,
        photo: person.photo || null,
        hasPhoto: !!person.photo,
        class: "",
        department: Array.isArray(person.subjects)
          ? person.subjects.join(", ")
          : person.subjects || "",
        cardTemplate: person.photo ? "photo_card" : "name_card",
        fallbackInitials: (person.name || "").slice(0, 2).toUpperCase(),
        phone: person.phone || "",
      };
    }

    if (
      targetRole === "parent" ||
      targetRole === "parent-father" ||
      targetRole === "parent-mother"
    ) {
      const parentId =
        targetRole === "parent"
          ? targetId
          : targetId.replace(/-(father|mother)$/, "");

      const parentDoc = await User.findOne({
        _id: parentId,
        role: "parent",
        isActive: true,
      })
        .select("_id name avatar phone")
        .lean();

      if (!parentDoc) throw new ErrorResponse("Parent not found", 404);

      // Get any student with this parent to access fatherDob/motherDob
      const studentWithParentDob = await Student.findOne({
        parentUserId: parentId,
      })
        .select("fatherDob motherDob")
        .lean();

      if (!studentWithParentDob)
        throw new ErrorResponse("Parent has no associated students", 404);

      const isFather = targetRole === "parent-father";
      const dob = isFather
        ? studentWithParentDob.fatherDob
        : studentWithParentDob.motherDob;

      if (!dob) throw new ErrorResponse("Parent DOB not available", 404);

      const md = extractMonthDay(dob);
      const days = md ? daysUntilBirthday(md.month, md.day, today) : null;

      return {
        id: isFather ? `${parentDoc._id}-father` : `${parentDoc._id}-mother`,
        name: parentDoc.name,
        role: isFather ? "parent-father" : "parent-mother",
        dob: formatDOB(dob),
        birthdayDate: md
          ? formatBirthdayDate(md.month, md.day, days ?? 0, today)
          : null,
        daysRemaining: days,
        photo: parentDoc.avatar || null,
        hasPhoto: !!parentDoc.avatar,
        class: "",
        department: "",
        cardTemplate: parentDoc.avatar ? "photo_card" : "name_card",
        fallbackInitials: (parentDoc.name || "").slice(0, 2).toUpperCase(),
        phone: parentDoc.phone || "",
      };
    }

    throw new ErrorResponse("Invalid target role", 400);
  },

  /**
   * Log a birthday card share event.
   */
  async logCardShare(
    targetId,
    targetRole,
    sharedByUserId,
    shareChannel = "whatsapp",
  ) {
    try {
      await BirthdayCardShareLog.create({
        targetId,
        targetRole,
        sharedBy: sharedByUserId,
        shareChannel,
      });
    } catch (err) {
      // Non-critical — log but don't throw
      logger.warn("Failed to log birthday card share:", err.message);
    }
  },

  /**
   * Send birthday push notifications to parents whose children have
   * birthdays TODAY or TOMORROW.
   * Called by the cron job. Deduplicated by BirthdayNotificationLog.
   */
  async sendBirthdayNotifications() {
    const today = getTodayIST();
    logger.info(
      `[BirthdayCron] Running for ${today.year}-${today.month}-${today.day}`,
    );

    // Get students with birthdays in next 2 days (today + tomorrow)
    const allStudents = await this.getStudentBirthdays();
    const targetStudents = allStudents.filter((s) => s.daysRemaining <= 1);

    if (targetStudents.length === 0) {
      logger.info(
        "[BirthdayCron] No upcoming student birthdays today/tomorrow.",
      );
      return { sent: 0, skipped: 0, failed: 0 };
    }

    const notifService = notificationService;
    let sent = 0,
      skipped = 0,
      failed = 0;

    for (const student of targetStudents) {
      try {
        // Find parents of this student
        const studentDoc = await Student.findById(student.id)
          .select("parentUserId")
          .lean();

        if (!studentDoc?.parentUserId) continue;

        const parentUserId = studentDoc.parentUserId;

        // Check if notification already sent this year
        const alreadySent = await BirthdayNotificationLog.findOne({
          targetId: student.id,
          recipientUserId: parentUserId,
          year: today.year,
        });

        if (alreadySent) {
          skipped++;
          continue;
        }

        // Build notification message
        const isToday = student.daysRemaining === 0;
        const title = isToday
          ? `🎂 Happy Birthday ${student.name}!`
          : `🎈 Tomorrow is ${student.name}'s Birthday!`;
        const body = isToday
          ? `Wishing ${student.name} a wonderful birthday! 🎉`
          : `Don't forget — ${student.name}'s birthday is tomorrow! 🎁`;

        // Persist in-app + send push via existing NotificationService
        await notifService.notifyUser(
          parentUserId.toString(),
          title,
          body,
          {
            type: "birthday",
            studentId: student.id.toString(),
            birthdayDate: student.birthdayDate,
          },
        );

        // Log to prevent duplicate sends
        await BirthdayNotificationLog.create({
          targetId: student.id,
          targetRole: "student",
          year: today.year,
          recipientUserId: parentUserId,
          status: "sent",
        });

        sent++;
      } catch (err) {
        failed++;
        logger.error(
          `[BirthdayCron] Failed to notify for student ${student.id}: ${err.message}`,
        );

        // Try to log failure
        try {
          await BirthdayNotificationLog.create({
            targetId: student.id,
            targetRole: "student",
            year: today.year,
            recipientUserId: null,
            status: "failed",
            errorMessage: err.message,
          });
        } catch (_) {}
      }
    }

    logger.info(
      `[BirthdayCron] Done — sent: ${sent}, skipped: ${skipped}, failed: ${failed}`,
    );
    return { sent, skipped, failed };
  },
};

module.exports = birthdayService;
