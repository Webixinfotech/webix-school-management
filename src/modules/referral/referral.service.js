const mongoose = require("mongoose");
const Referral = require("./referral.model");
const Parent = require("../shared/parent.model");
const User = require("../auth/user.model");
const Enquiry = require("../../modules/enquiry/enquiry.model");
const Student = require("../../modules/student/student.model");
const ErrorResponse = require("../../utils/errorResponse");

/**
 * Check if mobile number is already referred
 * @param {string} mobile - Mobile number to check
 * @param {string} userId - Parent user ID
 * @returns {Object} Check result
 */
exports.checkMobile = async (mobile, userId) => {
  const parent = await Parent.findOne({ userId });

  if (!parent) {
    throw new ErrorResponse("Parent account not found", 404);
  }

  const existingReferral = await Referral.findOne({
    friendMobile: mobile,
    status: { $nin: ["rewarded", "failed"] },
  });

  if (existingReferral) {
    return {
      alreadyReferred: true,
      referredBy: existingReferral.referrerId,
      referredOn: existingReferral.createdAt,
    };
  }

  return {
    alreadyReferred: false,
    referralCode: parent.referralCode,
  };
};

/**
 * Create a manual referral
 * @param {Object} data - Referral data
 * @param {string} userId - Parent user ID
 * @returns {Object} Created referral data
 */
exports.createManualReferral = async (data, userId) => {
  const { friendName, friendMobile, childName } = data;

  const parent = await Parent.findOne({ userId });

  if (!parent) {
    throw new ErrorResponse("Parent account not found", 404);
  }

  const existingReferral = await Referral.findOne({
    friendMobile,
    status: { $nin: ["rewarded", "failed"] },
  });

  if (existingReferral) {
    throw new ErrorResponse(
      "This mobile number is already referred by someone",
      400,
    );
  }

  const referral = await Referral.create({
    referrerId: userId,
    referrerParentId: parent._id,
    referralCode: parent.referralCode,
    friendName,
    friendMobile,
    referralSource: "manual",
    childName: childName || "",
    status: "pending",
    statusHistory: [
      {
        status: "pending",
        changedBy: userId,
        changedAt: new Date(),
        note: "Manual referral created",
      },
    ],
  });

  return {
    referralId: referral._id,
    referralCode: referral.referralCode,
    friendName: referral.friendName,
    friendMobile: referral.friendMobile,
    status: referral.status,
    referredOn: referral.createdAt,
  };
};

/**
 * Submit a link referral (public)
 * @param {Object} data - Referral data
 * @returns {Object} Created referral data
 */
exports.submitLinkReferral = async (data) => {
  const { referralCode, friendName, friendMobile, childName } = data;

  const parent = await Parent.findOne({ referralCode });

  if (!parent) {
    throw new ErrorResponse("Invalid referral code", 404);
  }

  const existingReferral = await Referral.findOne({
    friendMobile,
    status: { $nin: ["rewarded", "failed"] },
  });

  if (existingReferral) {
    throw new ErrorResponse(
      "This mobile number is already referred by someone",
      400,
    );
  }

  const referral = await Referral.create({
    referrerId: parent.userId,
    referrerParentId: parent._id,
    referralCode,
    friendName,
    friendMobile,
    referralSource: "link",
    childName: childName || "",
    status: "pending",
    statusHistory: [
      {
        status: "pending",
        changedBy: parent.userId,
        changedAt: new Date(),
        note: "Link referral created",
      },
    ],
  });

  return {
    referralId: referral._id,
    referralCode: referral.referralCode,
    friendName: referral.friendName,
    friendMobile: referral.friendMobile,
    status: referral.status,
    referredOn: referral.createdAt,
  };
};

/**
 * Get parent's own referrals
 * @param {string} userId - Parent user ID
 * @returns {Object} Referrals list
 */
