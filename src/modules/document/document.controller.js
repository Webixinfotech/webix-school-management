/**
 * Document Controller
 *
 * Handles HTTP layer for the Documents module (achievement certificates,
 * leaving certificates, experience letters). Follows existing codebase
 * controller patterns (idCard, upload modules).
 */

const DocumentIssue = require("./document.model");
const User = require("../auth/user.model");
const Student = require("../student/student.model");
const Teacher = require("../teacher/teacher.model");
const Counter = require("../shared/counter.model");
const s3Service = require("../../services/s3.service");
const ErrorResponse = require("../../utils/errorResponse");
const logger = require("../../config/logger");

// Best-effort in-app notification on assign — never blocks document creation.
let inAppNotificationService = null;
try {
  inAppNotificationService = require("../notification/notification-in-app.service");
} catch (e) {
  logger.warn("[Document] notification-in-app.service not available, skipping notifications");
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

/**
 * Atomically generate a padded sequence number for a given counter key.
 */
const nextSequence = async (counterKey) => {
  const counter = await Counter.findOneAndUpdate(
    { name: counterKey },
    { $inc: { seq: 1 } },
    { new: true, upsert: true, setDefaultsOnInsert: true }
  );
  return counter.seq;
};

const pad = (num, size) => String(num).padStart(size, "0");

/**
 * Generate a School Leaving Certificate registration number.
 * Format: INDO<DDMMYY><SE><6-digit-seq>  (matches existing paper format)
 */
const generateLeavingRegNo = async () => {
  const now = new Date();
  const dd = pad(now.getDate(), 2);
  const mm = pad(now.getMonth() + 1, 2);
  const yy = pad(now.getFullYear() % 100, 2);
  const seq = await nextSequence("leaving_certificate");
  return `INDO${dd}${mm}${yy}SE${pad(seq, 6)}`;
};

/**
 * Generate an Experience Letter number.
 * Format: <year-short>lex/<seq>  (matches existing paper format, e.g. 25lex/1231)
 */
const generateExperienceLetterNumber = async () => {
  const yy = pad(new Date().getFullYear() % 100, 2);
  const seq = await nextSequence("experience_letter");
  return `${yy}lex/${1000 + seq}`;
};

const isAdminLike = (role) => role === "admin";

// ─── 1. Signature ─────────────────────────────────────────────────────────────

// POST /api/documents/signature
// Body: { image: "data:image/png;base64,...." }
exports.uploadSignature = async (req, res, next) => {
  try {
    const { image } = req.body;
    if (!image) {
      return next(new ErrorResponse("Please provide base64 image data", 400));
    }

    const uploadResult = await s3Service.uploadBase64ToS3(
      image,
      "signatures",
      req.user._id.toString(),
      "signature"
    );

    const updatedUser = await User.findByIdAndUpdate(
      req.user._id,
      { signatureUrl: uploadResult.url, signatureKey: uploadResult.key },
      { new: true, runValidators: true, select: "-password" }
    );

    if (!updatedUser) {
      return next(new ErrorResponse("User not found", 404));
    }

    res.status(200).json({
      success: true,
      message: "Signature uploaded successfully",
      data: { signatureUrl: updatedUser.signatureUrl },
    });
  } catch (err) {
    logger.error(`[Document] uploadSignature error: ${err.message}`);
    next(err);
  }
};

// GET /api/documents/signature
exports.getMySignature = async (req, res, next) => {
  try {
    res.status(200).json({
      success: true,
      data: { signatureUrl: req.user.signatureUrl || null },
    });
  } catch (err) {
    logger.error(`[Document] getMySignature error: ${err.message}`);
    next(err);
  }
};

// ─── 2. Prefill ───────────────────────────────────────────────────────────────

// GET /api/documents/prefill?docType=leaving|experience|achievement&studentId=&teacherId=
exports.getPrefillData = async (req, res, next) => {
  try {
    const { docType, studentId, teacherId } = req.query;

    if (!docType || !["achievement", "leaving", "experience"].includes(docType)) {
      return next(
        new ErrorResponse("docType must be one of: achievement, leaving, experience", 400)
      );
    }

    // Teachers may only prefill achievement certificates.
    if (req.user.role === "teacher" && docType !== "achievement") {
      return next(
        new ErrorResponse("Teachers can only create achievement certificates", 403)
      );
    }

    if (docType === "achievement" || docType === "leaving") {
      if (!studentId) {
        return next(new ErrorResponse("studentId is required for this docType", 400));
      }

      const student = await Student.findById(studentId);
      if (!student) {
        return next(new ErrorResponse("Student not found", 404));
      }

      const name = `${student.firstName || ""} ${student.lastName || ""}`.trim();

      if (docType === "achievement") {
        return res.status(200).json({
          success: true,
          data: {
            name,
            className: student.className || "",
          },
        });
      }

      // docType === "leaving"
      const regNo = await generateLeavingRegNo();
      const addr = student.address || {};
      const addressLine = [addr.street, addr.city, addr.state, addr.pincode]
        .filter(Boolean)
        .join(", ");

      return res.status(200).json({
        success: true,
        data: {
          regNo,
          dateOfIssue: new Date(),
          name,
          fatherName: student.parentDetails?.fatherName || "",
          motherName: student.parentDetails?.motherName || "",
          dob: student.dateOfBirth || null,
          dobInWords: "",
          admissionDate: student.admissionDate || null,
          nationality: "Indian",
          address: addressLine,
          className: student.className || "",
          section: student.section || "",
        },
      });
    }

    // docType === "experience"
    if (!teacherId) {
      return next(new ErrorResponse("teacherId is required for this docType", 400));
    }
    // Only admin/sub-admin may generate experience letters.
    if (!isAdminLike(req.user.role)) {
      return next(new ErrorResponse("Not authorized to create this document", 403));
    }

    const teacher = await Teacher.findById(teacherId);
    if (!teacher) {
      return next(new ErrorResponse("Teacher not found", 404));
    }

    const letterNumber = await generateExperienceLetterNumber();

    return res.status(200).json({
      success: true,
      data: {
        letterNumber,
        date: new Date(),
        name: teacher.name || "",
        designation: teacher.subjects
          ? `${teacher.subjects} Teacher`
          : "Pre-Primary Teacher",
        dateOfJoining: teacher.dateOfJoining || null,
        session: "",
        remarks: "",
      },
    });
  } catch (err) {
    logger.error(`[Document] getPrefillData error: ${err.message}`);
    next(err);
  }
};

// ─── 3. Create / Update ───────────────────────────────────────────────────────

// POST /api/documents
exports.createDocument = async (req, res, next) => {
  try {
    const { docType, templateName, sourceType, sourceId, fieldValues, assignedTo, signatureUrl } =
      req.body;

    if (!docType || !["achievement", "leaving", "experience"].includes(docType)) {
      return next(
        new ErrorResponse("docType must be one of: achievement, leaving, experience", 400)
      );
    }

    if (req.user.role === "teacher" && docType !== "achievement") {
      return next(
        new ErrorResponse("Teachers can only create achievement certificates", 403)
      );
    }

    const doc = await DocumentIssue.create({
      docType,
      templateName: templateName || null,
      sourceType: sourceType || null,
      sourceId: sourceId || null,
      fieldValues: fieldValues || {},
      signatureUrl: signatureUrl || req.user.signatureUrl || null,
      assignedTo: assignedTo || null,
      status: assignedTo ? "issued" : "draft",
      issuedBy: req.user._id,
    });

    if (assignedTo && inAppNotificationService) {
      const docLabel =
        docType === "achievement"
          ? "Certificate of Achievement"
          : docType === "leaving"
          ? "School Leaving Certificate"
          : "Experience Certificate";
      try {
        await inAppNotificationService.createNotification({
          title: "New Document Shared",
          body: `Your ${docLabel} is ready to view.`,
          type: "general",
          targetType: "specific",
          targetUserIds: [assignedTo],
          sender: req.user._id,
          priority: "medium",
          link: `/documents/${doc._id}`,
        });
      } catch (notifyErr) {
        logger.warn(`[Document] notification failed (non-blocking): ${notifyErr.message}`);
      }
    }

    res.status(201).json({
      success: true,
      message: "Document saved successfully",
      data: doc,
    });
  } catch (err) {
    logger.error(`[Document] createDocument error: ${err.message}`);
    next(err);
  }
};

// PUT /api/documents/:id
exports.updateDocument = async (req, res, next) => {
  try {
    const doc = await DocumentIssue.findById(req.params.id);
    if (!doc) {
      return next(new ErrorResponse("Document not found", 404));
    }

    if (String(doc.issuedBy) !== String(req.user._id) && !isAdminLike(req.user.role)) {
      return next(new ErrorResponse("Not authorized to edit this document", 403));
    }

    const { fieldValues, templateName, assignedTo } = req.body;

    if (fieldValues !== undefined) doc.fieldValues = fieldValues;
    if (templateName !== undefined) doc.templateName = templateName;
    if (assignedTo !== undefined) {
      doc.assignedTo = assignedTo || null;
      doc.status = assignedTo ? "issued" : "draft";
    }

    await doc.save();

    if (assignedTo && inAppNotificationService) {
      try {
        await inAppNotificationService.createNotification({
          title: "Document Updated",
          body: "A document assigned to you was updated.",
          type: "general",
          targetType: "specific",
          targetUserIds: [assignedTo],
          sender: req.user._id,
          priority: "low",
          link: `/documents/${doc._id}`,
        });
      } catch (notifyErr) {
        logger.warn(`[Document] notification failed (non-blocking): ${notifyErr.message}`);
      }
    }

    res.status(200).json({
      success: true,
      message: "Document updated successfully",
      data: doc,
    });
  } catch (err) {
    logger.error(`[Document] updateDocument error: ${err.message}`);
    next(err);
  }
};

// ─── 4. Listing / Detail ──────────────────────────────────────────────────────

// GET /api/documents/my-documents
exports.getMyDocuments = async (req, res, next) => {
  try {
    const docs = await DocumentIssue.find({ assignedTo: req.user._id })
      .populate("issuedBy", "name email role")
      .sort({ createdAt: -1 });
    res.status(200).json({ success: true, count: docs.length, data: docs });
  } catch (err) {
    logger.error(`[Document] getMyDocuments error: ${err.message}`);
    next(err);
  }
};

// GET /api/documents/issued-by-me?docType=
exports.listMyIssuedDocuments = async (req, res, next) => {
  try {
    const { docType } = req.query;
    const filter = { issuedBy: req.user._id };
    if (docType) filter.docType = docType;

    const docs = await DocumentIssue.find(filter)
      .populate("assignedTo", "name email role")
      .sort({ createdAt: -1 });
    res.status(200).json({ success: true, count: docs.length, data: docs });
  } catch (err) {
    logger.error(`[Document] listMyIssuedDocuments error: ${err.message}`);
    next(err);
  }
};

// GET /api/documents/:id
exports.getDocumentById = async (req, res, next) => {
  try {
    const doc = await DocumentIssue.findById(req.params.id)
      .populate("assignedTo", "name email role")
      .populate("issuedBy", "name email role");
    if (!doc) {
      return next(new ErrorResponse("Document not found", 404));
    }

    const assignedToId = doc.assignedTo?._id || doc.assignedTo;
    const issuedById = doc.issuedBy?._id || doc.issuedBy;

    const isOwner = assignedToId && String(assignedToId) === String(req.user._id);
    const isIssuer = issuedById && String(issuedById) === String(req.user._id);

    if (!isOwner && !isIssuer && !isAdminLike(req.user.role)) {
      return next(new ErrorResponse("Not authorized to view this document", 403));
    }

    res.status(200).json({ success: true, data: doc });
  } catch (err) {
    logger.error(`[Document] getDocumentById error: ${err.message}`);
    next(err);
  }
};