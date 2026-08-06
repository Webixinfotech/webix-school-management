const mongoose = require("mongoose");

const HolidaySchema = new mongoose.Schema(
  {
    // Date of holiday YYYY-MM-DD
    date: {
      type: String,
      required: [true, "Holiday date is required"],
      match: [/^\d{4}-\d{2}-\d{2}$/, "Must be YYYY-MM-DD"],
    },

    name: {
      type: String,
      required: [true, "Holiday name is required"],
      trim: true,
      maxlength: 100,
    },

    // Which calendar does this holiday belong to
    applicableTo: {
      type: String,
      enum: ["TEACHING", "NON_TEACHING", "BOTH"],
      default: "BOTH",
      required: true,
    },

    description: {
      type: String,
      default: "",
      trim: true,
      maxlength: 300,
    },

    // Is it a paid holiday (affects salary)
    isPaid: {
      type: Boolean,
      default: true,
    },

    // Specific users this holiday applies to. Empty array means applies to all users of applicableTo type
    users: {
      type: [
        {
          type: mongoose.Schema.Types.ObjectId,
          ref: "User",
        },
      ],
      default: [],
    },

    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  },
);

// Indexes
HolidaySchema.index({ date: 1, applicableTo: 1 });
HolidaySchema.index({ date: 1 });
HolidaySchema.index({ users: 1 });

module.exports = mongoose.model("Holiday", HolidaySchema);
