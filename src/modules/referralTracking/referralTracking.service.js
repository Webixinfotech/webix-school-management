const Referral = require("../../modules/referral/referral.model");
const Parent = require("../shared/parent.model");
const Student = require("../student/student.model");
const ErrorResponse = require("../../utils/errorResponse");

/**
 * Get admin referral dashboard - Complete referral overview
 * @returns {Object} Dashboard statistics data
 */
exports.getDashboardStats = async () => {
  // Get all referrals with stats
  const allReferrals = await Referral.find()
    .populate("referrerParentId", "userId referralStats")
    .populate("studentId", "firstName lastName className")
    .sort({ createdAt: -1 });

  // Calculate overview stats
  const overview = {
    totalReferrals: allReferrals.length,
    pending: 0,
    joined: 0,
    rewarded: 0,
    failed: 0,
    duplicates: 0,
  };

  allReferrals.forEach((ref) => {
    if (ref.status === "pending") overview.pending += 1;
    else if (ref.status === "joined") overview.joined += 1;
    else if (ref.status === "rewarded") overview.rewarded += 1;
    else if (ref.status === "failed") overview.failed += 1;
    if (ref.isDuplicate) overview.duplicates += 1;
  });

  // Calculate conversion rate
  const convertedCount = overview.joined + overview.rewarded;
  overview.conversionRate =
    overview.totalReferrals > 0
      ? ((convertedCount / overview.totalReferrals) * 100).toFixed(1) + "%"
      : "0%";

  // Get recent joined referrals (last 5)
  const recentJoined = allReferrals
    .filter((ref) => ref.status === "joined")
    .slice(0, 5)
    .map((ref) => ({
      referralId: ref._id,
      referralCode: ref.referralCode,
      friendName: ref.friendName,
      friendMobile: ref.friendMobile,
      childName: ref.childName,
      joinedOn: ref.joinedAt,
      referrerParentId: ref.referrerParentId,
      studentId: ref.studentId
        ? {
            id: ref.studentId._id,
            name: `${ref.studentId.firstName} ${ref.studentId.lastName}`,
            className: ref.studentId.className,
          }
        : null,
    }));

  // Get pending referrals (last 10)
  const pendingReferrals = allReferrals
    .filter((ref) => ref.status === "pending")
    .slice(0, 10)
    .map((ref) => ({
      referralId: ref._id,
      referralCode: ref.referralCode,
      friendName: ref.friendName,
      friendMobile: ref.friendMobile,
      referralSource: ref.referralSource,
      referredOn: ref.createdAt,
      referrerParentId: ref.referrerParentId,
    }));

  // Get top referrers (by successful referrals)
  const parentMap = new Map();
  allReferrals.forEach((ref) => {
    if (!ref.referrerParentId) return;

    const parentId = ref.referrerParentId._id.toString();
    if (!parentMap.has(parentId)) {
      parentMap.set(parentId, {
        parentId,
        successful: 0,
        total: 0,
        rewardPoints: ref.referrerParentId?.referralStats?.rewardPoints || 0,
      });
    }
    const entry = parentMap.get(parentId);
    entry.total += 1;
    if (ref.status === "joined" || ref.status === "rewarded") {
      entry.successful += 1;
    }
  });

  const topReferrers = Array.from(parentMap.values())
    .sort((a, b) => b.successful - a.successful)
    .slice(0, 5);

  // Enrich top referrers with parent details
  const enrichedTopReferrers = await Promise.all(
    topReferrers.map(async (referrer) => {
      const parent = await Parent.findById(referrer.parentId).populate(
        "userId",
        "name phone",
      );
      return {
        parentName: parent?.userId?.name || "Unknown",
        parentPhone: parent?.userId?.phone || "Unknown",
        referralCode: parent?.referralCode || "N/A",
        successful: referrer.successful,
        total: referrer.total,
        rewardPoints: referrer.rewardPoints,
      };
    }),
  );

  // Get monthly stats (last 6 months)
  const now = new Date();
  const monthlyStats = [];

  for (let i = 5; i >= 0; i--) {
    const monthStart = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const monthEnd = new Date(now.getFullYear(), now.getMonth() - i + 1, 0);

    const monthReferrals = allReferrals.filter((ref) => {
      const refDate = new Date(ref.createdAt);
      return refDate >= monthStart && refDate <= monthEnd;
    });

    const monthData = {
      month: monthStart.toLocaleString("default", {
        month: "short",
        year: "numeric",
      }),
      total: monthReferrals.length,
      joined: monthReferrals.filter((r) => r.status === "joined").length,
      pending: monthReferrals.filter((r) => r.status === "pending").length,
    };

    monthlyStats.push(monthData);
  }

  return {
    overview,
    recentJoined,
    pendingReferrals,
    topReferrers: enrichedTopReferrers,
    monthlyStats,
  };
};

/**
 * Get parent's own referral tracking
 * @param {string} parentUserId - The parent user's _id
 * @returns {Object} Parent referral tracking data
 */
