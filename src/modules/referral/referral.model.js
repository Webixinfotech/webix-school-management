const mongoose = require("mongoose");

const ReferralStatusHistorySchema = new mongoose.Schema(
  {
    status: {
      type: String,
      enum: ["pending", "joined", "rewarded", "failed"],
      required: true,
    },
    changedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    changedAt: {
      type: Date,
      default: Date.now,
    },
    note: {
      type: String,
      default: "",
    },
  },
  { _id: false },
);

const ReferralSchema = new mongoose.Schema(
  {
    // Who is referring
    referrerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "Please provide referrer user ID"],
    },
    referrerParentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Parent",
      required: [true, "Please provide referrer parent ID"],
    },
    referralCode: {
      type: String,
      required: [true, "Please provide referral code"],
    },

    // Who is being referred (friend/lead)
    friendName: {
      type: String,
      required: [true, "Please provide friend name"],
    },
    friendMobile: {
      type: String,
      required: [true, "Please provide friend mobile number"],
    },

    // How the referral came
    referralSource: {
      type: String,
      enum: ["manual", "link"],
      required: [true, "Please provide referral source"],
    },

    // Duplicate check (if this mobile was already referred)
    isDuplicate: {
      type: Boolean,
      default: false,
    },
    duplicateNote: {
      type: String,
      default: "",
    },

    // Status tracking
    status: {
      type: String,
      enum: ["pending", "joined", "rewarded", "failed"],
      default: "pending",
    },
    statusHistory: {
      type: [ReferralStatusHistorySchema],
      default: [],
    },

    // Populated when friend joins
    joinedAt: {
      type: Date,
      default: null,
    },
    childName: {
      type: String,
      default: "",
    },
    enquiryId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Enquiry",
      default: null,
    },
    studentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Student",
      default: null,
    },

    // Reward tracking
    rewardPoints: {
      type: Number,
      default: 0,
    },
    rewardedAt: {
      type: Date,
      default: null,
    },
    rewardNote: {
      type: String,
      default: "",
    },
  },
  {
    timestamps: true,
  },
);

// Index for efficient mobile number lookups
ReferralSchema.index({ friendMobile: 1, status: 1 });
ReferralSchema.index({ referrerParentId: 1, status: 1 });
ReferralSchema.index({ studentId: 1 });
ReferralSchema.index({ enquiryId: 1 });

/**
 * Static method to find pending referral by mobile number
 * @param {string} mobile - Mobile number to search
 * @returns {Promise<Mongoose.Query>}
 */
ReferralSchema.statics.findByMobile = function (mobile) {
  return this.findOne({
    friendMobile: mobile,
    status: "pending",
  });
};

module.exports = mongoose.model("Referral", ReferralSchema);
