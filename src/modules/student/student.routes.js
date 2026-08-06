const express = require("express");
const router = express.Router();

// Import multer configuration
const {
  uploadStudentPhoto,
  handleMulterError,
} = require("../../config/multer");

// Import controller
const {
  getStudents,
  getStudent,
  createStudent,
  updateStudent,
  updateStudentPhoto,
  deleteStudent,
  getMyChildren,
} = require("./student.controller");

// Import validators
const {
  createStudentValidation,
  updateStudentValidation,
  getStudentsValidation,
} = require("./student.validators");

// Import middleware
const { authGuard, roleGuard, teacherPermissionGuard } = require("../../middleware/auth.middleware");
const validate = require("../../middleware/validate.middleware");
const { auditTrail } = require("../audit/audit.middleware");
const Student = require("./student.model");
const { query } = require("express-validator");

// IMPORTANT: /my-children must be defined BEFORE /:id

// GET /api/students/my-children - Parent only
router.get("/my-children", authGuard, roleGuard("parent"), getMyChildren);

// GET /api/students - Admin, Sub-admin, Teacher
router.get(
  "/",
  authGuard,
  roleGuard("admin", "teacher"),
  [
    query("sessionId").optional().isMongoId().withMessage("Session ID must be a valid ID"),
    ...getStudentsValidation,
  ],
  validate,
  getStudents,
);

// GET /api/students/:id - Admin, Sub-admin, Teacher, Parent
router.get(
  "/:id",
  authGuard,
  roleGuard("admin", "teacher", "parent"),
  getStudent,
);

// POST /api/students - Admin, Sub-admin, teacher with canManageStudents
router.post(
  "/",
  authGuard,
  teacherPermissionGuard("canManageStudents"),
  uploadStudentPhoto,
  handleMulterError,
  createStudentValidation,
  validate,
  auditTrail(Student, "CREATE"),
  createStudent,
);

// PUT /api/students/:id - Admin, Sub-admin, teacher with canManageStudents
router.put(
  "/:id",
  authGuard,
  teacherPermissionGuard("canManageStudents"),
  updateStudentValidation,
  validate,
  auditTrail(Student, "UPDATE"),
  updateStudent,
);

// PUT /api/students/:id/photo - Admin, Sub-admin, teacher with canManageStudents (with file upload)
router.put(
  "/:id/photo",
  authGuard,
  teacherPermissionGuard("canManageStudents"),
  uploadStudentPhoto,
  handleMulterError,
  auditTrail(Student, "UPDATE"),
  updateStudentPhoto,
);

// DELETE /api/students/:id - Admin only
router.delete(
  "/:id",
  authGuard,
  roleGuard("admin"),
  auditTrail(Student, "DELETE"),
  deleteStudent,
);

module.exports = router;