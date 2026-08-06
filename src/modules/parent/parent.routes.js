const express = require("express");
const router = express.Router();

// Import controller
const {
  getParents,
  getParent,
  updateParent,
  deactivateParent,
  activateParent,
  getParentChildren,
  getMyProfile,
  updateMyProfile,
  getParentStats,
} = require("./parent.controller");

const { getStudentAttendanceDiff } = require("./parent.service");

// Import validators
const {
  updateParentValidation,
  updateMyProfileValidation,
  getParentsValidation,
} = require("./parent.validators");

// Import middleware
const { authGuard, roleGuard } = require("../../middleware/auth.middleware");
const validate = require("../../middleware/validate.middleware");
const { auditTrail } = require("../audit/audit.middleware");
const Parent = require("../shared/parent.model");

// IMPORTANT: /my-profile and /stats must be defined BEFORE /:id

// GET /api/parents/my-profile - Parent only
router.get("/my-profile", authGuard, roleGuard("parent"), getMyProfile);

// PUT /api/parents/my-profile - Parent only
router.put(
  "/my-profile",
  authGuard,
  roleGuard("parent"),
  updateMyProfileValidation,
  validate,
  updateMyProfile,
);

// GET /api/parents/stats - Admin, Sub-admin
router.get(
  "/stats",
  authGuard,
  roleGuard("admin"),
  getParentStats,
);

// GET /api/parents - Admin, Sub-admin
router.get(
  "/",
  authGuard,
  roleGuard("admin"),
  getParentsValidation,
  validate,
  getParents,
);

// GET /api/parents/:id - Admin, Sub-admin, Parent (own profile only)
router.get(
  "/:id",
  authGuard,
  roleGuard("admin", "parent"),
  getParent,
);

// PUT /api/parents/:id - Admin, Sub-admin
router.put(
  "/:id",
  authGuard,
  roleGuard("admin"),
  updateParentValidation,
  validate,
  auditTrail(Parent, "UPDATE"),
  updateParent,
);

// PUT /api/parents/:id/deactivate - Admin only
router.put(
  "/:id/deactivate",
  authGuard,
  roleGuard("admin"),
  auditTrail(Parent, "UPDATE"),
  deactivateParent,
);

// PUT /api/parents/:id/activate - Admin only
router.put(
  "/:id/activate",
  authGuard,
  roleGuard("admin"),
  auditTrail(Parent, "UPDATE"),
  activateParent,
);

// GET /api/parents/:id/children - Admin, Sub-admin, Teacher, Parent (own profile only)
router.get(
  "/:id/children",
  authGuard,
  roleGuard("admin", "teacher", "parent"),
  getParentChildren,
);

// GET /api/parents/student/:studentId/attendance-diff
router.get(
  "/student/:studentId/attendance-diff",
  authGuard,
  roleGuard("parent"),
  async (req, res, next) => {
    try {
      const data = await getStudentAttendanceDiff(
        req.user._id,
        req.params.studentId,
        req.query,
      );
      res.json({ success: true, data });
    } catch (err) {
      next(err);
    }
  },
);

module.exports = router;
