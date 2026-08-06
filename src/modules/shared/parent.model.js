const mongoose = require("mongoose");

const ParentSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "Please provide user ID"],
      unique: true,
    },
    children: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Student",
      },
    ],
    referralCode: {
      type: String,
      unique: true,
      sparse: true,
    },
    referredBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Parent",
      default: null,
    },
    referralStats: {
      total: {
        type: Number,
        default: 0,
      },
      successful: {
        type: Number,
        default: 0,
      },
      pending: {
        type: Number,
        default: 0,
      },
      rewardPoints: {
        type: Number,
        default: 0,
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
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
  },
  {
    timestamps: true,
  },
);

// Pre-save hook to auto-generate referral code
ParentSchema.pre("save", async function (next) {
  if (this.referralCode) {
    return next();
  }

  try {
    const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
    let randomCode = "";

    for (let i = 0; i < 6; i++) {
      randomCode += chars.charAt(Math.floor(Math.random() * chars.length));
    }

    this.referralCode = `BB${randomCode}`;
    next();
  } catch (err) {
    next(err);
  }
});

module.exports = mongoose.model("Parent", ParentSchema);
