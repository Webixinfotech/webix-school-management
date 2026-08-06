/**
 * ID Card Controller
 *
 * Handles HTTP layer for all ID card APIs.
 * Follows existing codebase controller patterns.
 */

const idCardService = require("./idCard.service");
const ErrorResponse = require("../../utils/errorResponse");
const logger = require("../../config/logger");

// ─── Template Management ─────────────────────────────────────────────────────

// GET /api/id-cards/templates?type=student|staff
exports.listTemplates = async (req, res, next) => {
  try {
    const { type } = req.query;
    if (type && !["student", "staff"].includes(type)) {
      return next(new ErrorResponse("Invalid type. Must be: student or staff", 400));
    }
    const templates = await idCardService.listTemplates(type || null);
    res.status(200).json({ success: true, count: templates.length, data: templates });
  } catch (err) {
    logger.error("[IdCard] listTemplates error:", err.message);
    next(err);
  }
};

// POST /api/id-cards/templates
exports.createTemplate = async (req, res, next) => {
  try {
    const { name, type } = req.body;
    if (!name?.trim()) return next(new ErrorResponse("Template name is required", 400));
    if (!["student", "staff"].includes(type)) return next(new ErrorResponse("type must be student or staff", 400));

    const template = await idCardService.createTemplate(req.body, req.user._id);
    res.status(201).json({ success: true, message: "Template created successfully", data: template });
  } catch (err) {
    logger.error("[IdCard] createTemplate error:", err.message);
    next(err);
  }
};

// PUT /api/id-cards/templates/:id
exports.updateTemplate = async (req, res, next) => {
  try {
    const template = await idCardService.updateTemplate(req.params.id, req.body);
    res.status(200).json({ success: true, message: "Template updated successfully", data: template });
  } catch (err) {
    logger.error("[IdCard] updateTemplate error:", err.message);
    next(err);
  }
};

// DELETE /api/id-cards/templates/:id
exports.deleteTemplate = async (req, res, next) => {
  try {
    const result = await idCardService.deleteTemplate(req.params.id);
    res.status(200).json({ success: true, ...result });
  } catch (err) {
    logger.error("[IdCard] deleteTemplate error:", err.message);
    next(err);
  }
};

// ─── ID Card Data (JSON preview) ─────────────────────────────────────────────

// GET /api/id-cards/student/:id
// Returns full ID card data payload (for frontend preview rendering)
exports.getStudentIdCardData = async (req, res, next) => {
  try {
    if (req.user.role === "teacher") {
      await idCardService.assertTeacherCanAccessStudent(req.user._id, req.params.id);
    }
    const data = await idCardService.getStudentIdCardData(req.params.id);
    res.status(200).json({ success: true, message: "Student ID card data fetched", data });
  } catch (err) {
    logger.error("[IdCard] getStudentIdCardData error:", err.message);
    next(err);
  }
};

// GET /api/id-cards/staff/:id
exports.getStaffIdCardData = async (req, res, next) => {
  try {
    const data = await idCardService.getStaffIdCardData(req.params.id);
    res.status(200).json({ success: true, message: "Staff ID card data fetched", data });
  } catch (err) {
    logger.error("[IdCard] getStaffIdCardData error:", err.message);
    next(err);
  }
};

// ─── PDF Download ─────────────────────────────────────────────────────────────