exports.getMyReferrals = async (userId) => {
  const parent = await Parent.findOne({ userId });

  if (!parent) {
    throw new ErrorResponse("Parent account not found", 404);
  }

  const referrals = await Referral.find({
    referrerParentId: parent._id,
  })
    .populate("studentId", "firstName lastName className section admissionNo")
    .sort({ createdAt: -1 });

  return referrals.map((ref) => ({
    referralId: ref._id,
    friendName: ref.friendName,
    friendMobile: ref.friendMobile,
    referralSource: ref.referralSource,
    status: ref.status,
    isDuplicate: ref.isDuplicate,
    childName: ref.childName,
    rewardPoints: ref.rewardPoints,
    referredOn: ref.createdAt,
    joinedOn: ref.joinedAt,
    rewardedAt: ref.rewardedAt,
    student: ref.studentId
      ? {
          id: ref.studentId._id,
          name: `${ref.studentId.firstName} ${ref.studentId.lastName}`,
          className: ref.studentId.className,
          section: ref.studentId.section,
          admissionNo: ref.studentId.admissionNo,
        }
      : null,
  }));
};

/**
 * Get parent's referral stats
 * @param {string} userId - Parent user ID
 * @returns {Object} Referral stats
 */
exports.getMyReferralStats = async (userId) => {
  const parent = await Parent.findOne({ userId });

  if (!parent) {
    throw new ErrorResponse("Parent account not found", 404);
  }

  const referrals = await Referral.find({
    referrerParentId: parent._id,
  });

  const stats = {
    total: referrals.length,
    pending: 0,
    joined: 0,
    rewarded: 0,
    failed: 0,
    duplicates: 0,
    rewardPoints: parent.referralStats?.rewardPoints || 0,
  };

  referrals.forEach((ref) => {
    if (ref.status === "pending") stats.pending += 1;
    else if (ref.status === "joined") stats.joined += 1;
    else if (ref.status === "rewarded") stats.rewarded += 1;
    else if (ref.status === "failed") stats.failed += 1;
    if (ref.isDuplicate) stats.duplicates += 1;
  });

  const convertedCount = stats.joined + stats.rewarded;
  stats.conversionRate =
    stats.total > 0
      ? ((convertedCount / stats.total) * 100).toFixed(1) + "%"
      : "0%";

  return {
    referralCode: parent.referralCode,
    stats,
  };
};

/**
 * Get all referrals (admin view)
 * @param {Object} queryOptions - Query options
 * @returns {Object} Referrals with pagination
 */
exports.getAllReferrals = async ({ status, source, page = 1, limit = 25 }) => {
  const query = {};

  if (status) query.status = status;
  if (source) query.referralSource = source;

  const skip = (parseInt(page) - 1) * parseInt(limit);

  const referrals = await Referral.find(query)
    .populate("referrerId", "name email phone")
    .populate("referrerParentId", "userId")
    .populate("studentId", "firstName lastName className section")
    .populate("enquiryId", "firstName lastName mobile")
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(parseInt(limit));

  const total = await Referral.countDocuments(query);

  const formattedReferrals = referrals.map((ref) => ({
    referralId: ref._id,
    referrerName: ref.referrerId?.name || "Unknown",
    referrerEmail: ref.referrerId?.email || "Unknown",
    referralCode: ref.referralCode,
    friendName: ref.friendName,
    friendMobile: ref.friendMobile,
    referralSource: ref.referralSource,
    status: ref.status,
    isDuplicate: ref.isDuplicate,
    childName: ref.childName,
    rewardPoints: ref.rewardPoints,
    referredOn: ref.createdAt,
    joinedOn: ref.joinedAt,
    rewardedAt: ref.rewardedAt,
    student: ref.studentId
      ? {
          id: ref.studentId._id,
          name: `${ref.studentId.firstName} ${ref.studentId.lastName}`,
          className: ref.studentId.className,
        }
      : null,
  }));

  return {
    total,
    page: parseInt(page),
    pages: Math.ceil(total / parseInt(limit)),
    count: formattedReferrals.length,
    data: formattedReferrals,
  };
};

/**
 * Get single referral by ID
 * @param {string} referralId - Referral ID
 * @returns {Object} Referral data
 */
