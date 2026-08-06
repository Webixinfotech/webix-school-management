const { body, query } = require("express-validator");

/**
 * Validation rules for updating a parent
 */
exports.updateParentValidation = [
  body("name")
    .optional()
    .trim()
    .isLength({ max: 100 })
    .withMessage("Name cannot exceed 100 characters"),
  body("phone")
    .optional()
    .trim()
    .custom((value) => {
      if (value && !/^[6-9]\d{9}$/.test(value)) {
        throw new Error("Phone number must be a valid 10-digit Indian number");
      }
      return true;
    }),
  body("address")
    .optional()
    .custom((value, { req }) => {
      const addressData = typeof value === "string" ? JSON.parse(value) : value;

      if (addressData.street && addressData.street.length > 200) {
        throw new Error("Street address cannot exceed 200 characters");
      }
      if (addressData.city && addressData.city.length > 100) {
        throw new Error("City cannot exceed 100 characters");
      }
      if (addressData.state && addressData.state.length > 100) {
        throw new Error("State cannot exceed 100 characters");
      }
      if (addressData.pincode && !/^\d{6}$/.test(addressData.pincode)) {
        throw new Error("Pincode must be a valid 6-digit number");
      }

      // Store parsed data back to req.body for controller
      req.body.address = addressData;
      return true;
    }),
];

/**
 * Validation rules for updating own profile (parent self-service)
 */
exports.updateMyProfileValidation = [
  body("name")
    .optional()
    .trim()
    .isLength({ max: 100 })
    .withMessage("Name cannot exceed 100 characters"),
  body("phone")
    .optional()
    .trim()
    .custom((value) => {
      if (value && !/^[6-9]\d{9}$/.test(value)) {
        throw new Error("Phone number must be a valid 10-digit Indian number");
      }
      return true;
    }),
  body("address")
    .optional()
    .custom((value, { req }) => {
      const addressData = typeof value === "string" ? JSON.parse(value) : value;

      if (addressData.street && addressData.street.length > 200) {
        throw new Error("Street address cannot exceed 200 characters");
      }
      if (addressData.city && addressData.city.length > 100) {
        throw new Error("City cannot exceed 100 characters");
      }
      if (addressData.state && addressData.state.length > 100) {
        throw new Error("State cannot exceed 100 characters");
      }
      if (addressData.pincode && !/^\d{6}$/.test(addressData.pincode)) {
        throw new Error("Pincode must be a valid 6-digit number");
      }

      // Store parsed data back to req.body for controller
      req.body.address = addressData;
      return true;
    }),
];

/**
 * Validation rules for querying parents
 */
exports.getParentsValidation = [
  query("status")
    .optional()
    .isIn(["active", "inactive"])
    .withMessage("Status must be active or inactive"),
  query("page")
    .optional()
    .isInt({ min: 1 })
    .withMessage("Page must be a positive integer"),
  query("limit")
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage("Limit must be between 1 and 100"),
];