// GET /api/id-cards/student/:id/download?templateId=xxx
exports.downloadStudentIdCard = async (req, res, next) => {
  try {
    if (req.user.role === "teacher") {
      await idCardService.assertTeacherCanAccessStudent(req.user._id, req.params.id);
    }
    const { templateId } = req.query;
    const { buffer, filename } = await idCardService.generateStudentPDF(
      req.params.id,
      templateId || null,
      req.user._id
    );

    res.set({
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="${filename}"`,
      "Content-Length": buffer.length,
      "Cache-Control": "no-cache",
    });
    res.status(200).end(buffer);
  } catch (err) {
    logger.error("[IdCard] downloadStudentIdCard error:", err.message);
    next(err);
  }
};

// GET /api/id-cards/staff/:id/download?templateId=xxx
exports.downloadStaffIdCard = async (req, res, next) => {
  try {
    const { templateId } = req.query;
    const { buffer, filename } = await idCardService.generateStaffPDF(
      req.params.id,
      templateId || null,
      req.user._id
    );

    res.set({
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="${filename}"`,
      "Content-Length": buffer.length,
      "Cache-Control": "no-cache",
    });
    res.status(200).end(buffer);
  } catch (err) {
    logger.error("[IdCard] downloadStaffIdCard error:", err.message);
    next(err);
  }
};

// ─── Bulk Generation ──────────────────────────────────────────────────────────

// POST /api/id-cards/student/bulk
// Body: { className, section, studentIds[], templateId }
exports.bulkStudentIdCards = async (req, res, next) => {
  try {
    const { className, section, session, studentIds, templateId } = req.body;

    // Validate studentIds if provided
    if (studentIds && !Array.isArray(studentIds)) {
      return next(new ErrorResponse("studentIds must be an array", 400));
    }

    const { buffer, filename, count } = await idCardService.generateBulkStudentPDF(
      { className, section, session, studentIds },
      templateId || null,
      req.user._id
    );

    res.set({
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="${filename}"`,
      "Content-Length": buffer.length,
      "X-Generated-Count": count,
    });
    res.status(200).end(buffer);
  } catch (err) {
    logger.error("[IdCard] bulkStudentIdCards error:", err.message);
    next(err);
  }
};

// POST /api/id-cards/staff/bulk
// Body: { teacherIds[], templateId }
exports.bulkStaffIdCards = async (req, res, next) => {
  try {
    const { teacherIds, templateId } = req.body;

    if (teacherIds && !Array.isArray(teacherIds)) {
      return next(new ErrorResponse("teacherIds must be an array", 400));
    }

    const { buffer, filename, count } = await idCardService.generateBulkStaffPDF(
      { teacherIds },
      templateId || null,
      req.user._id
    );

    res.set({
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="${filename}"`,
      "Content-Length": buffer.length,
      "X-Generated-Count": count,
    });
    res.status(200).end(buffer);
  } catch (err) {
    logger.error("[IdCard] bulkStaffIdCards error:", err.message);
    next(err);
  }
};

// ─── QR Code ─────────────────────────────────────────────────────────────────

// GET /api/id-cards/student/:id/qr
exports.getStudentQR = async (req, res, next) => {
  try {
    if (req.user.role === "teacher") {
      await idCardService.assertTeacherCanAccessStudent(req.user._id, req.params.id);
    }
    const data = await idCardService.getStudentQRCode(req.params.id);
    res.status(200).json({ success: true, data });
  } catch (err) {
    logger.error("[IdCard] getStudentQR error:", err.message);
    next(err);
  }
};

// GET /api/id-cards/staff/:id/qr
exports.getStaffQR = async (req, res, next) => {
  try {
    const data = await idCardService.getStaffQRCode(req.params.id);
    res.status(200).json({ success: true, data });
  } catch (err) {
    logger.error("[IdCard] getStaffQR error:", err.message);
    next(err);
  }
};

// ─── Export Logs ─────────────────────────────────────────────────────────────

// GET /api/id-cards/export-logs?cardType=student&page=1&limit=20
exports.getExportLogs = async (req, res, next) => {
  try {
    const { cardType, page = 1, limit = 20 } = req.query;
    const result = await idCardService.getExportLogs({ cardType }, parseInt(page), parseInt(limit));
    res.status(200).json({ success: true, ...result });
  } catch (err) {
    logger.error("[IdCard] getExportLogs error:", err.message);
    next(err);
  }
};

// ─── Parent: View own child's ID card ────────────────────────────────────────

