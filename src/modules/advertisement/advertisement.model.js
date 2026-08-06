const mongoose = require("mongoose");

const editHistoryEntrySchema = new mongoose.Schema(
  {
    editedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    editedByRole: { type: String, default: "" },
    editedAt: { type: Date, default: Date.now },
    changedFields: { type: [String], default: [] },
    beforeValues: { type: mongoose.Schema.Types.Mixed, default: {} },
    afterValues: { type: mongoose.Schema.Types.Mixed, default: {} },
    note: { type: String, default: "", trim: true, maxlength: 500 },
  },
  { _id: false },
);

const AdvertisementSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, "Please provide an internal title for this ad"],
      trim: true,
      maxlength: [100, "Title cannot exceed 100 characters"],
    },
    imageUrl: {
      type: String,
      required: [true, "Banner image is required"],
    },
    imageKey: {
      type: String,
      required: true,
    },
    imageWidth: {
      type: Number,
      default: null,
    },
    imageHeight: {
      type: Number,
      default: null,
    },
    linkType: {
      type: String,
      enum: ["none", "external", "internal"],
      default: "none",
    },
    linkUrl: {
      type: String,
      default: "",
      trim: true,
      validate: {
        validator: function (v) {
          if (this.linkType === "none") return true;
          return !!v && v.trim().length > 0;
        },
        message: "linkUrl is required when linkType is not 'none'",
      },
    },
    targetType: {
      type: String,
      enum: ["all", "class", "specific"],
      required: true,
      default: "all",
    },
    targetClassIds: [{ type: mongoose.Schema.Types.ObjectId, ref: "Class" }],
    targetParentIds: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
    status: {
      type: String,
      enum: ["active", "inactive"],
      default: "active",
    },
    startDate: { type: Date, default: null },
    endDate: { type: Date, default: null },
    priority: { type: Number, default: 0 },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    editHistory: { type: [editHistoryEntrySchema], default: [] },
  },
  { timestamps: true },
);

AdvertisementSchema.pre("validate", function (next) {
  if (
    this.targetType === "class" &&
    (!this.targetClassIds || this.targetClassIds.length === 0)
  ) {
    return next(
      new Error("Select at least one class for class-wise targeting"),
    );
  }

  if (
    this.targetType === "specific" &&
    (!this.targetParentIds || this.targetParentIds.length === 0)
  ) {
    return next(
      new Error("Select at least one parent for specific targeting"),
    );
  }

  next();
});

AdvertisementSchema.index({ status: 1, startDate: 1, endDate: 1 });
AdvertisementSchema.index({ targetType: 1 });

module.exports = mongoose.model("Advertisement", AdvertisementSchema);
