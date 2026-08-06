const mongoose = require("mongoose");
const Counter = require("../shared/counter.model");

const StudentSchema = new mongoose.Schema(
  {
    admissionNo: {
      type: String,
      unique: true,
      sparse: true,
    },
    firstName: {
      type: String,
      required: [true, "Please provide first name"],
      trim: true,
      maxlength: [50, "First name cannot exceed 50 characters"],
    },
    lastName: {
      type: String,
      required: [true, "Please provide last name"],
      trim: true,
      maxlength: [50, "Last name cannot exceed 50 characters"],
    },
    dateOfBirth: {
      type: Date,
      default: null,
    },
    gender: {
      type: String,
      enum: ["Male", "Female", "Other"],
      default: "Male",
    },
    bloodGroup: {
      type: String,
      enum: ["A+", "A-", "B+", "B-", "O+", "O-", "AB+", "AB-", ""],
      default: "",
    },
    photo: {
      type: String,
      default: null,
    },
    // S3 storage key for photo deletion/cleanup
    photoKey: {
      type: String,
      default: null,
    },
    className: {
      type: String,
      default: "",
    },
    section: {
      type: String,
      default: "",
    },
    rollNo: {
      type: String,
      default: "",
    },
    admissionDate: {
      type: Date,
      default: Date.now,
    },
    status: {
      type: String,
      enum: ["Active", "Inactive", "Graduated", "Transferred"],
      default: "Active",
    },
    qrCode: {
      type: String,
      unique: true,
      sparse: true,
    },
    parentUserId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "Please provide parent user ID"],
    },
    parentDetails: {
      primaryName: {
        type: String,
        default: "",
      },
      primaryEmail: {
        type: String,
        lowercase: true,
        default: "",
      },
      primaryPhone: {
        type: String,
        default: "",
      },
      relation: {
        type: String,
        enum: ["Father", "Mother", "Guardian"],
        default: "Father",
      },
      fatherName: {
        type: String,
        default: "",
      },
      fatherPhone: {
        type: String,
        default: "",
      },
      motherName: {
        type: String,
        default: "",
      },
      motherPhone: {
        type: String,
        default: "",
      },
    },
    address: {
      street: {
        type: String,
        default: "",
      },
      city: {
        type: String,
        default: "",
      },
      state: {
        type: String,
        default: "",
      },
      pincode: {
        type: String,
        default: "",
      },
    },
    // Referral tracking
    referralInfo: {
      wasReferred: {
        type: Boolean,
        default: false,
      },
      referralId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Referral",
        default: null,
      },
      referredByParentId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Parent",
        default: null,
      },
      referredByName: {
        type: String,
        default: "",
      },
    },
    // Father Extra Details
    fatherDob: {
      type: Date,
      default: null,
    },
    fatherEmail: {
      type: String,
      default: "",
      trim: true,
      lowercase: true,
    },
    // Mother Extra Details
    motherEmail: {
      type: String,
      default: "",
      trim: true,
      lowercase: true,
    },
    motherDob: {
      type: Date,
      default: null,
    },
    // Admission Session
    admissionYear: {
      type: Number,
      default: null,
    },
    admissionAY: {
      type: String,
      default: "",
      trim: true,
    },
    // Academic session this student was admitted/tagged under. null on
    // pre-existing documents and on any create where no session is Active
    // yet — never required, so admission keeps working with zero sessions.
    sessionId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "AcademicSession",
      default: null,
    },
    // Class Assignment (Array of classId strings like "CLS001")
    // classIds: [
    //   {
    //     type: String,
    //     trim: true,
    //   },
    // ],

    // Class Assignment — ObjectId refs to Class collection
