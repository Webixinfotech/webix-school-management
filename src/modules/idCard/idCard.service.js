/**
 * ID Card Service — v2 (Dynamic Template Engine)
 *
 * BACKWARD COMPATIBLE: All existing function signatures preserved.
 * NEW: previewTemplate(), updateTemplateVersioned(), listTemplateVersions()
 */

const mongoose = require("mongoose");
const Student  = require("../student/student.model");
const Teacher  = require("../teacher/teacher.model");
const { IdCardTemplate, IdCardExportLog, DEFAULT_STUDENT_LAYOUT, DEFAULT_STAFF_LAYOUT } = require("./idCard.model");
const { generateQRCodeDataURL, buildStudentQRData, buildStaffQRData } = require("./idCard.qr");
const {
  generateStudentIdCardPDF,
  generateStaffIdCardPDF,
  generateBulkStudentIdCardPDF,
  generateBulkStaffIdCardPDF,
  generateStudentA4SheetPDF,
  generateStaffA4SheetPDF,
} = require("./idCard.pdf");
const ErrorResponse = require("../../utils/errorResponse");
const logger = require("../../config/logger");

// ─── Default templates (unchanged from v1) ────────────────────────────────────

const DEFAULT_STUDENT_TEMPLATE = {
  name: "Default Student Template",
  type: "student",
  isDefault: true,
  orientation: "portrait",
  layoutMode: "legacy",
  branding: {
    schoolName:     process.env.SCHOOL_NAME || "BrainBuilder School",
    schoolLogo:     process.env.SCHOOL_LOGO_URL || null,
    tagline:        process.env.SCHOOL_TAGLINE || "Excellence in Education",
    primaryColor:   "#1a237e",
    secondaryColor: "#ffffff",
    accentColor:    "#ffd600",
    textColor:      "#212121",
  },
  header:   { showSchoolName: true, showLogo: true, showTagline: true, backgroundColor: "#1a237e", textColor: "#ffffff" },
  body:     { showPhoto: true, showName: true, showId: true, showClass: true, showSection: true, showRollNo: true,
              showDob: true, showBloodGroup: true, showParentName: true, showContact: true, showAddress: false, showSession: true, showValidity: true },
  backSide: { enabled: true, showQrCode: true, showBarcode: false, showEmergencyContact: true, showSignatureArea: true, backgroundColor: "#f5f5f5" },
  footer:   { showValidity: true, backgroundColor: "#1a237e", textColor: "#ffffff", customText: "" },
  qrConfig: { type: "qr", dataType: "id", size: 80, errorCorrectionLevel: "M" },
  session:      `${new Date().getFullYear()}-${String(new Date().getFullYear() + 1).slice(-2)}`,
  validityDate: new Date(new Date().getFullYear() + 1, 2, 31),
};

const DEFAULT_STAFF_TEMPLATE = {
  ...DEFAULT_STUDENT_TEMPLATE,
  name:     "Default Staff Template",
  type:     "staff",
  branding: { ...DEFAULT_STUDENT_TEMPLATE.branding, primaryColor: "#004d40", accentColor: "#00796b" },
  header:   { ...DEFAULT_STUDENT_TEMPLATE.header, backgroundColor: "#004d40" },
  body:     { showPhoto: true, showName: true, showId: true, showDesignation: true, showDepartment: true,
              showDob: true, showBloodGroup: true, showContact: true, showAddress: false, showJoiningDate: false, showValidity: true },
  footer:   { ...DEFAULT_STUDENT_TEMPLATE.footer, backgroundColor: "#004d40" },
};

// ─── Layout validation ────────────────────────────────────────────────────────

const VALID_BLOCK_TYPES = [
  "logo","photo","qr","schoolName","tagline",
  "studentName","studentId","class","section","rollNo","dob","bloodGroup","parentName","contact","session","transport",
  "employeeName","employeeId","designation","department","joiningDate",
  "footer","customText",
];

/**
 * Validate a layout object before saving to DB.
 * Returns { valid: true } or { valid: false, errors: [...] }
 */
