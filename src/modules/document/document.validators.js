const { body, param } = require("express-validator");

/**
 * Validation rules for creating a document (POST /api/documents)
 * Mirrors the DocumentIssue model constraints. fieldValues stays a loosely
 * validated object by design (Mixed blob, no fixed shape — see document.model.js).
 */
exports.createDocumentValidation = [
  body("docType")
    .notEmpty()
    .withMessage("docType is required")
    .isIn(["achievement", "leaving", "experience"])
    .withMessage("docType must be one of: achievement, leaving, experience"),
  body("templateName")
    .optional({ nullable: true })
    .trim()
    .isLength({ max: 100 })
    .withMessage("templateName cannot exceed 100 characters"),
  body("sourceType")
    .optional({ nullable: true })
    .isIn(["student", "teacher"])
    .withMessage("sourceType must be student or teacher"),
  body("sourceId")
    .optional({ nullable: true })
    .isMongoId()
    .withMessage("Invalid sourceId"),
  body("fieldValues")
    .optional()
    .isObject()
    .withMessage("fieldValues must be an object"),
  body("assignedTo")
    .optional({ nullable: true })
    .custom((value) => {
      if (!value) return true;
      const id = typeof value === 'object' ? (value._id || value.id) : value;
      if (!require('mongoose').Types.ObjectId.isValid(id)) {
        throw new Error("Invalid assignedTo user id");
      }
      return true;
    }),
  body("signatureUrl")
    .optional({ nullable: true })
    .isString()
    .withMessage("signatureUrl must be a string"),
];

/**
 * Validation rules for updating a document (PUT /api/documents/:id)
 */
exports.updateDocumentValidation = [
  param("id").isMongoId().withMessage("Invalid document id"),
  body("fieldValues")
    .optional()
    .isObject()
    .withMessage("fieldValues must be an object"),
  body("templateName")
    .optional({ nullable: true })
    .trim()
    .isLength({ max: 100 })
    .withMessage("templateName cannot exceed 100 characters"),
  body("assignedTo")
    .optional({ nullable: true })
    .custom((value) => {
      if (!value) return true;
      const id = typeof value === 'object' ? (value._id || value.id) : value;
      if (!require('mongoose').Types.ObjectId.isValid(id)) {
        throw new Error("Invalid assignedTo user id");
      }
      return true;
    }),
];
