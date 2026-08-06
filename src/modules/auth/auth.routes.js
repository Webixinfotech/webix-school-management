const express = require("express");
const router = express.Router();

const {
  registerAdmin,
  registerUser,
  login,
  getMe,
  updateProfile,
  changePassword,
  logout,
  adminChangePassword,
  teacherChangeParentPassword,
} = require("./auth.controller");

const {
  authGuard,
  roleGuard,
  teacherPermissionGuard,
} = require("../../middleware/auth.middleware");
const validate = require("../../middleware/validate.middleware");
const {
  registerAdminValidation,
  registerUserValidation,
  loginValidation,
  updateProfileValidation,
  changePasswordValidation,
  adminChangePasswordValidation,
} = require("./auth.validators");

// Public routes
router.post(
  "/register-admin",
  registerAdminValidation,
  validate,
  registerAdmin,
);

// Protected routes (requires admin)
router.post(
  "/register",
  authGuard,
  roleGuard("admin"),
  registerUserValidation,
  validate,
  registerUser,
);

// Public login route
router.post("/login", loginValidation, validate, login);

// Protected routes
router.post("/logout", authGuard, logout);
router.get("/me", authGuard, getMe);
router.put(
  "/update-profile",
  authGuard,
  updateProfileValidation,
  validate,
  updateProfile,
);
router.put(
  "/change-password",
  authGuard,
  changePasswordValidation,
  validate,
  changePassword,
);

// Admin only routes
router.put(
  "/admin/change-password/:userId",
  authGuard,
  roleGuard("admin"),
  adminChangePasswordValidation,
  validate,
  adminChangePassword,
);

// Admin, or teacher with canManageStudents — scoped to parents of students
// in the teacher's own classes (enforced in the service layer)
router.put(
  "/teacher/change-parent-password/:userId",
  authGuard,
  teacherPermissionGuard("canManageStudents"),
  adminChangePasswordValidation,
  validate,
  teacherChangeParentPassword,
);

module.exports = router;
