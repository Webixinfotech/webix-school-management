// const mongoose = require("mongoose");
// const Counter = require("../shared/counter.model");

// const classSchema = new mongoose.Schema(
//   {
//     classId: {
//       type: String,
//       unique: true,
//       trim: true,
//     },
//     name: {
//       type: String,
//       required: [true, "Class name is required"],
//       trim: true,
//       maxlength: [100, "Class name cannot exceed 100 characters"],
//     },
//     section: {
//       type: String,
//       trim: true,
//       maxlength: [50, "Section cannot exceed 50 characters"],
//       default: "",
//     },
//     classType: {
//       type: String,
//       enum: {
//         values: ["FIXED_TIME", "FLEX_TIME", "HOURS_BASED"],
//         message: "classType must be FIXED_TIME, FLEX_TIME, or HOURS_BASED",
//       },
//       required: [true, "Class type is required"],
//     },
//     startTime: {
//       type: String,
//       default: null,
//     },
//     endTime: {
//       type: String,
//       default: null,
//     },
//     days: {
//       type: [String],
//       enum: {
//         values: ["MON", "TUE", "WED", "THU", "FRI", "SAT", "SUN"],
//         message: "{VALUE} is not a valid day",
//       },
//       default: [],
//     },
//     level: {
//       type: Number,
//       min: [0, "Level cannot be less than 0"],
//       max: [100, "Level cannot exceed 100"],
//       default: 0,
//     },
//     teacherId: {
//       type: mongoose.Schema.Types.ObjectId,
//       ref: "Teacher",
//       default: null,
//     },
//     status: {
//       type: String,
//       enum: ["Active", "Inactive"],
//       default: "Active",
//     },
//     createdBy: {
//       type: mongoose.Schema.Types.ObjectId,
//       ref: "User",
//       required: [true, "Please provide creator"],
//     },
//   },
//   {
//     timestamps: true,
//     toJSON: { virtuals: true },
//     toObject: { virtuals: true },
//   },
// );

// classSchema.index({ status: 1 });
// classSchema.index({ classType: 1 });

// classSchema.pre("save", async function (next) {
//   if (this.classId) return next();
//   try {
//     const counterKey = "class-id";
//     const counter = await Counter.findOneAndUpdate(
//       { name: counterKey },
//       { $inc: { seq: 1 } },
//       { new: true, upsert: true, setDefaultsOnInsert: true },
//     );
//     this.classId = `CLS${String(counter.seq).padStart(3, "0")}`;
//     next();
//   } catch (err) {
//     next(err);
//   }
// });

// module.exports = mongoose.model("Class", classSchema);



//========New code after refactor========

const mongoose = require('mongoose');
const Counter = require('../shared/counter.model');

const classSchema = new mongoose.Schema(
  {
    classId: {
      type: String,
      unique: true,
      trim: true,
    },
    name: {
      type: String,
      required: [true, 'Class name is required'],
      trim: true,
      maxlength: [100, 'Class name cannot exceed 100 characters'],
    },
    section: {
      type: String,
      trim: true,
      maxlength: [50, 'Section cannot exceed 50 characters'],
      default: '',
    },
    classType: {
      type: String,
      enum: {
        values: ['FIXED_TIME', 'FLEX_TIME', 'HOURS_BASED'],
        message: 'classType must be FIXED_TIME, FLEX_TIME, or HOURS_BASED',
      },
      required: [true, 'Class type is required'],
    },
    startTime: {
      type: String,
      default: null,
    },
    endTime: {
      type: String,
      default: null,
    },
    days: {
      type: [String],
      enum: {
        values: ['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN'],
        message: '{VALUE} is not a valid day',
      },
      default: [],
    },
    level: {
      type: Number,
      min: [0, 'Level cannot be less than 0'],
      max: [100, 'Level cannot exceed 100'],
      default: 0,
    },
    teacherId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Teacher',
      default: null,
    },
    status: {
      type: String,
      enum: ['Active', 'Inactive'],
      default: 'Active',
    },
    // ─── Fee Fields ───────────────────────────────────────────────────────────
    baseFee: {
      type: Number,
      default: 0,
      min: [0, 'Base fee cannot be negative'],
    },
    // Monthly free hours (only for HOURS_BASED free-hour classes)
    monthlyFreeHours: {
      type: Number,
      default: 0,
      min: 0,
    },
    // Whether late fine applies to this class
    lateFineApplicable: {
      type: Boolean,
      default: false,
    },
    // Fee type for billing
    feeType: {
      type: String,
      enum: ['MONTHLY', 'ONE_TIME', 'FREE', 'INSTALLMENT'],
      default: 'MONTHLY',
    },
    // Admin-defined installment schedule template. Only meaningful when
    // feeType === 'INSTALLMENT'. Snapshotted into concrete Installment docs
    // once per enrollment — never re-read after that.
    installmentTemplate: {
      type: [
        {
          seq:        { type: Number, required: true },
          label:      { type: String, trim: true, default: '' },
          amount:     { type: Number, required: true, min: 0 },
          offsetDays: { type: Number, default: 0, min: 0 },
        },
      ],
      default: [],
      _id: false,
    },
    // Marks a HOURS_BASED class as a prepaid Flexi Card tier (buy hours
    // upfront, deduct as attended, no overage billing) instead of the
    // legacy monthly-free-hours allowance + overage mechanism.
    isPrepaidHoursCard: {
      type: Boolean,
      default: false,
    },
    // Fixed hour bundle size for a prepaid card tier. Only meaningful when
    // isPrepaidHoursCard === true. baseFee is the tier price.
    hoursInTier: {
      type: Number,
      default: 0,
      min: 0,
    },
    // ──────────────────────────────────────────────────────────────────────────

    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Please provide creator'],
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

classSchema.index({ status: 1 });
classSchema.index({ classType: 1 });

classSchema.pre('save', async function (next) {
  if (this.classId) return next();
  try {
    const counterKey = 'class-id';
    const counter = await Counter.findOneAndUpdate(
      { name: counterKey },
      { $inc: { seq: 1 } },
      { new: true, upsert: true, setDefaultsOnInsert: true }
    );
    this.classId = `CLS${String(counter.seq).padStart(3, '0')}`;
    next();
  } catch (err) {
    next(err);
  }
});

module.exports = mongoose.model('Class', classSchema);