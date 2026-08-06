const mongoose = require("mongoose");

const PhotoSchema = new mongoose.Schema(
  {
    // ==================== Basic Info ====================
    title: {
      type: String,
      trim: true,
      default: "",
    },
    description: {
      type: String,
      trim: true,
      default: "",
    },
    category: {
      type: String,
      enum: [
        "Events",
        "Activities",
        "Academics",
        "Sports",
        "Celebration",
        "Field Trip",
        "Achievements",
        "Others",
      ],
      default: "Others",
    },
    event: {
      type: String,
      trim: true,
      default: "",
    },
    tags: {
      type: [String],
      default: [],
    },

    // ==================== File Info ====================
    imageUrl: {
      type: String,
      required: [true, "Please provide image URL"],
    },
    imageKey: {
      type: String,
      default: null,
    },
    fileName: {
      type: String,
      required: [true, "Please provide file name"],
    },
    fileSize: {
      type: Number,
    },
    mimeType: {
      type: String,
    },

    // ==================== Publish Settings ====================
    uploadType: {
      type: [String],
      enum: ["website", "parents"],
      default: ["parents"],
    },

    // ==================== Upload Info ====================
    uploadedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "Please provide uploader"],
    },
    uploaderRole: {
      type: String,
      enum: ["admin", "teacher"],
      required: [true, "Please provide uploader role"],
    },
    uploadedAt: {
      type: Date,
      default: Date.now,
    },

    // ==================== Target Audience (For Teacher Uploads) ====================
    // If empty, photo goes to all parents (admin uploads always go to all)
    targetClasses: {
      type: [String],
      default: [], // e.g., ["Class 1A", "Class 2B"] - empty means all classes
    },
    targetParentIds: {
      type: [mongoose.Schema.Types.ObjectId],
      ref: "Parent",
      default: [], // If empty, goes to all parents of targetClasses
    },

    // ==================== Approval Info ====================
    status: {
      type: String,
      enum: ["pending", "approved", "rejected"],
      default: "pending",
    },
    approvedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
    approvedAt: {
      type: Date,
      default: null,
    },
    rejectedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
    rejectedAt: {
      type: Date,
      default: null,
    },
    rejectionReason: {
      type: String,
      default: "",
    },

    // ==================== Delete Info ====================
    isDeleted: {
      type: Boolean,
      default: false,
    },
    deletedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
    deletedByRole: {
      type: String,
      default: "",
    },
    deletedByName: {
      type: String,
      default: "",
    },
    deletedAt: {
      type: Date,
      default: null,
    },
    deleteType: {
      type: String,
      enum: ["soft", "hard", ""],
      default: "",
    },

    // ==================== Engagement ====================
    viewsCount: {
      type: Number,
      default: 0,
    },
    likesCount: {
      type: Number,
      default: 0,
    },
    likedBy: {
      type: [mongoose.Schema.Types.ObjectId],
      ref: "User",
      default: [],
    },
    downloadsCount: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  },
);

// ==================== Virtuals ====================

// Virtual for formatted delete message
PhotoSchema.virtual("deletedByInfo").get(function () {
  if (!this.isDeleted || !this.deletedAt) {
    return null;
  }

  const date = new Date(this.deletedAt).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });

  return `Deleted by: ${this.deletedByName} (${this.deletedByRole}) on ${date}`;
});

// ==================== Indexes ====================
PhotoSchema.index({ status: 1, isDeleted: 1 });
PhotoSchema.index({ uploadedBy: 1, status: 1 });
PhotoSchema.index({ category: 1, status: 1 });
PhotoSchema.index({ uploadType: 1, status: 1, isDeleted: 1 });
PhotoSchema.index({ uploadedAt: -1 });
PhotoSchema.index({ deletedAt: -1 });
PhotoSchema.index({ targetClasses: 1, status: 1, isDeleted: 1 });
PhotoSchema.index({ targetParentIds: 1, status: 1, isDeleted: 1 });

module.exports = mongoose.model("Photo", PhotoSchema);