// GET /api/id-cards/my-child/:studentId
// Parent can only fetch their own child — validated by parentUserId check
exports.parentViewChildIdCard = async (req, res, next) => {
  try {
    const Student = require("../student/student.model");
    const student = await Student.findOne({
      _id: req.params.studentId,
      parentUserId: req.user._id,   // Ensures parent can only access their child
      status: "Active",
    }).select("_id").lean();

    if (!student) {
      return next(new ErrorResponse("Student not found or access denied", 403));
    }

    const data = await idCardService.getStudentIdCardData(req.params.studentId);
    res.status(200).json({ success: true, message: "Child ID card data fetched", data });
  } catch (err) {
    logger.error("[IdCard] parentViewChildIdCard error:", err.message);
    next(err);
  }
};

// GET /api/id-cards/my-child/:studentId/download
exports.parentDownloadChildIdCard = async (req, res, next) => {
  try {
    const Student = require("../student/student.model");
    const student = await Student.findOne({
      _id: req.params.studentId,
      parentUserId: req.user._id,
      status: "Active",
    }).select("_id").lean();

    if (!student) {
      return next(new ErrorResponse("Student not found or access denied", 403));
    }

    const { buffer, filename } = await idCardService.generateStudentPDF(
      req.params.studentId,
      null,
      req.user._id
    );

    res.set({
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="${filename}"`,
      "Content-Length": buffer.length,
    });
    res.status(200).end(buffer);
  } catch (err) {
    logger.error("[IdCard] parentDownloadChildIdCard error:", err.message);
    next(err);
  }
};




// Future: Add routes for managing ID card templates (CRUD) and fetching template list


// ─────────────────────────────────────────────────────────────────────────────
// ADD these 3 functions to the BOTTOM of idCard.controller.js
// (before the closing — do not replace anything, just append)
// ─────────────────────────────────────────────────────────────────────────────

// ── NEW: Preview (no PDF) ────────────────────────────────────────────────────
exports.previewTemplate = async (req, res, next) => {
  try {
    const { templateId, entityType, entityId } = req.body;
    if (!entityType || !entityId) {
      return next(new ErrorResponse("entityType and entityId are required", 400));
    }
    const data = await idCardService.previewTemplate({ templateId, entityType, entityId });
    res.status(200).json({ success: true, data });
  } catch (err) {
    next(err);
  }
};

// ── NEW: A4 Sheet PDF Download ───────────────────────────────────────────────

exports.downloadStudentA4Sheet = async (req, res, next) => {
  try {
    const { className, section, session, studentIds, templateId } = req.body;

    if (studentIds && !Array.isArray(studentIds)) {
      return next(new ErrorResponse("studentIds must be an array", 400));
    }

    const { buffer, filename, count } = await idCardService.generateStudentA4SheetPDF(
      { className, section, session, studentIds },
      templateId || null,
      req.user._id
    );

    res.set({
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="${filename}"`,
      "Content-Length": buffer.length,
      "X-Generated-Count": count,
    });
    res.status(200).end(buffer);
  } catch (err) {
    logger.error("[IdCard] downloadStudentA4Sheet error:", err.message);
    next(err);
  }
};

exports.downloadStaffA4Sheet = async (req, res, next) => {
  try {
    const { teacherIds, templateId } = req.body;

    if (teacherIds && !Array.isArray(teacherIds)) {
      return next(new ErrorResponse("teacherIds must be an array", 400));
    }

    const { buffer, filename, count } = await idCardService.generateStaffA4SheetPDF(
      { teacherIds },
      templateId || null,
      req.user._id
    );

    res.set({
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="${filename}"`,
      "Content-Length": buffer.length,
      "X-Generated-Count": count,
    });
    res.status(200).end(buffer);
  } catch (err) {
    logger.error("[IdCard] downloadStaffA4Sheet error:", err.message);
    next(err);
  }
};