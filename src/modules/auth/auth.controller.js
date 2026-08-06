const ErrorResponse = require("../../utils/errorResponse");
const sendTokenResponse = require("../../utils/sendTokenResponse");
const authService = require("./auth.service");

/**
 * @desc    Register admin (only 1 allowed with secret key)
 * @route   POST /api/auth/register-admin
 * @access  Public (requires adminSecretKey)
 */
exports.registerAdmin = async (req, res, next) => {
  try {
    const { name, email, password, phone, adminSecretKey } = req.body;

    // Verify admin secret key from environment
    if (!process.env.ADMIN_SECRET_KEY) {
      return next(new ErrorResponse("Admin secret key not configured", 500));
    }
    if (adminSecretKey !== process.env.ADMIN_SECRET_KEY) {
      return next(new ErrorResponse("Invalid admin secret key", 401));
    }

    const user = await authService.registerAdmin({
      name,
      email,
      password,
      phone,
    });

    sendTokenResponse(user, 201, res);
  } catch (err) {
    next(err);
  }
};

/**
 * @desc    Register user (teacher, parent)
 * @route   POST /api/auth/register
 * @access  Private (requires admin auth)
 */
exports.registerUser = async (req, res, next) => {
  try {
    const { name, email, password, phone, role } = req.body;

    // Validate role
    const allowedRoles = ["teacher", "parent"];
    if (!allowedRoles.includes(role)) {
      return next(
        new ErrorResponse(
          "Invalid role. Allowed: teacher, parent",
          400,
        ),
      );
    }

    // Check permissions: only admin can register users
    if (!req.user || req.user.role !== "admin") {
      return next(new ErrorResponse("Not authorized to register users", 403));
    }

    const user = await authService.registerUser(
      {
        name,
        email,
        password,
        phone,
      },
      role,
    );

    sendTokenResponse(user, 201, res);
  } catch (err) {
    next(err);
  }
};

/**
 * @desc    Login user (all roles)
 * @route   POST /api/auth/login
 * @access  Public
 */
exports.login = async (req, res, next) => {
  try {
    const { email, phone, password } = req.body;

    // Validate password
    if (!password) {
      return next(new ErrorResponse("Please provide password", 400));
    }

    // Validate email or phone
    const emailOrPhone = email || phone;
    if (!emailOrPhone) {
      return next(
        new ErrorResponse("Please provide email or phone number", 400),
      );
    }

    const user = await authService.loginUser(emailOrPhone, password);

    sendTokenResponse(user, 200, res);
  } catch (err) {
    next(err);
  }
};

/**
 * @desc    Get current logged in user
 * @route   GET /api/auth/me
 * @access  Private
 */
exports.getMe = async (req, res, next) => {
  try {
    const user = await authService.getUserById(req.user.id);

    res.status(200).json({
      success: true,
      data: user,
    });
  } catch (err) {
    next(err);
  }
};

/**
 * @desc    Update user profile (name and phone only)
 * @route   PUT /api/auth/update-profile
 * @access  Private
 */
exports.updateProfile = async (req, res, next) => {
  try {
    const fieldsToUpdate = {};

    if (req.body.name) {
      fieldsToUpdate.name = req.body.name;
    }

    if (req.body.phone) {
      fieldsToUpdate.phone = req.body.phone;
    }

    const user = await authService.updateUserProfile(
      req.user.id,
      fieldsToUpdate,
    );

    res.status(200).json({
      success: true,
      data: user,
    });
  } catch (err) {
    next(err);
  }
};

/**
 * @desc    Change password
 * @route   PUT /api/auth/change-password
 * @access  Private
 */
exports.changePassword = async (req, res, next) => {
  try {
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return next(
        new ErrorResponse("Please provide current and new password", 400),
      );
    }

    const user = await authService.changeUserPassword(
      req.user.id,
      currentPassword,
      newPassword,
    );

    sendTokenResponse(user, 200, res);
  } catch (err) {
    next(err);
  }
};

/**
 * @desc    Logout user / clear cookie
 * @route   POST /api/auth/logout
 * @access  Private
 */
exports.logout = async (req, res, next) => {
  try {
    res.cookie("token", "none", {
      expires: new Date(Date.now() + 10 * 1000),
      httpOnly: true,
    });

    res.status(200).json({
      success: true,
      message: "Logged out successfully",
    });
  } catch (err) {
    next(err);
  }
};

/**
 * @desc    Admin change user password (no current password required)
 * @route   PUT /api/auth/admin/change-password/:userId
 * @access  Private (Admin only)
 */
exports.adminChangePassword = async (req, res, next) => {
  try {
    const { userId } = req.params;
    const { newPassword } = req.body;

    if (!newPassword) {
      return next(new ErrorResponse("Please provide new password", 400));
    }

    // Validate password length
    if (newPassword.length < 6) {
      return next(
        new ErrorResponse("Password must be at least 6 characters", 400),
      );
    }

    const user = await authService.adminChangeUserPassword(userId, newPassword);

    res.status(200).json({
      success: true,
      data: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
    });
  } catch (err) {
    next(err);
  }
};

/**
 * @desc    Teacher resets a parent's password, scoped to parents of
 *          students in the teacher's own classes
 * @route   PUT /api/auth/teacher/change-parent-password/:userId
 * @access  Private (teacher with canManageStudents, or admin)
 */
exports.teacherChangeParentPassword = async (req, res, next) => {
  try {
    const { userId } = req.params;
    const { newPassword } = req.body;

    if (!newPassword) {
      return next(new ErrorResponse("Please provide new password", 400));
    }

    if (newPassword.length < 6) {
      return next(
        new ErrorResponse("Password must be at least 6 characters", 400),
      );
    }

    const user = await authService.teacherChangeParentPassword(
      userId,
      newPassword,
      req.user,
    );

    res.status(200).json({
      success: true,
      data: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
    });
  } catch (err) {
    next(err);
  }
};
