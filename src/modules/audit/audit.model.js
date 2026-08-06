const mongoose = require("mongoose");

const auditLogSchema = new mongoose.Schema(
  {
    actor: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    actorRole: {
      type: String,
      required: true,
    },
    action: {
      type: String,
      required: true,
      enum: [
        "CREATE",
        "UPDATE",
        "DELETE",
        "LOGIN",
        "LOGOUT",
        "UPLOAD",
        "DELETE_FILE",
        "PASSWORD_CHANGE",
        "ROLE_CHANGE",
      ],
    },
    target: {
      model: {
        type: String,
        required: true,
      },
      id: {
        type: mongoose.Schema.Types.Mixed,
        required: true,
      },
    },
    changes: {
      before: mongoose.Schema.Types.Mixed,
      after: mongoose.Schema.Types.Mixed,
      fields: [String], // List of fields changed
    },
    metadata: {
      ip: String,
      userAgent: String,
      path: String,
      method: String,
    },
    status: {
      type: String,
      enum: ["SUCCESS", "FAILURE"],
      default: "SUCCESS",
    },
    timestamp: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  },
);

// Index for fast queries
auditLogSchema.index({ actor: 1, timestamp: -1 });
auditLogSchema.index({ target: 1, timestamp: -1 });
auditLogSchema.index({ action: 1, timestamp: -1 });

module.exports = mongoose.model("AuditLog", auditLogSchema);
