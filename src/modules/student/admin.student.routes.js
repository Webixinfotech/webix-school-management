const express = require("express");
const router = express.Router();

// Import controllers
const {
  getAdminStudents,
  getAdminStudentStats,
  exportStudents,
  getAdminStudentById,
  bulkStudentOperations,
} = require("./admin.student.controller");

const {
  getRedFlaggedStudents,
  getStudentFreeDaysReport,
  getStudentsByAttendanceOrder,
  assignClassToStudent,
} = require("./admin.student.service");

// Import validators
const { adminGetStudentsValidation } = require("./admin.student.validators");

// Import middleware
const { authGuard, roleGuard } = require("../../middleware/auth.middleware");
const validate = require("../../middleware/validate.middleware");

// All routes require authentication
router.use(authGuard);

// All routes require admin or sub-admin role
router.use(roleGuard("admin"));

// ==================== Admin Student Routes ====================

// GET /api/admin/students - List all students with advanced filtering
router.get("/", adminGetStudentsValidation, validate, getAdminStudents);

// GET /api/admin/students/stats - Dashboard statistics
router.get("/stats", getAdminStudentStats);

// GET /api/admin/students/export - Export all filtered students
router.get("/export", adminGetStudentsValidation, validate, exportStudents);

// POST /api/admin/students/bulk - Bulk operations (planned feature)
router.post("/bulk", bulkStudentOperations);

// ==================== Special Admin Reports ====================

// GET /api/admin/students/red-flagged
router.get("/red-flagged", async (req, res, next) => {
  try {
    const data = await getRedFlaggedStudents();
    res.json({ success: true, count: data.length, data });
  } catch (err) {
    next(err);
  }
});

// GET /api/admin/students/free-days-report
router.get("/free-days-report", async (req, res, next) => {
  try {
    const data = await getStudentFreeDaysReport(req.query);
    res.json({ success: true, count: data.length, data });
  } catch (err) {
    next(err);
  }
});

// GET /api/admin/students/attendance-ranking
router.get("/attendance-ranking", async (req, res, next) => {
  try {
    const data = await getStudentsByAttendanceOrder(req.query);
    res.json({ success: true, count: data.length, data });
  } catch (err) {
    next(err);
  }
});

// ==================== Student-Specific Routes ====================

// POST /api/admin/students/:id/assign-class
// Must be BEFORE /:id to avoid matching conflict
router.post("/:id/assign-class", async (req, res, next) => {
  try {
    const { classId, agreedFee, discountReason, validFrom, validUntil, notes } = req.body;
    const result = await assignClassToStudent(req.params.id, classId, req.user, {
      agreedFee, discountReason, validFrom, validUntil, notes,
    });
    res.json({
      success: true,
      message: "Class assigned successfully",
      data: result,
    });
  } catch (err) {
    next(err);
  }
});

// GET /api/admin/students/:id - Get single student (enhanced)
router.get("/:id", getAdminStudentById);

module.exports = router;
