const mongoose = require("mongoose");
const Counter = require("../shared/counter.model");

const EnquirySchema = new mongoose.Schema(
  {
    // Meta
    enquiryId: {
      type: String,
      unique: true,
      trim: true,
    },
    submittedAt: {
      type: Date,
      default: Date.now,
    },
    status: {
      type: String,
      enum: ["New", "Contacted", "Visited", "Admitted", "Rejected"],
      default: "New",
    },
    type: {
      type: String,
      enum: ["child", "job", "both", "course"],
      required: [true, "Please provide enquiry type"],
    },

    // General Info (Step 1 of form)
    mobile: {
      type: String,
      required: [true, "Please provide mobile number"],
      trim: true,
      match: [
        /^[6-9]\d{9}$/,
        "Please provide a valid 10-digit Indian mobile number",
      ],
    },
    services: {
      type: [String],
      required: [true, "Please select at least one service"],
      validate: {
        validator: function (arr) {
          return arr && arr.length > 0;
        },
        message: "Please select at least one service",
      },
    },

    // Child Info (Step 2 - only when type === "child")
    childName: {
      type: String,
      default: "",
    },
    childDob: {
      type: Date,
      default: null,
    },
    childGender: {
      type: String,
      enum: {
        values: ["Boy", "Girl", "Male", "Female", null],
        message: "Gender must be Boy or Girl",
      },
      set: function (value) {
        if (value === "Male") return "Boy";
        if (value === "Female") return "Girl";
        return value;
      },
      default: null,
    },

    // Job Info (Step 2 - only when type === "job")
    applicantName: {
      type: String,
      default: "",
    },
    position: {
      type: String,
      default: "", // Teaching / Non-Teaching
    },
    qualification: {
      type: String,
      default: "",
    },
    experience: {
      type: String,
      default: "",
    },
    currentSalary: {
      type: String,
      default: "",
    },
    expectedSalary: {
      type: String,
      default: "",
    },

    // Parent Info (Step 3)
    fatherName: {
      type: String,
      default: "",
    },
    fatherMobile: {
      type: String,
      default: "",
    },
    fatherDob: {
      type: Date,
      default: null,
    },
    fatherEmail: {
      type: String,
      lowercase: true,
      trim: true,
      default: "",
    },
    motherName: {
      type: String,
      default: "",
    },
    motherMobile: {
      type: String,
      default: "",
    },
    motherDob: {
      type: Date,
      default: null,
    },
    motherEmail: {
      type: String,
      lowercase: true,
      trim: true,
      default: "",
    },
    address: {
      type: String,
      default: "",
    },

    // Visit Details (Step 4)
    referredBySource: {
      type: String,
      default: "", // referral, facebook, instagram, website, google, walkin, other
    },
    referralName: {
      type: String,
      default: "", // name of parent who referred
    },
    referralMobile: {
      type: String,
      default: "",
    },
    visitPreference: {
      type: String,
      enum: ["visit", "callback"],
      default: "visit",
    },
    callbackPreferredDate: {
      type: Date,
      default: null,
    },
    callbackPreferredTime: {
      type: [String],
      default: [],
    },
    preferredDate: {
      type: Date,
      default: null,
    },
    preferredTime: {
      type: [String],
      default: [],
      // Values: 'Morning 9am to 12pm', 'Noon 12pm to 3pm', 'Afternoon 3pm to 6pm', 'Evening 6pm to 9pm'
    },
    message: {
      type: String,
      default: "",
    },

    // Admin fields (admin-only, never sent to public)
    adminNotes: {
      type: String,
      default: "", // internal notes by admin
    },
    assignedTo: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
    admittedAt: {
      type: Date,
      default: null,
    },

    // Student Link (set when admitted)
    studentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Student",
      default: null,
    },
    parentUserId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
    isConverted: {
      type: Boolean,
      default: false,
    },
    // Referral tracking
    linkedReferralId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Referral",
      default: null,
    },

    // Audit trail for tracking all changes (admin edits)
    auditTrail: [
      {
        changedBy: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "User",
          required: true,
        },
        changedAt: {
          type: Date,
          default: Date.now,
        },
        changedFields: {
          type: [String],
          default: [],
        },
        beforeValues: {
          type: mongoose.Schema.Types.Mixed,
          default: {},
        },
        afterValues: {
          type: mongoose.Schema.Types.Mixed,
          default: {},
        },
        note: {
          type: String,
          default: "",
        },
      },
    ],
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  },
);

// Indexes for faster queries
EnquirySchema.index({ enquiryId: 1 });
EnquirySchema.index({ status: 1 });
EnquirySchema.index({ mobile: 1 });
EnquirySchema.index({ type: 1 });
EnquirySchema.index({ createdAt: -1 });

// Virtual for child's full name
EnquirySchema.virtual("childFullName").get(function () {
  return this.childName || "";
});

// Pre-save hook to auto-generate enquiryId using Counter
EnquirySchema.pre("save", async function (next) {
  // Only generate if this is a new document and enquiryId is not set
  if (!this.isNew || this.enquiryId) {
    return next();
  }

  try {
    const counterKey = "enquiry-id";
    const counter = await Counter.findOneAndUpdate(
      { name: counterKey },
      { $inc: { seq: 1 } },
      { new: true, upsert: true, setDefaultsOnInsert: true },
    );
    // Generate enquiryId: "BB" + zero-padded sequence (e.g., BB000001)
    this.enquiryId = "BB" + String(counter.seq).padStart(6, "0");
    next();
  } catch (err) {
    next(err);
  }
});

module.exports = mongoose.model("Enquiry", EnquirySchema);