function validateLayout(layout, cardW, cardH) {
  if (!layout) return { valid: true };
  const errors = [];
  const W = cardW || 242; // default CR80 pt
  const H = cardH || 153;

  for (const [key, block] of Object.entries(layout)) {
    if (!VALID_BLOCK_TYPES.includes(key)) {
      errors.push(`Unknown block type: "${key}"`);
      continue;
    }
    if (!block || typeof block !== "object") continue;
    if (block.x != null && block.x < 0)      errors.push(`Block "${key}": x must be >= 0 (got ${block.x})`);
    if (block.y != null && block.y < 0)       errors.push(`Block "${key}": y must be >= 0 (got ${block.y})`);
    if (block.width  != null && block.width  <= 0)  errors.push(`Block "${key}": width must be > 0`);
    if (block.height != null && block.height <= 0)  errors.push(`Block "${key}": height must be > 0`);
    if (block.x != null && block.width  != null && block.x + block.width  > W)
      errors.push(`Block "${key}": x(${block.x}) + width(${block.width}) exceeds card width(${W})`);
    if (block.y != null && block.height != null && block.y + block.height > H)
      errors.push(`Block "${key}": y(${block.y}) + height(${block.height}) exceeds card height(${H})`);
  }
  return errors.length ? { valid: false, errors } : { valid: true };
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatDate(d) {
  if (!d) return null;
  const dt = new Date(d);
  if (isNaN(dt)) return null;
  return `${String(dt.getDate()).padStart(2, "0")}/${String(dt.getMonth() + 1).padStart(2, "0")}/${dt.getFullYear()}`;
}

async function getActiveTemplate(type, templateId = null) {
  let tmpl = null;
  if (templateId && mongoose.Types.ObjectId.isValid(templateId)) {
    tmpl = await IdCardTemplate.findOne({ _id: templateId, type, isActive: true }).lean();
    if (!tmpl) throw new ErrorResponse("Template not found or inactive", 404);
  } else {
    tmpl = await IdCardTemplate.findOne({ type, isDefault: true, isActive: true, isLatestVersion: true }).lean();
  }
  if (!tmpl) {
    tmpl = type === "student" ? { ...DEFAULT_STUDENT_TEMPLATE } : { ...DEFAULT_STAFF_TEMPLATE };
  }
  return tmpl;
}

// ─── Service ──────────────────────────────────────────────────────────────────

const idCardService = {

  // ── Template Management ──────────────────────────────────────────────────────

  async createTemplate(data, createdByUserId) {
    // Validate layout if dynamic
    if (data.layoutMode === "dynamic" && data.layout) {
      const MM_TO_PT = 2.8346;
      const cardW = data.width  ? Math.round(data.width  * MM_TO_PT) : 242;
      const cardH = data.height ? Math.round(data.height * MM_TO_PT) : 153;
      const check = validateLayout(data.layout, cardW, cardH);
      if (!check.valid) throw new ErrorResponse(`Layout validation failed: ${check.errors.join("; ")}`, 400);
    }

    if (data.isDefault) {
      await IdCardTemplate.updateMany({ type: data.type }, { $set: { isDefault: false } });
    }

    const template = await IdCardTemplate.create({
      ...data,
      version: 1,
      isLatestVersion: true,
      parentVersion: null,
      createdBy: createdByUserId,
    });
    logger.info(`[IdCard] Template created: ${template._id} by ${createdByUserId}`);
    return template;
  },

  /** Non-versioned update (for minor fixes — same as v1 behavior) */
  async updateTemplate(templateId, data) {
    const existing = await IdCardTemplate.findById(templateId).lean();
    if (!existing) throw new ErrorResponse("Template not found", 404);

    const layoutMode = data.layoutMode || existing.layoutMode;
    const layout = data.layout || existing.layout;
    if (layoutMode === "dynamic" && layout) {
      const MM_TO_PT = 2.8346;
      const width  = data.width  ?? existing.width;
      const height = data.height ?? existing.height;
      const cardW = width  ? Math.round(width  * MM_TO_PT) : 242;
      const cardH = height ? Math.round(height * MM_TO_PT) : 153;
      const check = validateLayout(layout, cardW, cardH);
      if (!check.valid) throw new ErrorResponse(`Layout validation failed: ${check.errors.join("; ")}`, 400);
    }

    if (data.isDefault) {
      await IdCardTemplate.updateMany({ type: existing.type, _id: { $ne: templateId } }, { $set: { isDefault: false } });
    }
    const template = await IdCardTemplate.findByIdAndUpdate(templateId, { $set: data }, { new: true, runValidators: true });
    if (!template) throw new ErrorResponse("Template not found", 404);
    return template;
  },

  async listTemplates(type = null) {
    const filter = { isActive: true, isLatestVersion: true };
    if (type) filter.type = type;
    return IdCardTemplate.find(filter).sort({ isDefault: -1, createdAt: -1 }).lean();
  },

  async deleteTemplate(templateId) {
    const tmpl = await IdCardTemplate.findById(templateId);
    if (!tmpl) throw new ErrorResponse("Template not found", 404);
    if (tmpl.isDefault) throw new ErrorResponse("Cannot delete the default template. Set another as default first.", 400);
    tmpl.isActive = false;
    await tmpl.save();
    return { message: "Template deactivated successfully" };
  },

  // ── NEW: Preview endpoint data (no PDF generated) ────────────────────────────

  /**
   * Returns template config + resolved layout + entity card data.
   * Used by frontend live preview — no PDF generated.
   */
  async previewTemplate({ templateId, entityType, entityId }) {
    if (!["student", "staff"].includes(entityType)) {
      throw new ErrorResponse("entityType must be 'student' or 'staff'", 400);
    }

    const template = await getActiveTemplate(entityType, templateId);

    // Resolve layout (same logic as PDF renderer)
    const DEFAULT_LAYOUT = entityType === "student" ? DEFAULT_STUDENT_LAYOUT : DEFAULT_STAFF_LAYOUT;
    let resolvedLayout;
    if (template.layoutMode === "dynamic" && template.layout) {
      const raw = template.layout instanceof Map
        ? Object.fromEntries(template.layout)
        : (template.layout || {});
      resolvedLayout = { ...DEFAULT_LAYOUT };
      for (const key of Object.keys(raw)) {
        resolvedLayout[key] = { ...DEFAULT_LAYOUT[key], ...raw[key] };
      }
    } else {
      resolvedLayout = { ...DEFAULT_LAYOUT };
    }

    // Get card data
    let cardData;
    if (entityType === "student") {
      cardData = await this.getStudentIdCardData(entityId);
    } else {
      cardData = await this.getStaffIdCardData(entityId);
    }

    return {
      template: {
        _id: template._id || null,
        name: template.name,
        type: template.type,
        orientation: template.orientation,
        layoutMode: template.layoutMode || "legacy",
        width:  template.width  || 85.6,
        height: template.height || 54,
        branding: template.branding,
        header:   template.header,
        body:     template.body,
        backSide: template.backSide,
        footer:   template.footer,
        session:  template.session,
        validityDate: template.validityDate,
        version: template.version || 1,
      },
      layout: resolvedLayout,
      cardData,
    };
  },

  // ── Student ID Card Data (unchanged from v1) ─────────────────────────────────

  // Confirms a teacher is assigned to the student's class before they can
  // view/download that student's ID card (mirrors attendance.service.js's
  // assertUserCanAccessStudent class-scoping pattern).
  async assertTeacherCanAccessStudent(userId, studentId) {
    const teacher = await Teacher.findOne({ userId }).select("classIds").lean();
    if (!teacher) throw new ErrorResponse("Teacher profile not found", 404);

    const teacherClassIds = (teacher.classIds || []).map(String);
    if (!teacherClassIds.length) {
      throw new ErrorResponse("Teacher is not assigned to any class", 403);
    }

    const student = await Student.findById(studentId).select("classIds className section").lean();
    if (!student) throw new ErrorResponse("Student not found", 404);

    const studentClassIds = (student.classIds || []).map(String);
    const hasDirectMatch = studentClassIds.some((id) => teacherClassIds.includes(id));
    if (hasDirectMatch) return;

    // Fallback for legacy records without classIds populated
    const Class = require("../class/class.model");
    const classes = await Class.find({ _id: { $in: teacher.classIds } }).select("name section").lean();
    const legacyMatch = classes.some(
      (c) => c.name === student.className && (!c.section || !student.section || c.section === student.section)
    );
    if (!legacyMatch) {
      throw new ErrorResponse("You are not authorized to access this student's ID card", 403);
    }
  },

  async getStudentIdCardData(studentId) {
    const student = await Student.findOne({ _id: studentId, status: "Active" })
      .select("firstName lastName admissionNo rollNo className section dateOfBirth bloodGroup photo parentDetails address admissionAY qrCode")
      .lean();
    if (!student) throw new ErrorResponse("Student not found or inactive", 404);

    const template = await getActiveTemplate("student");
    const qrData   = buildStudentQRData(student);
    const qrCode   = await generateQRCodeDataURL(qrData, { size: 120 });
    const address  = [student.address?.street, student.address?.city, student.address?.state, student.address?.pincode].filter(Boolean).join(", ");

    return {
      id: student._id, type: "student",
      name: `${student.firstName} ${student.lastName}`.trim(),
      admissionNo: student.admissionNo || "",
      rollNo: student.rollNo || "",
      class: student.className || "",
      section: student.section || "",
      dob: formatDate(student.dateOfBirth),
      bloodGroup: student.bloodGroup || "",
      photo: student.photo || null,
      hasPhoto: !!student.photo,
      parentName: student.parentDetails?.primaryName || "",
      contactNumber: student.parentDetails?.primaryPhone || "",
      address,
      session: template.session || "",
      validity: template.validityDate ? formatDate(template.validityDate) : "",
      qrCode, qrData,
      template: template.name, templateId: template._id || null,
      designation: null, department: null, downloadUrl: null,
    };
  },

  async getStaffIdCardData(teacherId) {
    const teacher = await Teacher.findOne({ _id: teacherId, status: "Active" })
      .select("name employeeId subjects phone dob dateOfJoining bloodGroup photo qrCode")
      .lean();
    if (!teacher) throw new ErrorResponse("Staff not found or inactive", 404);

    const template = await getActiveTemplate("staff");
    const qrData   = buildStaffQRData(teacher);
    const qrCode   = await generateQRCodeDataURL(qrData, { size: 120 });

    return {
      id: teacher._id, type: "staff",
      name: teacher.name,
      employeeId: teacher.employeeId || "",
      designation: teacher.subjects || "Teacher",
      department: Array.isArray(teacher.subjects) ? teacher.subjects.join(", ") : teacher.subjects || "",
      dob: formatDate(teacher.dob),
      joiningDate: formatDate(teacher.dateOfJoining),
      bloodGroup: teacher.bloodGroup || "",
      contactNumber: teacher.phone || "",
      photo: teacher.photo || null,
      hasPhoto: !!teacher.photo,
      session: template.session || "",
      validity: template.validityDate ? formatDate(template.validityDate) : "",
      qrCode, qrData,
      template: template.name, templateId: template._id || null,
      class: null, downloadUrl: null,
    };
  },

  // ── PDF Generation (unchanged from v1) ───────────────────────────────────────

  async generateStudentPDF(studentId, templateId, generatedByUserId) {
    const student = await Student.findOne({ _id: studentId, status: "Active" })
      .select("firstName lastName admissionNo rollNo className section dateOfBirth bloodGroup photo parentDetails address admissionAY qrCode")
      .lean();
    if (!student) throw new ErrorResponse("Student not found or inactive", 404);

    const template = await getActiveTemplate("student", templateId);
    let buffer;
    try { buffer = await generateStudentIdCardPDF(student, template); }
    catch (err) { logger.error("[IdCard] PDF error (student):", err.message); throw new ErrorResponse("Failed to generate ID card PDF", 500); }

    this._logExport({ exportType: "single", cardType: "student", targetIds: [student._id], count: 1, format: "pdf", templateId: template._id, generatedBy: generatedByUserId });
    return { buffer, filename: `student-idcard-${student.admissionNo || student._id}.pdf` };
  },

  async generateStaffPDF(teacherId, templateId, generatedByUserId) {
    const teacher = await Teacher.findOne({ _id: teacherId, status: "Active" })
      .select("name employeeId subjects phone dob dateOfJoining bloodGroup photo qrCode")
      .lean();
    if (!teacher) throw new ErrorResponse("Staff not found or inactive", 404);

    const template = await getActiveTemplate("staff", templateId);
    let buffer;
    try { buffer = await generateStaffIdCardPDF(teacher, template); }
    catch (err) { logger.error("[IdCard] PDF error (staff):", err.message); throw new ErrorResponse("Failed to generate staff ID card PDF", 500); }

    this._logExport({ exportType: "single", cardType: "staff", targetIds: [teacher._id], count: 1, format: "pdf", templateId: template._id, generatedBy: generatedByUserId });
    return { buffer, filename: `staff-idcard-${teacher.employeeId || teacher._id}.pdf` };
  },

  async generateBulkStudentPDF(filters = {}, templateId, generatedByUserId) {
    const query = { status: "Active" };
    if (filters.studentIds?.length) { query._id = { $in: filters.studentIds }; }
    else { if (filters.className) query.className = filters.className; if (filters.section) query.section = filters.section; }

    const students = await Student.find(query)
      .select("firstName lastName admissionNo rollNo className section dateOfBirth bloodGroup photo parentDetails address admissionAY qrCode")
      .lean();

    if (!students.length) throw new ErrorResponse("No active students found matching the filters", 404);
    if (students.length > 200) throw new ErrorResponse("Maximum 200 students allowed per bulk generation", 400);

    const template = await getActiveTemplate("student", templateId);
    let buffer;
    try { buffer = await generateBulkStudentIdCardPDF(students, template); }
    catch (err) { logger.error("[IdCard] Bulk PDF error (student):", err.message); throw new ErrorResponse("Failed to generate bulk ID card PDF", 500); }

    this._logExport({ exportType: filters.className ? "class" : "bulk", cardType: "student", targetIds: students.map((s) => s._id), count: students.length, format: "pdf", templateId: template._id, filters: { className: filters.className, section: filters.section, session: filters.session }, generatedBy: generatedByUserId });

    const parts = ["bulk-student-idcards"];
    if (filters.className) parts.push(filters.className.replace(/\s+/g, "-"));
    if (filters.section)   parts.push(filters.section);
    return { buffer, filename: `${parts.join("-")}.pdf`, count: students.length };
  },

  async generateBulkStaffPDF(filters = {}, templateId, generatedByUserId) {
    const query = { status: "Active" };
    if (filters.teacherIds?.length) query._id = { $in: filters.teacherIds };

    const teachers = await Teacher.find(query)
      .select("name employeeId subjects phone dob dateOfJoining bloodGroup photo qrCode")
      .lean();

    if (!teachers.length) throw new ErrorResponse("No active staff found matching the filters", 404);
    if (teachers.length > 100) throw new ErrorResponse("Maximum 100 staff members allowed per bulk generation", 400);

    const template = await getActiveTemplate("staff", templateId);
    let buffer;
    try { buffer = await generateBulkStaffIdCardPDF(teachers, template); }
    catch (err) { logger.error("[IdCard] Bulk PDF error (staff):", err.message); throw new ErrorResponse("Failed to generate bulk staff ID card PDF", 500); }

    this._logExport({ exportType: "bulk", cardType: "staff", targetIds: teachers.map((t) => t._id), count: teachers.length, format: "pdf", templateId: template._id, generatedBy: generatedByUserId });
    return { buffer, filename: "bulk-staff-idcards.pdf", count: teachers.length };
  },

  // ── QR standalone ─────────────────────────────────────────────────────────────

  async getStudentQRCode(studentId) {
    const student = await Student.findOne({ _id: studentId, status: "Active" }).select("_id firstName admissionNo qrCode").lean();
    if (!student) throw new ErrorResponse("Student not found", 404);
    const qrData = buildStudentQRData(student);
    const qrCode = await generateQRCodeDataURL(qrData, { size: 200 });
    return { id: student._id, admissionNo: student.admissionNo, qrData, qrCode };
  },

  async getStaffQRCode(teacherId) {
    const teacher = await Teacher.findOne({ _id: teacherId, status: "Active" }).select("_id name employeeId qrCode").lean();
    if (!teacher) throw new ErrorResponse("Staff not found", 404);
    const qrData = buildStaffQRData(teacher);
    const qrCode = await generateQRCodeDataURL(qrData, { size: 200 });
    return { id: teacher._id, employeeId: teacher.employeeId, qrData, qrCode };
  },

  // ── Export Logs ───────────────────────────────────────────────────────────────

  async getExportLogs(filter = {}, page = 1, limit = 20) {
    const query = {};
    if (filter.cardType)    query.cardType    = filter.cardType;
    if (filter.generatedBy) query.generatedBy = filter.generatedBy;
    const skip = (page - 1) * limit;
    const [logs, total] = await Promise.all([
      IdCardExportLog.find(query).sort({ createdAt: -1 }).skip(skip).limit(limit)
        .populate("generatedBy", "name email role").populate("templateId", "name type version").lean(),
      IdCardExportLog.countDocuments(query),
    ]);
    return { logs, total, page: parseInt(page), limit: parseInt(limit), pages: Math.ceil(total / limit) };
  },

  _logExport(data) {
    IdCardExportLog.create(data).catch((err) => logger.warn("[IdCard] Export log failed:", err.message));
  },

  async generateStudentA4SheetPDF(filters = {}, templateId, generatedByUserId) {
    const query = { status: "Active" };
    if (filters.studentIds?.length) { query._id = { $in: filters.studentIds }; }
    else { if (filters.className) query.className = filters.className; if (filters.section) query.section = filters.section; }

    const students = await Student.find(query)
      .select("firstName lastName admissionNo rollNo className section dateOfBirth bloodGroup photo parentDetails address admissionAY qrCode")
      .lean();

    if (!students.length) throw new ErrorResponse("No active students found matching the filters", 404);

    const template = await getActiveTemplate("student", templateId);
    let buffer;
    try { buffer = await generateStudentA4SheetPDF(students, template); }
    catch (err) { logger.error("[IdCard] A4 Sheet PDF error (student):", err.message); throw new ErrorResponse("Failed to generate A4 sheet PDF", 500); }

    this._logExport({ exportType: filters.className ? "class" : "bulk", cardType: "student", targetIds: students.map((s) => s._id), count: students.length, format: "pdf", templateId: template._id, filters: { className: filters.className, section: filters.section, session: filters.session }, generatedBy: generatedByUserId });

    const parts = ["a4-student-idcards"];
    if (filters.className) parts.push(filters.className.replace(/\s+/g, "-"));
    if (filters.section)   parts.push(filters.section);
    return { buffer, filename: `${parts.join("-")}.pdf`, count: students.length };
  },

  async generateStaffA4SheetPDF(filters = {}, templateId, generatedByUserId) {
    const query = { status: "Active" };
    if (filters.teacherIds?.length) query._id = { $in: filters.teacherIds };

    const teachers = await Teacher.find(query)
      .select("name employeeId subjects phone dob dateOfJoining bloodGroup photo qrCode")
      .lean();

    if (!teachers.length) throw new ErrorResponse("No active staff found matching the filters", 404);

    const template = await getActiveTemplate("staff", templateId);
    let buffer;
    try { buffer = await generateStaffA4SheetPDF(teachers, template); }
    catch (err) { logger.error("[IdCard] A4 Sheet PDF error (staff):", err.message); throw new ErrorResponse("Failed to generate A4 sheet staff PDF", 500); }

    this._logExport({ exportType: "bulk", cardType: "staff", targetIds: teachers.map((t) => t._id), count: teachers.length, format: "pdf", templateId: template._id, generatedBy: generatedByUserId });
    return { buffer, filename: "a4-staff-idcards.pdf", count: teachers.length };
  },
};

module.exports = idCardService;