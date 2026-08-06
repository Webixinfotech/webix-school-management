


/**
 * ID Card Module — Models (v2 — Dynamic Template Engine)
 *
 * BACKWARD COMPATIBLE: Existing body/header/footer/backSide fields retained.
 * NEW: layout{} object drives dynamic positioning in PDF renderer.
 * NEW: version + parentVersion for template versioning.
 * NEW: IdCardExportLog unchanged.
 */

const mongoose = require("mongoose");

// ─── Block Schema (reusable for every layout element) ────────────────────────

const BlockSchema = new mongoose.Schema(
  {
    visible:    { type: Boolean, default: true },
    x:          { type: Number, default: 0 },   // pt from left
    y:          { type: Number, default: 0 },   // pt from top
    width:      { type: Number, default: null }, // null = auto
    height:     { type: Number, default: null }, // null = auto
    fontSize:   { type: Number, default: null }, // null = theme default
    fontWeight: { type: String, enum: ["normal", "bold"], default: "normal" },
    textAlign:  { type: String, enum: ["left", "center", "right"], default: "left" },
    color:      { type: String, default: null }, // null = inherit from branding
  },
  { _id: false }
);

// ─── Default layout presets (used when template has no layout field) ──────────
// These match the hardcoded positions in the existing idCard.pdf.js
// so old templates render identically.

const DEFAULT_STUDENT_LAYOUT = {
  logo:        { visible: true,  x: 6,   y: 4,   width: 26,  height: 26, fontWeight: "normal", textAlign: "left" },
  schoolName:  { visible: true,  x: 36,  y: 5,   width: 100, height: 10, fontSize: 7, fontWeight: "bold", textAlign: "center" },
  tagline:     { visible: true,  x: 36,  y: 14,  width: 100, height: 8,  fontSize: 5, fontWeight: "normal", textAlign: "center" },
  photo:       { visible: true,  x: 6,   y: 0,   width: 0,   height: 0,  fontWeight: "normal", textAlign: "left" },
  qr:          { visible: true,  x: 0,   y: 0,   width: 80,  height: 80, fontWeight: "normal", textAlign: "left" },
  studentName: { visible: true,  x: 0,   y: 0,   width: 0,   height: 0,  fontSize: 7, fontWeight: "bold", textAlign: "left" },
  studentId:   { visible: true,  x: 0,   y: 0,   width: 0,   height: 0,  fontSize: 5, fontWeight: "normal", textAlign: "left" },
  class:       { visible: true,  x: 0,   y: 0,   width: 0,   height: 0,  fontSize: 5, fontWeight: "normal", textAlign: "left" },
  section:     { visible: true,  x: 0,   y: 0,   width: 0,   height: 0,  fontSize: 5, fontWeight: "normal", textAlign: "left" },
  rollNo:      { visible: true,  x: 0,   y: 0,   width: 0,   height: 0,  fontSize: 5, fontWeight: "normal", textAlign: "left" },
  dob:         { visible: true,  x: 0,   y: 0,   width: 0,   height: 0,  fontSize: 5, fontWeight: "normal", textAlign: "left" },
  bloodGroup:  { visible: true,  x: 0,   y: 0,   width: 0,   height: 0,  fontSize: 5, fontWeight: "normal", textAlign: "left" },
  parentName:  { visible: true,  x: 0,   y: 0,   width: 0,   height: 0,  fontSize: 5, fontWeight: "normal", textAlign: "left" },
  contact:     { visible: true,  x: 0,   y: 0,   width: 0,   height: 0,  fontSize: 5, fontWeight: "normal", textAlign: "left" },
  session:     { visible: true,  x: 0,   y: 0,   width: 0,   height: 0,  fontSize: 5, fontWeight: "normal", textAlign: "left" },
  transport:   { visible: false, x: 0,   y: 0,   width: 0,   height: 0,  fontSize: 5, fontWeight: "normal", textAlign: "left" },
  footer:      { visible: true,  x: 0,   y: 0,   width: 0,   height: 14, fontSize: 5, fontWeight: "normal", textAlign: "left" },
  customText:  { visible: false, x: 0,   y: 0,   width: 0,   height: 0,  fontSize: 5, fontWeight: "normal", textAlign: "left" },
};

