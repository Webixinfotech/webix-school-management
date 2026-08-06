const { body, validationResult } = require("express-validator");
const ErrorResponse = require("../../utils/errorResponse");

const parseArrayValue = (value) => {
  if (value === undefined) return value;
  if (Array.isArray(value)) return value;
  if (typeof value !== "string") return [value];

  const trimmed = value.trim();
  if (!trimmed) return [];

  try {
    const parsed = JSON.parse(trimmed);
    return Array.isArray(parsed) ? parsed : [parsed];
  } catch (err) {
    return trimmed.split(",").map((item) => item.trim()).filter(Boolean);
  }
};

const dateRangeValidator = (value, { req }) => {
  if (!req.body.startDate || !req.body.endDate) return true;
  return new Date(req.body.endDate) > new Date(req.body.startDate);
};

const linkUrlValidator = (value, { req }) => {
  const linkType = req.body.linkType || "none";
  const url = value || "";

  if (linkType === "none") return true;
  if (!url.trim()) {
    throw new Error("linkUrl is required when linkType is not 'none'");
  }
  if (linkType === "internal" && !url.startsWith("/")) {
    throw new Error("Internal linkUrl must start with /");
  }
  return true;
};

const createTargetRules = [
  body("targetType")
    .notEmpty()
    .withMessage("Target type is required")
    .isIn(["all", "class", "specific"])
    .withMessage("Target type must be all, class, or specific"),
  body("targetClassIds")
    .customSanitizer(parseArrayValue)
    .if(body("targetType").equals("class"))
    .isArray({ min: 1 })
    .withMessage("Select at least one class for class-wise targeting"),
  body("targetClassIds.*")
    .if(body("targetType").equals("class"))
    .isMongoId()
    .withMessage("Each targetClassId must be a valid MongoDB ObjectId"),
  body("targetParentIds")
    .customSanitizer(parseArrayValue)
    .if(body("targetType").equals("specific"))
    .isArray({ min: 1 })
    .withMessage("Select at least one parent for specific targeting"),
  body("targetParentIds.*")
    .if(body("targetType").equals("specific"))
    .isMongoId()
    .withMessage("Each targetParentId must be a valid MongoDB ObjectId"),
];

const updateTargetRules = [
  body("targetType")
    .optional()
    .isIn(["all", "class", "specific"])
    .withMessage("Target type must be all, class, or specific"),
  body("targetClassIds")
    .optional()
    .customSanitizer(parseArrayValue)
    .isArray({ min: 1 })
    .withMessage("targetClassIds must be a non-empty array"),
  body("targetClassIds.*")
    .optional()
    .isMongoId()
    .withMessage("Each targetClassId must be a valid MongoDB ObjectId"),
  body("targetParentIds")
    .optional()
    .customSanitizer(parseArrayValue)
    .isArray({ min: 1 })
    .withMessage("targetParentIds must be a non-empty array"),
  body("targetParentIds.*")
    .optional()
    .isMongoId()
    .withMessage("Each targetParentId must be a valid MongoDB ObjectId"),
  body().custom((bodyValue) => {
    if (
      bodyValue.targetType === "class" &&
      Object.prototype.hasOwnProperty.call(bodyValue, "targetClassIds") &&
      (!Array.isArray(bodyValue.targetClassIds) ||
        bodyValue.targetClassIds.length === 0)
    ) {
      throw new Error("Select at least one class for class-wise targeting");
    }
    if (
      bodyValue.targetType === "specific" &&
      Object.prototype.hasOwnProperty.call(bodyValue, "targetParentIds") &&
      (!Array.isArray(bodyValue.targetParentIds) ||
        bodyValue.targetParentIds.length === 0)
    ) {
      throw new Error("Select at least one parent for specific targeting");
    }
    return true;
  }),
];

exports.validateCreateAdvertisement = [
  body("title")
    .notEmpty()
    .withMessage("Title is required")
    .isString()
    .withMessage("Title must be a string")
    .isLength({ min: 1, max: 100 })
    .withMessage("Title must be between 1 and 100 characters"),
  body("linkType")
    .optional()
    .isIn(["none", "external", "internal"])
    .withMessage("linkType must be none, external, or internal"),
  body("linkUrl")
    .custom(linkUrlValidator)
    .if(body("linkType").equals("external"))
    .isURL()
    .withMessage("External linkUrl must be a valid URL"),
  ...createTargetRules,
  body("startDate")
    .optional({ nullable: true, checkFalsy: true })
    .isISO8601()
    .withMessage("startDate must be a valid date (ISO 8601)"),
  body("endDate")
    .optional({ nullable: true, checkFalsy: true })
    .isISO8601()
    .withMessage("endDate must be a valid date (ISO 8601)")
    .custom(dateRangeValidator)
    .withMessage("endDate must be after startDate"),
  body("priority")
    .optional()
    .isInt()
    .withMessage("Priority must be an integer"),
];

exports.validateUpdateAdvertisement = [
  body("title")
    .optional()
    .isString()
    .withMessage("Title must be a string")
    .isLength({ min: 1, max: 100 })
    .withMessage("Title must be between 1 and 100 characters"),
  body("linkType")
    .optional()
    .isIn(["none", "external", "internal"])
    .withMessage("linkType must be none, external, or internal"),
  body("linkUrl")
    .optional({ checkFalsy: false })
    .custom(linkUrlValidator)
    .if(body("linkType").equals("external"))
    .isURL()
    .withMessage("External linkUrl must be a valid URL"),
  body().custom((bodyValue) => {
    if (bodyValue.linkType === "none" || bodyValue.linkType === undefined) {
      return true;
    }
    if (!bodyValue.linkUrl || !bodyValue.linkUrl.trim()) {
      throw new Error("linkUrl is required when linkType is not 'none'");
    }
    if (bodyValue.linkType === "internal" && !bodyValue.linkUrl.startsWith("/")) {
      throw new Error("Internal linkUrl must start with /");
    }
    return true;
  }),
  ...updateTargetRules,
  body("startDate")
    .optional({ nullable: true, checkFalsy: true })
    .isISO8601()
    .withMessage("startDate must be a valid date (ISO 8601)"),
  body("endDate")
    .optional({ nullable: true, checkFalsy: true })
    .isISO8601()
    .withMessage("endDate must be a valid date (ISO 8601)")
    .custom(dateRangeValidator)
    .withMessage("endDate must be after startDate"),
  body("priority")
    .optional()
    .isInt()
    .withMessage("Priority must be an integer"),
];

exports.handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);

  if (!errors.isEmpty()) {
    const errorMessages = errors.array().map((err) => err.msg);
    return next(new ErrorResponse(errorMessages.join(", "), 400));
  }

  next();
};
