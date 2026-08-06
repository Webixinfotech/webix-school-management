const { body, param, query } = require("express-validator");

/**
 * Validation rules for creating a class
 */
exports.createClassValidation = [
  body("name")
    .trim()
    .notEmpty()
    .withMessage("Class name is required")
    .isLength({ max: 100 })
    .withMessage("Class name cannot exceed 100 characters"),
  body("section")
    .optional()
    .trim()
    .isLength({ max: 50 })
    .withMessage("Section cannot exceed 50 characters"),
  body("classType")
    .notEmpty()
    .withMessage("Class type is required")
    .isIn(["FIXED_TIME", "FLEX_TIME", "HOURS_BASED"])
    .withMessage("classType must be FIXED_TIME, FLEX_TIME, or HOURS_BASED"),
  body("startTime").custom((value, { req }) => {
    if (req.body.classType === "FIXED_TIME" && !value) {
      throw new Error("startTime is required for FIXED_TIME class");
    }
    return true;
  }),
  body("endTime").custom((value, { req }) => {
    if (req.body.classType === "FIXED_TIME" && !value) {
      throw new Error("endTime is required for FIXED_TIME class");
    }
    return true;
  }),
  body("days").optional().isArray().withMessage("Days must be an array"),
  body("days.*")
    .optional()
    .isIn(["MON", "TUE", "WED", "THU", "FRI", "SAT", "SUN"])
    .withMessage("{VALUE} is not a valid day"),
  body("level")
    .optional()
    .isInt({ min: 0, max: 100 })
    .withMessage("Level must be between 0 and 100"),
  body("status")
    .optional()
    .isIn(["Active", "Inactive"])
    .withMessage("Status must be Active or Inactive"),
  body("teacherId")
    .optional()
    .isMongoId()
    .withMessage("Invalid teacher ID format"),
  body("installmentTemplate")
    .optional()
    .isArray()
    .withMessage("installmentTemplate must be an array"),
  body("installmentTemplate.*.seq")
    .optional()
    .isInt({ min: 1 })
    .withMessage("installmentTemplate.seq must be a positive integer"),
  body("installmentTemplate.*.amount")
    .optional()
    .isFloat({ min: 0 })
    .withMessage("installmentTemplate.amount must be >= 0"),
  body("installmentTemplate.*.offsetDays")
    .optional()
    .isInt({ min: 0 })
    .withMessage("installmentTemplate.offsetDays must be >= 0"),
  body("isPrepaidHoursCard")
    .optional()
    .isBoolean()
    .withMessage("isPrepaidHoursCard must be a boolean"),
  body("hoursInTier")
    .optional()
    .isInt({ min: 0 })
    .withMessage("hoursInTier must be >= 0"),
];

/**
 * Validation rules for updating a class
 */
exports.updateClassValidation = [
  body("name")
    .optional()
    .trim()
    .isLength({ max: 100 })
    .withMessage("Class name cannot exceed 100 characters"),
  body("section")
    .optional()
    .trim()
    .isLength({ max: 50 })
    .withMessage("Section cannot exceed 50 characters"),
  body("classType")
    .optional()
    .isIn(["FIXED_TIME", "FLEX_TIME", "HOURS_BASED"])
    .withMessage("classType must be FIXED_TIME, FLEX_TIME, or HOURS_BASED"),
  body("startTime").custom((value, { req }) => {
    const classType = req.body.classType;
    // If changing to FIXED_TIME, startTime is required
    if (classType === "FIXED_TIME" && !value) {
      // Allow if existing class has startTime (checked in service)
      return true;
    }
    return true;
  }),
  body("endTime").custom((value, { req }) => {
    const classType = req.body.classType;
    if (classType === "FIXED_TIME" && !value) {
      return true;
    }
    return true;
  }),
  body("days").optional().isArray().withMessage("Days must be an array"),
  body("days.*")
    .optional()
    .isIn(["MON", "TUE", "WED", "THU", "FRI", "SAT", "SUN"])
    .withMessage("{VALUE} is not a valid day"),
  body("level")
    .optional()
    .isInt({ min: 0, max: 100 })
    .withMessage("Level must be between 0 and 100"),
  body("status")
    .optional()
    .isIn(["Active", "Inactive"])
    .withMessage("Status must be Active or Inactive"),
  body("installmentTemplate")
    .optional()
    .isArray()
    .withMessage("installmentTemplate must be an array"),
  body("installmentTemplate.*.seq")
    .optional()
    .isInt({ min: 1 })
    .withMessage("installmentTemplate.seq must be a positive integer"),
  body("installmentTemplate.*.amount")
    .optional()
    .isFloat({ min: 0 })
    .withMessage("installmentTemplate.amount must be >= 0"),
  body("installmentTemplate.*.offsetDays")
    .optional()
    .isInt({ min: 0 })
    .withMessage("installmentTemplate.offsetDays must be >= 0"),
  body("isPrepaidHoursCard")
    .optional()
    .isBoolean()
    .withMessage("isPrepaidHoursCard must be a boolean"),
  body("hoursInTier")
    .optional()
    .isInt({ min: 0 })
    .withMessage("hoursInTier must be >= 0"),
];

/**
 * Validation rules for assigning a teacher
 */
exports.assignTeacherValidation = [
  body("teacherId")
    .optional({ nullable: true, checkFalsy: true })
    .isMongoId()
    .withMessage("Invalid teacher ID format"),
];

/**
 * Validation rules for class type parameter
 */
exports.classTypeParamValidation = [
  param("classType")
    .isIn(["FIXED_TIME", "FLEX_TIME", "HOURS_BASED"])
    .withMessage("classType must be FIXED_TIME, FLEX_TIME, or HOURS_BASED"),
];

/**
 * Validation rules for day parameter
 */
exports.dayParamValidation = [
  param("day")
    .isIn(["MON", "TUE", "WED", "THU", "FRI", "SAT", "SUN"])
    .withMessage("Invalid day. Must be MON, TUE, WED, THU, FRI, SAT, or SUN"),
];

/**
 * Validation rules for querying classes
 */
exports.getClassesValidation = [
  query("page")
    .optional()
    .isInt({ min: 1 })
    .withMessage("Page must be a positive integer"),
  query("limit")
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage("Limit must be between 1 and 100"),
  query("status")
    .optional()
    .isIn(["Active", "Inactive"])
    .withMessage("Status must be Active or Inactive"),
];