const DEFAULT_STAFF_LAYOUT = {
  logo:         { visible: true,  x: 6,  y: 4,  width: 26,  height: 26, fontWeight: "normal", textAlign: "left" },
  schoolName:   { visible: true,  x: 36, y: 5,  width: 100, height: 10, fontSize: 7, fontWeight: "bold",   textAlign: "center" },
  tagline:      { visible: true,  x: 36, y: 14, width: 100, height: 8,  fontSize: 5, fontWeight: "normal", textAlign: "center" },
  photo:        { visible: true,  x: 10, y: 0,  width: 0,   height: 0,  fontWeight: "normal", textAlign: "left" },
  qr:           { visible: true,  x: 0,  y: 0,  width: 80,  height: 80, fontWeight: "normal", textAlign: "left" },
  employeeName: { visible: true,  x: 0,  y: 0,  width: 0,   height: 0,  fontSize: 7, fontWeight: "bold",   textAlign: "left" },
  employeeId:   { visible: true,  x: 0,  y: 0,  width: 0,   height: 0,  fontSize: 5, fontWeight: "normal", textAlign: "left" },
  designation:  { visible: true,  x: 0,  y: 0,  width: 0,   height: 0,  fontSize: 5, fontWeight: "normal", textAlign: "left" },
  department:   { visible: true,  x: 0,  y: 0,  width: 0,   height: 0,  fontSize: 5, fontWeight: "normal", textAlign: "left" },
  dob:          { visible: true,  x: 0,  y: 0,  width: 0,   height: 0,  fontSize: 5, fontWeight: "normal", textAlign: "left" },
  bloodGroup:   { visible: true,  x: 0,  y: 0,  width: 0,   height: 0,  fontSize: 5, fontWeight: "normal", textAlign: "left" },
  contact:      { visible: true,  x: 0,  y: 0,  width: 0,   height: 0,  fontSize: 5, fontWeight: "normal", textAlign: "left" },
  joiningDate:  { visible: false, x: 0,  y: 0,  width: 0,   height: 0,  fontSize: 5, fontWeight: "normal", textAlign: "left" },
  footer:       { visible: true,  x: 0,  y: 0,  width: 0,   height: 14, fontSize: 5, fontWeight: "normal", textAlign: "left" },
  customText:   { visible: false, x: 0,  y: 0,  width: 0,   height: 0,  fontSize: 5, fontWeight: "normal", textAlign: "left" },
};

// ─── 1. ID Card Template ──────────────────────────────────────────────────────

const IdCardTemplateSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Template name is required"],
      trim: true,
      maxlength: 100,
    },
    type: {
      type: String,
      enum: ["student", "staff"],
      required: true,
    },
    isDefault: { type: Boolean, default: false },
    isActive:  { type: Boolean, default: true },

    orientation: {
      type: String,
      enum: ["portrait", "landscape"],
      default: "portrait",
    },

    // Card dimensions in mm (default CR80)
    width:  { type: Number, default: 85.6 },
    height: { type: Number, default: 54 },

    // ── School branding (unchanged from v1) ──────────────────────────────────
    branding: {
      schoolName:      { type: String, default: "" },
      schoolLogo:      { type: String, default: null },
      tagline:         { type: String, default: "" },
      primaryColor:    { type: String, default: "#1a237e" },
      secondaryColor:  { type: String, default: "#ffffff" },
      accentColor:     { type: String, default: "#ffd600" },
      textColor:       { type: String, default: "#212121" },
      fontFamily:      { type: String, default: "Helvetica" },
      backgroundImage: { type: String, default: null }, // future-proof
      watermark:       { type: String, default: null }, // future-proof
    },

    // ── Header config (unchanged from v1 — used as fallback) ────────────────
    header: {
      showSchoolName:  { type: Boolean, default: true },
      showLogo:        { type: Boolean, default: true },
      showTagline:     { type: Boolean, default: true },
      backgroundColor: { type: String, default: "#1a237e" },
      textColor:       { type: String, default: "#ffffff" },
    },

    // ── Body show/hide flags (unchanged from v1) ─────────────────────────────
    body: {
      showPhoto:          { type: Boolean, default: true },
      showName:           { type: Boolean, default: true },
      showId:             { type: Boolean, default: true },
      showClass:          { type: Boolean, default: true },
      showSection:        { type: Boolean, default: true },
      showRollNo:         { type: Boolean, default: true },
      showDob:            { type: Boolean, default: true },
      showBloodGroup:     { type: Boolean, default: true },
      showParentName:     { type: Boolean, default: true },
      showContact:        { type: Boolean, default: true },
      showAddress:        { type: Boolean, default: false },
      showDesignation:    { type: Boolean, default: true },
      showDepartment:     { type: Boolean, default: true },
      showJoiningDate:    { type: Boolean, default: false },
      showSession:        { type: Boolean, default: true },
      showValidity:       { type: Boolean, default: true },
      showTransportRoute: { type: Boolean, default: false },
      showQrOnFront:      { type: Boolean, default: false }, // QR on front side
      showLogoOnFront:    { type: Boolean, default: true  }, // Logo on front (already works via header.showLogo)
    },

    // ── Back side config (unchanged from v1) ────────────────────────────────
    backSide: {
      enabled:                { type: Boolean, default: true },
      showQrCode:             { type: Boolean, default: true },
      showBarcode:            { type: Boolean, default: false },
      showEmergencyContact:   { type: Boolean, default: true },
      showSignatureArea:      { type: Boolean, default: true },
      showTermsAndConditions: { type: Boolean, default: false },
      termsText:              { type: String,  default: "" },
      backgroundColor:        { type: String,  default: "#f5f5f5" },
    },

    // ── Footer config (unchanged from v1) ───────────────────────────────────
    footer: {
      showValidity:    { type: Boolean, default: true },
      backgroundColor: { type: String,  default: "#1a237e" },
      textColor:       { type: String,  default: "#ffffff" },
      customText:      { type: String,  default: "" },
    },

    // ── QR config (unchanged from v1) ───────────────────────────────────────
    qrConfig: {
      type:                 { type: String, enum: ["qr", "barcode"], default: "qr" },
      dataType:             { type: String, default: "id" },
      customData:           { type: String, default: "" },
      size:                 { type: Number, default: 80 },
      errorCorrectionLevel: { type: String, default: "M" },
    },

    // ── NEW v2: Dynamic layout blocks ────────────────────────────────────────
    // When present, PDF renderer uses these coordinates instead of hardcoded ones.
    // When absent (old templates), renderer falls back to hardcoded flow.
    layout: {
      type: Map,
      of: BlockSchema,
      default: null, // null = use legacy hardcoded renderer
    },

    // Layout mode flag — admin sets this to "dynamic" to opt-in
    layoutMode: {
      type: String,
      enum: ["legacy", "dynamic"],
      default: "legacy",
    },

    // Custom text content (used when customText block is visible)
    customTextContent: { type: String, default: "" },

    // Transport route field (student only)
    transportRoute: { type: String, default: "" },

    // ── v2: Template versioning ──────────────────────────────────────────────
    version:            { type: Number, default: 1 },
    parentVersion:      { type: mongoose.Schema.Types.ObjectId, ref: "IdCardTemplate", default: null },
    isLatestVersion:    { type: Boolean, default: true },
    versionNote:        { type: String, default: "" },

    // Session / validity (unchanged from v1)
    session:      { type: String, default: "" },
    validityDate: { type: Date,   default: null },

    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
  },
  { timestamps: true }
);

// Indexes
IdCardTemplateSchema.index({ type: 1, isDefault: 1 });
IdCardTemplateSchema.index({ type: 1, isLatestVersion: 1 });
IdCardTemplateSchema.index({ parentVersion: 1 });

// ─── 2. ID Card Export Log (unchanged from v1) ───────────────────────────────

const IdCardExportLogSchema = new mongoose.Schema(
  {
    exportType: {
      type: String,
      enum: ["single", "bulk", "class", "department"],
      default: "single",
    },
    cardType: {
      type: String,
      enum: ["student", "staff"],
      required: true,
    },
    targetIds:    [{ type: mongoose.Schema.Types.ObjectId }],
    count:        { type: Number, default: 1 },
    format:       { type: String, enum: ["pdf", "png", "jpeg"], default: "pdf" },
    templateId:   { type: mongoose.Schema.Types.ObjectId, ref: "IdCardTemplate", default: null },
    filters: {
      className:  { type: String, default: null },
      section:    { type: String, default: null },
      session:    { type: String, default: null },
      department: { type: String, default: null },
    },
    status:       { type: String, enum: ["success", "partial", "failed"], default: "success" },
    errorMessage: { type: String, default: null },
    generatedBy:  { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  },
  { timestamps: true }
);

IdCardExportLogSchema.index({ generatedBy: 1 });
IdCardExportLogSchema.index({ cardType: 1 });
IdCardExportLogSchema.index({ createdAt: -1 });

const IdCardTemplate = mongoose.model("IdCardTemplate", IdCardTemplateSchema);
const IdCardExportLog = mongoose.model("IdCardExportLog", IdCardExportLogSchema);

module.exports = {
  IdCardTemplate,
  IdCardExportLog,
  DEFAULT_STUDENT_LAYOUT,
  DEFAULT_STAFF_LAYOUT,
};