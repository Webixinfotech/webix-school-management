const express = require("express");
const router = express.Router();

// Import controller
const {
  getClasses,
  getClass,
  createClass,
  updateClass,
  deleteClass,
  getClassesByType,
  getClassesByDay,
  getClassStudents,
  assignTeacher,
  getMyClasses,
  getTeachersInClass,
} = require("./class.controller");

// Import validators
const {
  createClassValidation,
  updateClassValidation,
  assignTeacherValidation,
  classTypeParamValidation,
  dayParamValidation,
  getClassesValidation,
} = require("./class.validators");

// Import middleware
const { authGuard, roleGuard } = require("../../middleware/auth.middleware");
const validate = require("../../middleware/validate.middleware");

// IMPORTANT: Specific routes must be defined BEFORE parameterized routes

// GET /api/classes/my-classes - Teacher only
router.get("/my-classes", authGuard, roleGuard("teacher"), getMyClasses);

// GET /api/classes/type/:classType - Admin, Sub-admin, Teacher
router.get(
  "/type/:classType",
  authGuard,
  roleGuard("admin", "teacher"),
  classTypeParamValidation,
  validate,
  getClassesByType,
);

// GET /api/classes/day/:day - Admin, Sub-admin, Teacher
router.get(
  "/day/:day",
  authGuard,
  roleGuard("admin", "teacher"),
  dayParamValidation,
  validate,
  getClassesByDay,
);

// GET /api/classes/:id/students - Admin, Sub-admin, Teacher
router.get(
  "/:id/students",
  authGuard,
  roleGuard("admin", "teacher"),
  getClassStudents,
);

// GET /api/classes/:id/teachers - Admin, Sub-admin, Teacher
router.get(
  "/:id/teachers",
  authGuard,
  roleGuard("admin", "teacher"),
  getTeachersInClass,
);

// PUT /api/classes/:id/assign-teacher - Admin only
router.put(
  "/:id/assign-teacher",
  authGuard,
  roleGuard("admin"),
  assignTeacherValidation,
  validate,
  assignTeacher,
);

// GET /api/classes - Admin, Sub-admin, Teacher
router.get(
  "/",
  authGuard,
  roleGuard("admin", "teacher"),
  getClassesValidation,
  validate,
  getClasses,
);

// POST /api/classes - Admin, Sub-admin
router.post(
  "/",
  authGuard,
  roleGuard("admin"),
  createClassValidation,
  validate,
  createClass,
);

// GET /api/classes/:id - Admin, Sub-admin, Teacher
router.get(
  "/:id",
  authGuard,
  roleGuard("admin", "teacher"),
  getClass,
);

// PUT /api/classes/:id - Admin, Sub-admin
router.put(
  "/:id",
  authGuard,
  roleGuard("admin"),
  updateClassValidation,
  validate,
  updateClass,
);

// DELETE /api/classes/:id - Admin only
router.delete("/:id", authGuard, roleGuard("admin"), deleteClass);

module.exports = router;
