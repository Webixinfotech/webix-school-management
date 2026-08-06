const { body } = require("express-validator");

/**
 * Validation rules for admin registration
 */
exports.registerAdminValidation = [
  body("name")
    .trim()
    .notEmpty()
    .withMessage("Name is required")
    .isLength({ max: 50 })
    .withMessage("Name cannot exceed 50 characters"),
  body("email")
    .trim()
    .notEmpty()
    .withMessage("Email is required")
    .isEmail()
    .withMessage("Please provide a valid email")
    .normalizeEmail(),
  body("password")
    .notEmpty()
    .withMessage("Password is required")
    .isLength({ min: 6 })
    .withMessage("Password must be at least 6 characters"),
  body("phone")
    .trim()
    .notEmpty()
    .withMessage("Phone number is required")
    .matches(/^[6-9]\d{9}$/)
    .withMessage("Please provide a valid 10-digit Indian phone number"),
  body("adminSecretKey")
    .notEmpty()
    .withMessage("Admin secret key is required"),
];

/**
 * Validation rules for user registration (teacher, parent)
 */
exports.registerUserValidation = [
  body("name")
    .trim()
    .notEmpty()
    .withMessage("Name is required")
    .isLength({ max: 50 })
    .withMessage("Name cannot exceed 50 characters"),
  body("email")
    .trim()
    .notEmpty()
    .withMessage("Email is required")
    .isEmail()
    .withMessage("Please provide a valid email")
    .normalizeEmail(),
  body("password")
    .notEmpty()
    .withMessage("Password is required")
    .isLength({ min: 6 })
    .withMessage("Password must be at least 6 characters"),
  body("phone")
    .trim()
    .notEmpty()
    .withMessage("Phone number is required")
    .matches(/^[6-9]\d{9}$/)
    .withMessage("Please provide a valid 10-digit Indian phone number"),
  body("role")
    .notEmpty()
    .withMessage("Role is required")
    .isIn(["teacher", "parent"])
    .withMessage("Invalid role. Allowed: teacher, parent"),
];

/**
 * Validation rules for login
 */
exports.loginValidation = [
  body("email")
    .optional({ nullable: true, checkFalsy: true })
    .trim()
    .isEmail()
    .withMessage("Please provide a valid email")
    .normalizeEmail(),
  body("phone")
    .optional({ nullable: true, checkFalsy: true })
    .trim()
    .matches(/^[6-9]\d{9}$/)
    .withMessage("Please provide a valid 10-digit Indian phone number"),
  body("password").notEmpty().withMessage("Password is required"),
  // Custom validation to ensure at least email or phone is provided
  (req, res, next) => {
    const { email, phone } = req.body;
    if (!email && !phone) {
      return res.status(400).json({
        success: false,
        error: "Please provide either email or phone number",
      });
    }
    if (email && phone) {
      return res.status(400).json({
        success: false,
        error: "Provide either email or phone number, not both",
      });
    }
    next();
  },
];

/**
 * Validation rules for profile update
 */
exports.updateProfileValidation = [
  body("name")
    .optional()
    .trim()
    .isLength({ max: 50 })
    .withMessage("Name cannot exceed 50 characters"),
  body("phone")
    .optional()
    .trim()
    .matches(/^[6-9]\d{9}$/)
    .withMessage("Please provide a valid 10-digit Indian phone number"),
];

/**
 * Validation rules for password change
 */
exports.changePasswordValidation = [
  body("currentPassword")
    .notEmpty()
    .withMessage("Current password is required"),
  body("newPassword")
    .notEmpty()
    .withMessage("New password is required")
    .isLength({ min: 6 })
    .withMessage("Password must be at least 6 characters"),
];

/**
 * Validation rules for admin password change
 */
exports.adminChangePasswordValidation = [
  body("newPassword")
    .notEmpty()
    .withMessage("New password is required")
    .isLength({ min: 6 })
    .withMessage("Password must be at least 6 characters"),
];