exports.getReferral = async (referralId) => {
  if (!/^[a-fA-F0-9]{24}$/.test(referralId)) {
    throw new ErrorResponse("Invalid referral ID format", 400);
  }

  const referral = await Referral.findById(referralId)
    .populate("referrerId", "name email phone")
    .populate("referrerParentId", "userId")
    .populate("studentId", "firstName lastName className section admissionNo")
    .populate("enquiryId", "firstName lastName mobile email");

  if (!referral) {
    throw new ErrorResponse("Referral not found", 404);
  }

  return {
    referralId: referral._id,
    referrer: {
      id: referral.referrerId?._id,
      name: referral.referrerId?.name,
      email: referral.referrerId?.email,
      phone: referral.referrerId?.phone,
    },
    referrerParentId: referral.referrerParentId,
    referralCode: referral.referralCode,
    friendName: referral.friendName,
    friendMobile: referral.friendMobile,
    referralSource: referral.referralSource,
    status: referral.status,
    isDuplicate: referral.isDuplicate,
    duplicateNote: referral.duplicateNote,
    childName: referral.childName,
    statusHistory: referral.statusHistory,
    referredOn: referral.createdAt,
    joinedOn: referral.joinedAt,
    rewardedAt: referral.rewardedAt,
    rewardPoints: referral.rewardPoints,
    rewardNote: referral.rewardNote,
    student: referral.studentId
      ? {
          id: referral.studentId._id,
          name: `${referral.studentId.firstName} ${referral.studentId.lastName}`,
          className: referral.studentId.className,
          section: referral.studentId.section,
          admissionNo: referral.studentId.admissionNo,
        }
      : null,
    enquiry: referral.enquiryId
      ? {
          id: referral.enquiryId._id,
          firstName: referral.enquiryId.firstName,
          lastName: referral.enquiryId.lastName,
          mobile: referral.enquiryId.mobile,
          email: referral.enquiryId.email,
        }
      : null,
  };
};

/**
 * Update referral status
 * @param {string} referralId - Referral ID
 * @param {Object} data - Status update data
 * @param {string} userId - Admin user ID
 * @returns {Object} Updated referral data
 */
exports.updateReferralStatus = async (referralId, data, userId) => {
  const { status, note, childName, rewardPoints } = data;

  if (!/^[a-fA-F0-9]{24}$/.test(referralId)) {
    throw new ErrorResponse("Invalid referral ID format", 400);
  }

  const validStatuses = ["pending", "joined", "rewarded", "failed"];
  if (!validStatuses.includes(status)) {
    throw new ErrorResponse(
      "Invalid status. Must be: pending, joined, rewarded, or failed",
      400,
    );
  }

  const referral = await Referral.findById(referralId);

  if (!referral) {
    throw new ErrorResponse("Referral not found", 404);
  }

  referral.status = status;
  referral.statusHistory.push({
    status,
    changedBy: userId,
    changedAt: new Date(),
    note: note || "",
  });

  if (status === "joined") {
    referral.joinedAt = new Date();
    if (childName) referral.childName = childName;
  }

  if (status === "rewarded") {
    referral.rewardedAt = new Date();
    if (rewardPoints) referral.rewardPoints = rewardPoints;
    if (note) referral.rewardNote = note;
  }

  await referral.save();

  // Update parent referral stats
  const parent = await Parent.findById(referral.referrerParentId);
  if (parent) {
    if (!parent.referralStats) {
      parent.referralStats = {
        total: 0,
        successful: 0,
        pending: 0,
        rewardPoints: 0,
      };
    }

    const allReferrals = await Referral.find({
      referrerParentId: parent._id,
    });

    parent.referralStats.total = allReferrals.length;
    parent.referralStats.pending = allReferrals.filter(
      (r) => r.status === "pending",
    ).length;
    parent.referralStats.successful = allReferrals.filter(
      (r) => r.status === "joined" || r.status === "rewarded",
    ).length;
    parent.referralStats.rewardPoints = allReferrals.reduce(
      (sum, r) => sum + (r.rewardPoints || 0),
      0,
    );

    await parent.save();
  }

  return {
    referralId: referral._id,
    status: referral.status,
    updatedAt: new Date(),
  };
};

