const parentService = require("./parent.service");

/**
 * @desc    Get all parents with pagination and filtering
 * @route   GET /api/parents
 * @access  Admin, Sub-admin
 */
exports.getParents = async (req, res, next) => {
  try {
    const { search, status, page, limit } = req.query;

    const result = await parentService.getAllParents({
      search,
      status,
      page: page || 1,
      limit: limit || 20,
    });

    res.status(200).json({
      success: true,
      total: result.total,
      page: result.page,
      pages: result.pages,
      count: result.count,
      data: result.data,
    });
  } catch (err) {
    next(err);
  }
};

/**
 * @desc    Get single parent by ID
 * @route   GET /api/parents/:id
 * @access  Admin, Sub-admin, Parent (own profile only)
 */
exports.getParent = async (req, res, next) => {
  try {
    const parent = await parentService.getParentById(
      req.params.id,
      req.user.role,
      req.user._id,
    );

    res.status(200).json({
      success: true,
      data: parent,
    });
  } catch (err) {
    next(err);
  }
};

/**
 * @desc    Update parent details
 * @route   PUT /api/parents/:id
 * @access  Admin, Sub-admin
 */
exports.updateParent = async (req, res, next) => {
  try {
    const parent = await parentService.updateParent(req.params.id, req.body);

    res.status(200).json({
      success: true,
      message: "Parent updated successfully",
      data: parent,
    });
  } catch (err) {
    next(err);
  }
};

/**
 * @desc    Deactivate parent account
 * @route   PUT /api/parents/:id/deactivate
 * @access  Admin only
 */
exports.deactivateParent = async (req, res, next) => {
  try {
    const result = await parentService.deactivateParent(req.params.id);

    res.status(200).json({
      success: true,
      message: result.message,
    });
  } catch (err) {
    next(err);
  }
};

/**
 * @desc    Activate parent account
 * @route   PUT /api/parents/:id/activate
 * @access  Admin only
 */
exports.activateParent = async (req, res, next) => {
  try {
    const result = await parentService.activateParent(req.params.id);

    res.status(200).json({
      success: true,
      message: result.message,
    });
  } catch (err) {
    next(err);
  }
};

/**
 * @desc    Get parent's children
 * @route   GET /api/parents/:id/children
 * @access  Admin, Sub-admin, Teacher, Parent (own profile only)
 */
exports.getParentChildren = async (req, res, next) => {
  try {
    const result = await parentService.getParentChildren(
      req.params.id,
      req.user.role,
      req.user._id,
    );

    res.status(200).json({
      success: true,
      count: result.count,
      data: result.data,
    });
  } catch (err) {
    next(err);
  }
};

/**
 * @desc    Get my profile (for parent users)
 * @route   GET /api/parents/my-profile
 * @access  Parent only
 */
exports.getMyProfile = async (req, res, next) => {
  try {
    const parent = await parentService.getMyProfile(req.user._id);

    res.status(200).json({
      success: true,
      data: parent,
    });
  } catch (err) {
    next(err);
  }
};

/**
 * @desc    Update my profile (for parent users)
 * @route   PUT /api/parents/my-profile
 * @access  Parent only
 */
exports.updateMyProfile = async (req, res, next) => {
  try {
    const parent = await parentService.updateMyProfile(req.user._id, req.body);

    res.status(200).json({
      success: true,
      message: "Profile updated successfully",
      data: parent,
    });
  } catch (err) {
    next(err);
  }
};

/**
 * @desc    Get parent statistics
 * @route   GET /api/parents/stats
 * @access  Admin, Sub-admin
 */
exports.getParentStats = async (req, res, next) => {
  try {
    const stats = await parentService.getParentStats();

    res.status(200).json({
      success: true,
      data: stats,
    });
  } catch (err) {
    next(err);
  }
};
