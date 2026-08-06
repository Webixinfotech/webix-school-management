const referralService = require("./referral.service");

/**
 * @desc    Check if mobile number is already referred
 * @route   POST /api/referrals/check-mobile
 * @access  Parent only
 */
exports.checkMobile = async (req, res, next) => {
  try {
    const { mobile } = req.body;

    if (!mobile) {
      return next(
        new (require("../../utils/errorResponse"))(
          "Please provide mobile number",
          400,
        ),
      );
    }

    const result = await referralService.checkMobile(mobile, req.user._id);

    if (result.alreadyReferred) {
      return res.status(200).json({
        success: true,
        message: "This mobile number is already referred",
        alreadyReferred: true,
        referredBy: result.referredBy,
        referredOn: result.referredOn,
      });
    }

    res.status(200).json({
      success: true,
      message: "Mobile number is available for referral",
      alreadyReferred: false,
      referralCode: result.referralCode,
    });
  } catch (err) {
    next(err);
  }
};

/**
 * @desc    Create manual referral
 * @route   POST /api/referrals/manual
 * @access  Parent only
 */
exports.createManualReferral = async (req, res, next) => {
  try {
    const { friendName, friendMobile, childName } = req.body;

    if (!friendName || !friendMobile) {
      return next(
        new (require("../../utils/errorResponse"))(
          "Please provide friend name and mobile number",
          400,
        ),
      );
    }

    const data = await referralService.createManualReferral(
      { friendName, friendMobile, childName },
      req.user._id,
    );

    res.status(201).json({
      success: true,
      message: "Referral created successfully",
      data,
    });
  } catch (err) {
    next(err);
  }
};

/**
 * @desc    Submit link referral
 * @route   POST /api/referrals/link
 * @access  Public
 */
exports.submitLinkReferral = async (req, res, next) => {
  try {
    const { referralCode, friendName, friendMobile, childName } = req.body;

    if (!referralCode || !friendName || !friendMobile) {
      return next(
        new (require("../../utils/errorResponse"))(
          "Please provide referral code, friend name and mobile number",
          400,
        ),
      );
    }

    const data = await referralService.submitLinkReferral({
      referralCode,
      friendName,
      friendMobile,
      childName,
    });

    res.status(201).json({
      success: true,
      message: "Referral submitted successfully",
      data,
    });
  } catch (err) {
    next(err);
  }
};

/**
 * @desc    Get my referrals (parent's own referrals)
 * @route   GET /api/referrals/my
 * @access  Parent only
 */
exports.getMyReferrals = async (req, res, next) => {
  try {
    const referrals = await referralService.getMyReferrals(req.user._id);

    res.status(200).json({
      success: true,
      count: referrals.length,
      data: referrals,
    });
  } catch (err) {
    next(err);
  }
};

/**
 * @desc    Get my referral stats
 * @route   GET /api/referrals/my/stats
 * @access  Parent only
 */
exports.getMyReferralStats = async (req, res, next) => {
  try {
    const data = await referralService.getMyReferralStats(req.user._id);

    res.status(200).json({
      success: true,
      data,
    });
  } catch (err) {
    next(err);
  }
};

/**
 * @desc    Get all referrals (admin view)
 * @route   GET /api/referrals
 * @access  Admin, Sub-admin
 */
exports.getAllReferrals = async (req, res, next) => {
  try {
    const { status, source, page, limit } = req.query;

    const result = await referralService.getAllReferrals({
      status,
      source,
      page: page || 1,
      limit: limit || 25,
    });

    res.status(200).json({
      success: true,
      count: result.count,
      total: result.total,
      page: result.page,
      pages: result.pages,
      data: result.data,
    });
  } catch (err) {
    next(err);
  }
};

/**
 * @desc    Get single referral
 * @route   GET /api/referrals/:id
 * @access  Admin, Sub-admin
 */
exports.getReferral = async (req, res, next) => {
  try {
    const data = await referralService.getReferral(req.params.id);

    res.status(200).json({
      success: true,
      data,
    });
  } catch (err) {
    next(err);
  }
};

/**
 * @desc    Update referral status
 * @route   PUT /api/referrals/:id/status
 * @access  Admin only
 */
exports.updateReferralStatus = async (req, res, next) => {
  try {
    const { status, note, childName, rewardPoints } = req.body;

    if (!status) {
      return next(
        new (require("../../utils/errorResponse"))(
          "Please provide status",
          400,
        ),
      );
    }

    const data = await referralService.updateReferralStatus(
      req.params.id,
      { status, note, childName, rewardPoints },
      req.user._id,
    );

    res.status(200).json({
      success: true,
      message: "Referral status updated successfully",
      data,
    });
  } catch (err) {
    next(err);
  }
};

/**
 * @desc    Get referral stats (admin view)
 * @route   GET /api/referrals/stats
 * @access  Admin, Sub-admin
 */
exports.getReferralStats = async (req, res, next) => {
  try {
    const data = await referralService.getReferralStats();

    res.status(200).json({
      success: true,
      data,
    });
  } catch (err) {
    next(err);
  }
};

/**
 * @desc    Validate referral code
 * @route   GET /api/referrals/validate/:code
 * @access  Public
 */
exports.validateReferralCode = async (req, res, next) => {
  try {
    const { code } = req.params;

    const data = await referralService.validateReferralCode(code);

    res.status(200).json({
      success: true,
      message: "Referral code is valid",
      data,
    });
  } catch (err) {
    next(err);
  }
};
