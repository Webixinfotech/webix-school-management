const express = require("express");
const router = express.Router();

// Import multer configuration
const {
  uploadTeacherPhoto,
  handleMulterError,
} = require("../../config/multer");

// Import controller
const {
  getTeachers,
  getTeacher,
  createTeacher,
  updateTeacher,
  updateTeacherPermissions,
  updateTeacherPhoto,
  deleteTeacher,
  getMyProfile,
  addAdminNote,
  updateAdminNote,
  deleteAdminNote,
  getNotes,
} = require("./teacher.controller");

const { getTeacherDashboardStats } = require("./teacher.service");

// Import validators
const {
  createTeacherValidation,
  updateTeacherValidation,
  addAdminNoteValidation,
  updateAdminNoteValidation,
} = require("./teacher.validators");

// Import middleware
const { authGuard, roleGuard, teacherPermissionGuard } = require("../../middleware/auth.middleware");
const validate = require("../../middleware/validate.middleware");
const { auditTrail } = require("../audit/audit.middleware");
const Teacher = require("./teacher.model");

// IMPORTANT: /my-profile MUST be defined BEFORE /:id

// GET /api/teachers/my-profile - Teacher only
router.get("/my-profile", authGuard, roleGuard("teacher"), getMyProfile);

// GET /api/teachers - Admin, Sub-admin, teacher with canManageEmployees
router.get("/", authGuard, teacherPermissionGuard("canManageEmployees"), getTeachers);

// GET /api/teachers/:id - Admin, Sub-admin, any teacher viewing their own
// profile, or a teacher with canManageEmployees viewing someone else's.
// That split can't be expressed as a route-level guard (it needs to compare
// :id against the caller), so roleGuard only gates by role here and
// teacherService.getTeacherById enforces the self-or-canManageEmployees
// check once it has loaded the target teacher.
router.get(
  "/:id",
  authGuard,
  roleGuard("admin", "teacher"),
  getTeacher,
);

// POST /api/teachers - Admin, Sub-admin, teacher with canManageEmployees (with file upload)
router.post(
  "/",
  authGuard,
  teacherPermissionGuard("canManageEmployees"),
  uploadTeacherPhoto,
  handleMulterError,
  createTeacherValidation,
  validate,
  auditTrail(Teacher, "CREATE"),
  createTeacher,
);

// PUT /api/teachers/:id - Admin, Sub-admin, teacher with canManageEmployees
// NOTE: teacher.service.js#updateTeacher ignores any "permissions" key in
// the body regardless of who's calling — permissions can ONLY be changed
// via the dedicated admin-only /:id/permissions route below. Do not lift
// that restriction even for canManageEmployees.
router.put(
  "/:id",
  authGuard,
  teacherPermissionGuard("canManageEmployees"),
  updateTeacherValidation,
  validate,
  auditTrail(Teacher, "UPDATE"),
  updateTeacher,
);

// PUT /api/teachers/:id/permissions - Admin ONLY, always.
// Never gate this behind a teacher permission — doing so would let a
// canManageEmployees teacher grant themselves (or anyone) more access,
// i.e. self-service privilege escalation. This must stay roleGuard('admin').
router.put(
  "/:id/permissions",
  authGuard,
  roleGuard("admin"),
  auditTrail(Teacher, "UPDATE"),
  updateTeacherPermissions,
);

// PUT /api/teachers/:id/photo - Admin, Sub-admin, teacher with canManageEmployees (with file upload)
router.put(
  "/:id/photo",
  authGuard,
  teacherPermissionGuard("canManageEmployees"),
  uploadTeacherPhoto,
  handleMulterError,
  auditTrail(Teacher, "UPDATE"),
  updateTeacherPhoto,
);

// DELETE /api/teachers/:id - Admin only
router.delete(
  "/:id",
  authGuard,
  roleGuard("admin"),
  auditTrail(Teacher, "DELETE"),
  deleteTeacher,
);

// Note routes
// GET /api/teachers/:id/notes - Admin, Sub-admin
router.get("/:id/notes", authGuard, roleGuard("admin"), getNotes);

// POST /api/teachers/:id/notes - Admin only
router.post(
  "/:id/notes",
  authGuard,
  roleGuard("admin"),
  addAdminNoteValidation,
  validate,
  addAdminNote,
);

// PUT /api/teachers/:id/notes/:noteId - Admin only
router.put(
  "/:id/notes/:noteId",
  authGuard,
  roleGuard("admin"),
  updateAdminNoteValidation,
  validate,
  updateAdminNote,
);

// DELETE /api/teachers/:id/notes/:noteId - Admin only
router.delete(
  "/:id/notes/:noteId",
  authGuard,
  roleGuard("admin"),
  deleteAdminNote,
);

// GET /api/teachers/dashboard/stats
router.get(
  "/dashboard/stats",
  authGuard,
  roleGuard("teacher"),
  async (req, res, next) => {
    try {
      const data = await getTeacherDashboardStats(req.user._id);
      res.json({ success: true, data });
    } catch (err) {
      next(err);
    }
  },
);

module.exports = router;