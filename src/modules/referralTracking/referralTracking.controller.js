const referralTrackingService = require("./referralTracking.service");

/**
 * @desc    Get admin referral dashboard - Complete referral overview
 * @route   GET /api/referral-tracking/dashboard
 * @access  Admin, Sub-admin
 */
exports.getAdminReferralDashboard = async (req, res, next) => {
  try {
    const data = await referralTrackingService.getDashboardStats();

    res.status(200).json({
      success: true,
      data,
    });
  } catch (err) {
    next(err);
  }
};

/**
 * @desc    Get my referral tracking - Parent sees their own referrals
 * @route   GET /api/referral-tracking/my
 * @access  Parent only
 */
exports.getMyReferralTracking = async (req, res, next) => {
  try {
    const data = await referralTrackingService.getParentReferralTracking(
      req.user._id,
    );

    res.status(200).json({
      success: true,
      data,
    });
  } catch (err) {
    next(err);
  }
};

/**
 * @desc    Get student referral info - Did this student come through a referral?
 * @route   GET /api/referral-tracking/student/:studentId
 * @access  Admin, Sub-admin, Parent
 */
exports.getStudentReferralInfo = async (req, res, next) => {
  try {
    const { studentId } = req.params;
    const data = await referralTrackingService.getStudentReferralInfo(
      studentId,
      req.user.role,
      req.user._id,
    );

    res.status(200).json({
      success: true,
      data,
    });
  } catch (err) {
    next(err);
  }
};

/**
 * @desc    Get referrer profile - All referrals by a parent
 * @route   GET /api/referral-tracking/referrer/:parentId
 * @access  Admin, Sub-admin
 */
exports.getReferrerProfile = async (req, res, next) => {
  try {
    const { parentId } = req.params;
    const data = await referralTrackingService.getReferrerProfile(parentId);

    res.status(200).json({
      success: true,
      data,
    });
  } catch (err) {
    next(err);
  }
};