classIds: [
  {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Class',
  },
],
    classTimings: {
      type: Map,
      of: new mongoose.Schema(
        {
          // For FIXED_TIME class - no input needed (auto from class)
          // For FLEX_TIME class - admin sets per student
          startTime: { type: String, default: null }, // "09:00"
          endTime: { type: String, default: null }, // "12:00"
          // For HOURS_BASED class - admin sets hours per student
          paidFlexiHours: { type: Number, default: 0 },
          freeFlexiHours: { type: Number, default: 0 },
          consumedFlexiHours: { type: Number, default: 0 },
          assignedHours: { type: Number, default: 0 },
        },
        { _id: false },
      ),
      default: {},
    },
    // Flexi Hours Summary (aggregated across all HOURS_BASED classes)
    paidFlexiHours: {
      type: Number,
      default: 0,
    },
    freeFlexiHours: {
      type: Number,
      default: 0,
    },
    consumedFlexiHours: {
      type: Number,
      default: 0,
    },
    // Siblings
    siblings: {
      type: [
        new mongoose.Schema(
          {
            name: { type: String, default: "", trim: true },
            relation: {
              type: String,
              enum: ["Brother", "Sister"],
              default: "Brother",
            },
            dob: { type: Date, default: null },
            school: { type: String, default: "", trim: true },
            class: { type: String, default: "", trim: true },
          },
          { _id: false },
        ),
      ],
      default: [],
    },

    // Document verification checklist - manually verified by admin
    documentVerification: {
      admissionForm: { type: Boolean, default: false },
      birthCertificate: { type: Boolean, default: false },

      studentAadharCard: { type: Boolean, default: false },
      motherAadharCard: { type: Boolean, default: false },
      fatherAadharCard: { type: Boolean, default: false },
      studentPhoto: { type: Boolean, default: false },
      motherPhoto: { type: Boolean, default: false },
      fatherPhoto: { type: Boolean, default: false },
      transferCertificate: {
        type: Boolean,
        default: false,
        required: function () {
          // Only required if 'isTransferCertificateApplicable' is true (handle in controller)
          return false;
        },
      },
      medicalCertificate: { type: Boolean, default: false },
      others: { type: Boolean, default: false },
    },
    // Flag to check if transfer certificate is applicable for this student
    isTransferCertificateApplicable: {
      type: Boolean,
      default: true,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "Please provide creator user ID"],
    },
  },
  {
    timestamps: true,
  },
);

// Virtual for full name
StudentSchema.virtual("fullName").get(function () {
  return `${this.firstName} ${this.lastName}`;
});

// Ensure virtuals are included in JSON responses
StudentSchema.set("toJSON", { virtuals: true });
StudentSchema.set("toObject", { virtuals: true });

// Pre-save hook to auto-generate admissionNo and qrCode
StudentSchema.pre("save", async function (next) {
  // Only generate if this is a new document (not being updated)
  if (!this.isNew) {
    return next();
  }

  try {
    // Generate admission number atomically per year to avoid duplicates
    // when multiple student-create requests happen at the same time.
    const currentYear = new Date().getFullYear();
    const yearSuffix = String(currentYear).slice(-2); // Get last 2 digits of year
    const counterKey = `student-admission-${currentYear}`;
    const session = this.$session();

    const counterQuery = Counter.findOneAndUpdate(
      { name: counterKey },
      { $inc: { seq: 1 } },
      {
        new: true,
        upsert: true,
        setDefaultsOnInsert: true,
      },
    );

    if (session) {
      counterQuery.session(session);
    }

    const counter = await counterQuery;
    const paddedCount = String(counter.seq).padStart(4, "0");
    this.admissionNo = `BB${yearSuffix}${paddedCount}`;

    // Generate QR code: BRAINBUILDER-STU-{admissionNo}-{timestamp}
    this.qrCode = `BRAINBUILDER-STU-${this.admissionNo}-${Date.now()}`;

    next();
  } catch (err) {
    next(err);
  }
});

StudentSchema.index({ sessionId: 1, status: 1 });

module.exports = mongoose.model("Student", StudentSchema);