exports.getParentReferralTracking = async (parentUserId) => {
  // Find parent by userId
  const parent = await Parent.findOne({ userId: parentUserId });

  if (!parent) {
    throw new ErrorResponse("Parent account not found", 404);
  }

  // Find all referrals by this parent
  const referrals = await Referral.find({ referrerParentId: parent._id }).sort({
    createdAt: -1,
  });

  // Count by status
  const stats = {
    total: referrals.length,
    pending: 0,
    joined: 0,
    rewarded: 0,
    failed: 0,
    rewardPoints: parent.referralStats?.rewardPoints || 0,
  };

  referrals.forEach((ref) => {
    if (ref.status === "pending") stats.pending += 1;
    else if (ref.status === "joined") stats.joined += 1;
    else if (ref.status === "rewarded") stats.rewarded += 1;
    else if (ref.status === "failed") stats.failed += 1;
  });

  // Format referrals for response with masked mobile numbers
  const formattedReferrals = referrals.map((ref) => {
    // Mask mobile: show first 2 and last 3 digits
    const maskedMobile =
      ref.friendMobile.length >= 5
        ? `${ref.friendMobile.substring(0, 2)}XXXXX${ref.friendMobile.substring(ref.friendMobile.length - 3)}`
        : "XXXXX";

    return {
      referralId: ref._id,
      friendName: ref.friendName,
      friendMobile: maskedMobile,
      referralSource: ref.referralSource,
      status: ref.status,
      isDuplicate: ref.isDuplicate,
      referredOn: ref.createdAt,
      joinedOn: ref.joinedAt,
      childName:
        ref.status === "joined" || ref.status === "rewarded"
          ? ref.childName || ""
          : undefined,
      rewardPoints: ref.status === "rewarded" ? ref.rewardPoints : undefined,
    };
  });

  // Generate referral link
  const referralLink = `${process.env.FRONTEND_URL || "https://brainbuilder.com"}/ref/${parent.referralCode}`;

  return {
    referralCode: parent.referralCode,
    referralLink,
    stats,
    referrals: formattedReferrals,
  };
};

/**
 * Get student referral info - Did this student come through a referral?
 * @param {string} studentId - The student's _id
 * @returns {Object} Student referral information
 */
exports.getStudentReferralInfo = async (studentId, userRole, userId) => {
  // Find student
  const student = await Student.findById(studentId);

  if (!student) {
    throw new ErrorResponse("Student not found", 404);
  }

  // If role is parent, only allow access to their own child
  if (userRole === "parent") {
    const isOwnChild =
      student.parentUserId && student.parentUserId.toString() === userId.toString();

    if (!isOwnChild) {
      throw new ErrorResponse("Not authorized to access this student", 403);
    }
  }

  // Check if student was referred
  if (!student.referralInfo || !student.referralInfo.wasReferred) {
    return {
      studentId: student._id,
      studentName: `${student.firstName} ${student.lastName}`,
      wasReferred: false,
      referral: null,
    };
  }

  // Populate referral details
  const referral = await Referral.findById(student.referralInfo.referralId)
    .populate("referrerId", "name email phone")
    .populate("referrerParentId", "userId");

  if (!referral) {
    return {
      studentId: student._id,
      studentName: `${student.firstName} ${student.lastName}`,
      wasReferred: true,
      referral: null,
    };
  }

  // Get referrer parent details
  const referrerParent = await Parent.findById(
    referral.referrerParentId,
  ).populate("userId", "name email phone");

  return {
    studentId: student._id,
    studentName: `${student.firstName} ${student.lastName}`,
    admissionNo: student.admissionNo,
    className: student.className,
    wasReferred: true,
    referral: {
      referralId: referral._id,
      referralCode: referral.referralCode,
      referralSource: referral.referralSource,
      referrerName: referrerParent?.userId?.name || "Unknown",
      referrerPhone: referrerParent?.userId?.phone || "Unknown",
      referrerParentId: referral.referrerParentId,
      referredOn: referral.createdAt,
      joinedOn: referral.joinedAt,
      currentStatus: referral.status,
      rewardPoints: referral.rewardPoints,
      rewardedAt: referral.rewardedAt,
    },
  };
};

/**
 * Get referrer parent's profile and stats
 * @param {string} parentId - The parent's _id
 * @returns {Object} Referrer profile and referrals data
 */
exports.getReferrerProfile = async (parentId) => {
  // Validate parentId format before DB call
  if (!/^[a-fA-F0-9]{24}$/.test(parentId)) {
    throw new ErrorResponse("Invalid parent ID format", 400);
  }

  // Find parent
  const parent = await Parent.findById(parentId).populate(
    "userId",
    "name email phone",
  );

  if (!parent) {
    throw new ErrorResponse("Parent not found", 404);
  }

  // Find all referrals by this parent
  const referrals = await Referral.find({ referrerParentId: parentId })
    .populate("studentId", "firstName lastName admissionNo className section")
    .sort({ createdAt: -1 });

  // Count by status
  const stats = {
    total: referrals.length,
    pending: 0,
    joined: 0,
    rewarded: 0,
    failed: 0,
    rewardPoints: parent.referralStats?.rewardPoints || 0,
  };

  referrals.forEach((ref) => {
    if (ref.status === "pending") stats.pending += 1;
    else if (ref.status === "joined") stats.joined += 1;
    else if (ref.status === "rewarded") stats.rewarded += 1;
    else if (ref.status === "failed") stats.failed += 1;
  });

  // Format referrals for response
  const formattedReferrals = referrals.map((ref) => ({
    referralId: ref._id,
    friendName: ref.friendName,
    friendMobile: ref.friendMobile,
    status: ref.status,
    referralSource: ref.referralSource,
    isDuplicate: ref.isDuplicate,
    referredOn: ref.createdAt,
    joinedOn: ref.joinedAt,
    childName: ref.childName || "",
    rewardPoints: ref.rewardPoints,
    studentId: ref.studentId
      ? {
          id: ref.studentId._id,
          firstName: ref.studentId.firstName,
          lastName: ref.studentId.lastName,
          admissionNo: ref.studentId.admissionNo,
          className: ref.studentId.className,
          section: ref.studentId.section,
        }
      : null,
  }));

  return {
    parentId: parent._id,
    parentName: parent.userId?.name || "Unknown",
    parentPhone: parent.userId?.phone || "Unknown",
    parentEmail: parent.userId?.email || "Unknown",
    referralCode: parent.referralCode,
    stats,
    referrals: formattedReferrals,
  };
};
