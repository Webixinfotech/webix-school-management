/**
 * Document Module — Model
 *
 * Single collection (DocumentIssue) backs all 3 document types:
 *   - achievement  (Certificate of Achievement — teacher + admin)
 *   - leaving      (School Leaving Certificate — admin only)
 *   - experience   (Experience Certificate — admin only)
 *
 * Backend stays a thin "data pipe": all visual design/rendering happens on the
 * frontend (html2canvas). fieldValues is intentionally a Mixed blob so the
 * frontend form shape can evolve without backend schema migrations.
 *
 * Reads from: Student, Teacher, User (existing — never modified except the
 * 2 new signature fields added to User).
 */

const mongoose = require("mongoose");

const DocumentIssueSchema = new mongoose.Schema(
  {
    docType: {
      type: String,
      enum: ["achievement", "leaving", "experience"],
      required: [true, "docType is required"],
    },

    // Frontend-side template identifier (opaque string, e.g. "achievement-design-3").
    // Backend does not validate/interpret this.
    templateName: {
      type: String,
      default: null,
      trim: true,
      maxlength: 100,
    },

    // Source record this document was prefilled from (if any).
    sourceType: {
      type: String,
      enum: ["student", "teacher", null],
      default: null,
    },
    sourceId: {
      type: mongoose.Schema.Types.ObjectId,
      default: null,
    },

    // Full final form data (name, class, title, forText, year, date, regNo,
    // fatherName, etc.) — as-is from frontend, no fixed shape enforced.
    fieldValues: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },

    // Snapshot of the issuer's signature at save-time, so a later signature
    // change doesn't retroactively alter already-issued documents.
    signatureUrl: {
      type: String,
      default: null,
    },

    // Who this document is shared with — drives "My Documents" visibility.
    // null = draft, not shared with anyone yet.
    assignedTo: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },

    status: {
      type: String,
      enum: ["draft", "issued"],
      default: "draft",
    },

    issuedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "issuedBy is required"],
    },
  },
  { timestamps: true }
);

DocumentIssueSchema.index({ assignedTo: 1, createdAt: -1 });
DocumentIssueSchema.index({ docType: 1 });
DocumentIssueSchema.index({ issuedBy: 1, createdAt: -1 });

module.exports = mongoose.model("DocumentIssue", DocumentIssueSchema);
