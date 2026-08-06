/**
 * Birthday Routes
 *
 * Mounts at: /api/birthdays
 *
 * Role access summary:
 *   admin     → all categories
 *   teacher   → students only, gated by canManageBirthdays/canViewBirthdays
 *   parent    → NO listing API (push notifications only via cron)
 *
 * Valid roles on User are admin/teacher/parent only (see user.model.js) —
 * there is no "sub-admin" role or route in this module.
 */

const express = require("express");
const router = express.Router();

const {
  authGuard,
  roleGuard,
  teacherPermissionGuard,
} = require("../../middleware/auth.middleware");

const {
  getAdminUpcomingBirthdays,
  getTeacherUpcomingBirthdays,
  getBirthdayCard,
  getWhatsappShareData,
  triggerBirthdayNotifications,
} = require("./birthday.controller");

const ErrorResponse = require("../../utils/errorResponse");

// ─── All routes require authentication ───────────────────────────────────────
router.use(authGuard);

// ─── Custom Middleware: Category-aware access guard for card/whatsapp-share ───
// :role can be student | staff | parent | parent-father | parent-mother.
// admin      → always allowed.
// teacher    → only for role=student, and only with canViewBirthdays
//              (matches /teacher/upcoming, which is student-only).
const ROLE_TO_CATEGORY = {
  student: "student",
  staff: "staff",
  parent: "parent",
  "parent-father": "parent",
  "parent-mother": "parent",
};

const birthdayCardAccessGuard = (req, res, next) => {
  if (req.user.role === "admin") return next();

  const category = ROLE_TO_CATEGORY[req.params.role];

  if (req.user.role === "teacher") {
    if (category === "student" && req.teacherDoc?.permissions?.canViewBirthdays === true) {
      return next();
    }
    return next(
      new ErrorResponse(
        "You do not have permission to access this feature (canViewBirthdays).",
        403
      )
    );
  }

  return next(new ErrorResponse("Not authorized", 403));
};

// ─── ADMIN ROUTES ─────────────────────────────────────────────────────────────

/**
 * GET /api/birthdays/admin/upcoming
 * Query: ?category=student,staff,parent  (optional; default = all)
 * Query: ?flat=true  (optional; returns flat sorted array instead of grouped)
 * Access: admin, or teacher with canManageBirthdays.
 */
router.get(
  "/admin/upcoming",
  teacherPermissionGuard("canManageBirthdays"),
  getAdminUpcomingBirthdays
);

/**
 * POST /api/birthdays/admin/send-notifications
 * Manually trigger birthday push notifications (also called by cron).
 * Access: admin, or teacher with canManageBirthdays.
 */
router.post(
  "/admin/send-notifications",
  teacherPermissionGuard("canManageBirthdays"),
  triggerBirthdayNotifications
);

// ─── TEACHER ROUTES ───────────────────────────────────────────────────────────

/**
 * GET /api/birthdays/teacher/upcoming
 * Returns upcoming student birthdays only.
 * Access: teacher only, gated by canViewBirthdays.
 * roleGuard('teacher') runs first so this never widens access to
 * admin/sub-admin — teacherPermissionGuard's own admin/sub-admin bypass
 * simply never triggers on this route.
 */
router.get(
  "/teacher/upcoming",
  roleGuard("teacher"),
  teacherPermissionGuard("canViewBirthdays"),
  getTeacherUpcomingBirthdays
);

// ─── SHARED ROUTES (admin + teacher) ──────────────────────────────

/**
 * GET /api/birthdays/card/:role/:id
 * Get birthday card data for sharing/display.
 * :role = student | staff | parent
 * Access: admin, teacher
 */
router.get(
  "/card/:role/:id",
  roleGuard("admin", "teacher"),
  birthdayCardAccessGuard,
  getBirthdayCard
);

/**
 * GET /api/birthdays/whatsapp-share/:role/:id
 * Get WhatsApp share payload + logs the share event.
 * :role = student | staff | parent
 * Access: admin, teacher
 */
router.get(
  "/whatsapp-share/:role/:id",
  roleGuard("admin", "teacher"),
  birthdayCardAccessGuard,
  getWhatsappShareData
);

module.exports = router;