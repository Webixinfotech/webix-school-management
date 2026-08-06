const { validationResult } = require("express-validator");
const ErrorResponse = require("../utils/errorResponse");

/**
 * Validation middleware - checks express-validator results
 * Should be placed after validation arrays in routes
 */
const validate = (req, res, next) => {
  const errors = validationResult(req);

  if (!errors.isEmpty()) {
    const errorMessages = errors.array().map((err) => err.msg);
    return next(new ErrorResponse(errorMessages.join(", "), 400));
  }

  next();
};

module.exports = validate;