/**
 * Get admin referral stats
 * @returns {Object} Referral stats
 */
exports.getReferralStats = async () => {
  const allReferrals = await Referral.find();

  const stats = {
    total: allReferrals.length,
    pending: 0,
    joined: 0,
    rewarded: 0,
    failed: 0,
    duplicates: 0,
    totalRewardPoints: 0,
  };

  allReferrals.forEach((ref) => {
    if (ref.status === "pending") stats.pending += 1;
    else if (ref.status === "joined") stats.joined += 1;
    else if (ref.status === "rewarded") {
      stats.rewarded += 1;
      stats.totalRewardPoints += ref.rewardPoints || 0;
    } else if (ref.status === "failed") stats.failed += 1;
    if (ref.isDuplicate) stats.duplicates += 1;
  });

  const convertedCount = stats.joined + stats.rewarded;
  stats.conversionRate =
    stats.total > 0
      ? ((convertedCount / stats.total) * 100).toFixed(1) + "%"
      : "0%";

  const sourceBreakdown = {
    manual: allReferrals.filter((r) => r.referralSource === "manual").length,
    link: allReferrals.filter((r) => r.referralSource === "link").length,
  };

  return { stats, sourceBreakdown };
};

/**
 * Validate referral code
 * @param {string} code - Referral code to validate
 * @returns {Object} Validation result
 */
exports.validateReferralCode = async (code) => {
  const parent = await Parent.findOne({ referralCode: code }).populate(
    "userId",
    "name email phone",
  );

  if (!parent) {
    throw new ErrorResponse("Invalid referral code", 404);
  }

  return {
    referralCode: parent.referralCode,
    referrerName: parent.userId?.name || "Unknown",
    isValid: true,
  };
};

/**
 * Shared: Find and auto-join a referral for a fresh student admission
 * Checks all mobile variants against pending referrals,marks the match as "joined"
 * updates parent stats student referralInfo, and returns tracking metadata
 *
 * @param {string[]} mobilesToCheck  - Array of 10-digit mobile strings
 * @param {mongoose.Types.ObjectId} newStudentId         - Newly created student _id
 * @param {string} childFullName                         - Full name of the admitted student
 * @param {string} autoJoinNote                          - Note to append to status history
 * @param {Object} [session]                             - Optional mongoose session (transaction)
 * @returns {Object} { found, referralId, referredBy, autoUpdatedToJoined }
 */
exports.findAndMatchReferralForFresherAdmission = async (
  mobilesToCheck,
  newStudentId,
  childFullName,
  autoJoinNote,
  session,
) => {
  const matchedReferral = await Referral.findOne({
    friendMobile: { $in: mobilesToCheck },
    status: { $nin: ["rewarded", "failed"] },
  }).session(session);

  if (!matchedReferral) {
    return { found: false };
  }

  matchedReferral.status = "joined";
  matchedReferral.joinedAt = new Date();
  matchedReferral.childName = childFullName;
  matchedReferral.studentId = newStudentId;
  matchedReferral.updatedAt = new Date();
  matchedReferral.statusHistory.push({
    status: "joined",
    changedBy: new mongoose.Types.ObjectId(),
    changedAt: new Date(),
    note: autoJoinNote || "Auto-joined via referral matching",
  });
  await matchedReferral.save({ session });

  // Update parent referral stats
  await Parent.findByIdAndUpdate(
    matchedReferral.referrerParentId,
    {
      $inc: {
        "referralStats.pending": -1,
        "referralStats.successful": 1,
      },
    },
    { session },
  );

  return {
    found: true,
    referralId: matchedReferral._id,
    referrerParentId: matchedReferral.referrerParentId,
    referredBy: matchedReferral.referrerId,
    referralCode: matchedReferral.referralCode,
    autoUpdatedToJoined: true,
  };
};

// ---------------------------------------------------------------
//  All functions are already exported individually above
//  via `exports.funcName = ...` — no need for module.exports here.
// ---------------------------------------------------------------
