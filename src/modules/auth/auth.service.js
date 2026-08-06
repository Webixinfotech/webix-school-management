const User = require("./user.model");
const ErrorResponse = require("../../utils/errorResponse");

/**
 * Register admin user
 * @param {Object} userData - User data
 * @returns {Object} Created user
 */
exports.registerAdmin = async (userData) => {
  // Check if admin already exists
  const adminExists = await User.findOne({ role: "admin" });
  if (adminExists) {
    throw new ErrorResponse(
      "Admin already exists. Only one admin is allowed.",
      400,
    );
  }

  // Create admin user
  const user = await User.create({
    ...userData,
    role: "admin",
  });

  return user;
};

/**
 * Register user (teacher, parent)
 * @param {Object} userData - User data
 * @param {string} role - User role
 * @returns {Object} Created user
 */
exports.registerUser = async (userData, role) => {
  // Validate role
  const validRoles = ["teacher", "parent"];
  if (!validRoles.includes(role)) {
    throw new ErrorResponse(
      "Invalid role. Allowed: teacher, parent",
      400,
    );
  }

  // Check if email already exists
  const emailExists = await User.findOne({ email: userData.email });
  if (emailExists) {
    throw new ErrorResponse("Email already registered", 400);
  }

  // Check if phone already exists
  const phoneExists = await User.findOne({ phone: userData.phone });
  if (phoneExists) {
    throw new ErrorResponse("Phone number already registered", 400);
  }

  // Create user
  const user = await User.create({
    ...userData,
    role,
  });

  return user;
};

/**
 * Login user
 * @param {string} emailOrPhone - User email or phone number
 * @param {string} password - User password
 * @returns {Object} User object with password
 */
exports.loginUser = async (emailOrPhone, password) => {
  // Determine if input is email or phone
  const isPhone = /^[6-9]\d{9}$/.test(emailOrPhone);

  // Build query based on input type
  const query = isPhone
    ? { phone: emailOrPhone }
    : { email: emailOrPhone.toLowerCase() };

  // Check for user (include password field)
  const user = await User.findOne(query).select("+password");

  if (!user) {
    throw new ErrorResponse("Invalid credentials", 401);
  }

  // Check if user is active
  if (!user.isActive) {
    throw new ErrorResponse("Account is deactivated. Contact admin.", 403);
  }

  // Check password
  const isMatch = await user.matchPassword(password);

  if (!isMatch) {
    throw new ErrorResponse("Invalid credentials", 401);
  }

  // Update last login
  user.lastLogin = Date.now();
  await user.save();

  return user;
};

/**
 * Get user by ID
 * @param {string} userId - User ID
 * @returns {Object} User object
 */
exports.getUserById = async (userId) => {
  const user = await User.findById(userId);

  if (!user) {
    throw new ErrorResponse("User not found", 404);
  }

  return user;
};

/**
 * Update user profile
 * @param {string} userId - User ID
 * @param {Object} updateData - Fields to update
 * @returns {Object} Updated user
 */
exports.updateUserProfile = async (userId, updateData) => {
  const user = await User.findByIdAndUpdate(userId, updateData, {
    new: true,
    runValidators: true,
  });

  if (!user) {
    throw new ErrorResponse("User not found", 404);
  }

  return user;
};

/**
 * Change user password
 * @param {string} userId - User ID
 * @param {string} currentPassword - Current password
 * @param {string} newPassword - New password
 * @returns {Object} Updated user
 */
exports.changeUserPassword = async (userId, currentPassword, newPassword) => {
  const user = await User.findById(userId).select("+password");

  if (!user) {
    throw new ErrorResponse("User not found", 404);
  }

  // Check current password
  const isMatch = await user.matchPassword(currentPassword);

  if (!isMatch) {
    throw new ErrorResponse("Current password is incorrect", 401);
  }

  user.password = newPassword;
  await user.save();

  return user;
};

/**
 * Admin change user password (does not require current password)
 * @param {string} userId - User ID to change password for
 * @param {string} newPassword - New password
 * @returns {Object} Updated user
 */
exports.adminChangeUserPassword = async (userId, newPassword) => {
  const user = await User.findById(userId);

  if (!user) {
    throw new ErrorResponse("User not found", 404);
  }

  user.password = newPassword;
  await user.save();

  return user;
};

/**
 * Let a teacher reset a parent's password, scoped to parents of students
 * in the teacher's own classes. Never allows resetting an admin/teacher
 * account's password — only accounts with role "parent".
 * @param {String} userId - target User _id (must be role "parent")
 * @param {String} newPassword
 * @param {Object} requestingUser - req.user (role "admin" or "teacher")
 */
exports.teacherChangeParentPassword = async (userId, newPassword, requestingUser) => {
  const user = await User.findById(userId);

  if (!user) {
    throw new ErrorResponse("User not found", 404);
  }

  if (user.role !== "parent") {
    throw new ErrorResponse(
      "This endpoint can only reset a parent's password",
      403,
    );
  }

  if (requestingUser.role === "teacher") {
    const Teacher = require("../teacher/teacher.model");
    const Student = require("../student/student.model");

    const teacher = await Teacher.findOne({
      userId: requestingUser._id,
      status: "Active",
    }).select("classIds");

    const teacherClassIds = teacher?.classIds || [];

    const linkedStudent = teacherClassIds.length
      ? await Student.findOne({
          parentUserId: user._id,
          classIds: { $in: teacherClassIds },
        }).select("_id")
      : null;

    if (!linkedStudent) {
      throw new ErrorResponse(
        "You can only reset the password for a parent of a student in your own class",
        403,
      );
    }
  }

  user.password = newPassword;
  await user.save();

  return user;
};
