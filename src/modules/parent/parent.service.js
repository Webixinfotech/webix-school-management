const mongoose = require("mongoose");
const Parent = require("../shared/parent.model");
const User = require("../auth/user.model");
const Student = require("../student/student.model");
const ErrorResponse = require("../../utils/errorResponse");

/**
 * Helper: Find parent by _id OR userId string
 * @param {string} idParam - The ID parameter from request
 * @param {mongoose.ClientSession} session - Optional MongoDB session for transactions
 * @returns {mongoose.Query}
 */
const findParentByIdOrUserId = (idParam, session = null) => {
  const isObjectId = /^[a-fA-F0-9]{24}$/.test(idParam);

  const query = Parent.findOne({
    $or: [...(isObjectId ? [{ _id: idParam }] : []), { userId: idParam }],
  });

  if (session) query.session(session);

  return query;
};

/**
 * Get all parents with pagination and filtering
 * @param {Object} queryOptions - Query options
 * @param {string} queryOptions.search - Search term
 * @param {string} queryOptions.status - Status filter (via User.isActive)
 * @param {number} queryOptions.page - Page number
 * @param {number} queryOptions.limit - Items per page
 * @returns {Object} Parents list with pagination info
 */
exports.getAllParents = async ({ search, status, page = 1, limit = 20 }) => {
  const query = {};

  // Filter by User status if provided
  if (status === "active") {
    query.isActive = true;
  } else if (status === "inactive") {
    query.isActive = false;
  }

  // Search in parent's associated user
  if (search) {
    const searchRegex = new RegExp(search, "i");

    // First, find all users matching the search
    const matchingUsers = await User.find({
      $or: [
        { name: searchRegex },
        { email: searchRegex },
        { phone: searchRegex },
      ],
    }).select("_id");

    const userIds = matchingUsers.map((user) => user._id);
    query.userId = { $in: userIds };
  }

  const total = await Parent.countDocuments(query);

  const parents = await Parent.find(query)
    .populate("userId", "name email phone isActive lastLogin photo")
    .populate(
      "children",
      "firstName lastName admissionNo className section photo",
    )
    .sort({ createdAt: -1 })
    .limit(parseInt(limit))
    .skip((parseInt(page) - 1) * parseInt(limit));

  return {
    total,
    page: parseInt(page),
    pages: Math.ceil(total / parseInt(limit)),
    count: parents.length,
    data: parents,
  };
};

/**
 * Get parent by ID or userId
 * @param {string} idParam - Parent ID or userId
 * @param {string} userRole - Requesting user's role
 * @param {string} userId - Requesting user's ID
 * @returns {Object} Parent document
 */
exports.getParentById = async (idParam, userRole, userId) => {
  const parent = await findParentByIdOrUserId(idParam)
    .populate("userId", "name email phone isActive lastLogin photo role")
    .populate({
      path: "children",
      populate: {
        path: "parentUserId",
        select: "name email phone",
      },
    });

  if (!parent) {
    throw new ErrorResponse("Parent not found", 404);
  }

  // If role is parent, check if they're accessing their own profile
  if (userRole === "parent") {
    const isOwnProfile = parent.userId._id.toString() === userId.toString();

    if (!isOwnProfile) {
      throw new ErrorResponse("Not authorized to access this parent", 403);
    }
  }

  return parent;
};

/**
 * Update parent details
 * @param {string} idParam - Parent ID or userId
 * @param {Object} updateData - Fields to update
 * @returns {Object} Updated parent
 */
exports.updateParent = async (idParam, updateData) => {
  // Fields that can be updated in Parent document
  const allowedParentFields = [
    "address.street",
    "address.city",
    "address.state",
    "address.pincode",
  ];

  // Fields that can be updated in User document
  const allowedUserFields = ["name", "phone", "photo"];

  const parent = await findParentByIdOrUserId(idParam);

  if (!parent) {
    throw new ErrorResponse("Parent not found", 404);
  }

  // Separate parent and user update data
  const parentUpdateData = {};
  const userUpdateData = {};

  // Handle nested address fields
  if (updateData.address) {
    if (updateData.address.street !== undefined)
      parentUpdateData["address.street"] = updateData.address.street;
    if (updateData.address.city !== undefined)
      parentUpdateData["address.city"] = updateData.address.city;
    if (updateData.address.state !== undefined)
      parentUpdateData["address.state"] = updateData.address.state;
    if (updateData.address.pincode !== undefined)
      parentUpdateData["address.pincode"] = updateData.address.pincode;
  }

  // Handle direct fields
  Object.keys(updateData).forEach((key) => {
    if (allowedParentFields.includes(key) && !key.startsWith("address.")) {
      parentUpdateData[key] = updateData[key];
    }
    if (allowedUserFields.includes(key)) {
      userUpdateData[key] = updateData[key];
    }
  });

  // Update User document if needed
  if (Object.keys(userUpdateData).length > 0) {
    await User.findByIdAndUpdate(parent.userId, userUpdateData, {
      new: true,
      runValidators: true,
    });
  }

  // Update Parent document if needed
  if (Object.keys(parentUpdateData).length > 0) {
    await Parent.findByIdAndUpdate(parent._id, parentUpdateData, {
      new: true,
      runValidators: true,
    });
  }

  // Fetch updated parent with populated fields
  const updatedParent = await Parent.findById(parent._id)
    .populate("userId", "name email phone isActive lastLogin photo role")
    .populate(
      "children",
      "firstName lastName admissionNo className section photo",
    );

  return updatedParent;
};

/**
 * Deactivate parent account (soft delete)
 * @param {string} idParam - Parent ID or userId
 * @returns {Object} Success message
 */
exports.deactivateParent = async (idParam) => {
  const parent = await findParentByIdOrUserId(idParam);

  if (!parent) {
    throw new ErrorResponse("Parent not found", 404);
  }

  // Deactivate associated User
  await User.findByIdAndUpdate(parent.userId, {
    isActive: false,
  });

  return { message: "Parent account deactivated successfully" };
};

/**
 * Activate parent account
 * @param {string} idParam - Parent ID or userId
 * @returns {Object} Success message
 */
exports.activateParent = async (idParam) => {
  const parent = await findParentByIdOrUserId(idParam);

  if (!parent) {
    throw new ErrorResponse("Parent not found", 404);
  }

  // Activate associated User
  await User.findByIdAndUpdate(parent.userId, {
    isActive: true,
  });

  return { message: "Parent account activated successfully" };
};

/**
 * Get parent's children (detailed)
 * @param {string} idParam - Parent ID or userId
 * @returns {Object} Children list with details
 */
exports.getParentChildren = async (idParam, userRole, userId) => {
  const parent = await findParentByIdOrUserId(idParam).populate({
    path: "children",
    populate: {
      path: "parentUserId",
      select: "name email phone",
    },
  });

  if (!parent) {
    throw new ErrorResponse("Parent not found", 404);
  }

  // If role is parent, check if they're accessing their own children
  if (userRole === "parent") {
    const isOwnProfile = parent.userId.toString() === userId.toString();

    if (!isOwnProfile) {
      throw new ErrorResponse("Not authorized to access this parent", 403);
    }
  }

  return {
    count: parent.children.length,
    data: parent.children,
  };
};

/**
 * Get parent profile (for parent users - self service)
 * @param {string} userId - Parent user ID
 * @returns {Object} Parent profile
 */
exports.getMyProfile = async (userId) => {
  const parent = await Parent.findOne({ userId })
    .populate("userId", "name email phone isActive lastLogin photo role")
    .populate({
      path: "children",
      populate: {
        path: "parentUserId",
        select: "name email phone",
      },
    });

  if (!parent) {
    throw new ErrorResponse("Parent account not found", 404);
  }

  return parent;
};

/**
 * Update my profile (for parent users - self service)
 * @param {string} userId - Parent user ID
 * @param {Object} updateData - Fields to update
 * @returns {Object} Updated parent
 */
exports.updateMyProfile = async (userId, updateData) => {
  const parent = await Parent.findOne({ userId });

  if (!parent) {
    throw new ErrorResponse("Parent account not found", 404);
  }

  // Update User fields (name, phone)
  const userUpdateFields = {};
  if (updateData.name) userUpdateFields.name = updateData.name;
  if (updateData.phone) userUpdateFields.phone = updateData.phone;

  if (Object.keys(userUpdateFields).length > 0) {
    await User.findByIdAndUpdate(userId, userUpdateFields, {
      new: true,
      runValidators: true,
    });
  }

  // Update Parent address
  if (updateData.address) {
    const addressUpdate = {};
    if (updateData.address.street !== undefined)
      addressUpdate["address.street"] = updateData.address.street;
    if (updateData.address.city !== undefined)
      addressUpdate["address.city"] = updateData.address.city;
    if (updateData.address.state !== undefined)
      addressUpdate["address.state"] = updateData.address.state;
    if (updateData.address.pincode !== undefined)
      addressUpdate["address.pincode"] = updateData.address.pincode;

    if (Object.keys(addressUpdate).length > 0) {
      await Parent.findByIdAndUpdate(parent._id, addressUpdate, {
        new: true,
        runValidators: true,
      });
    }
  }

  // Fetch updated profile
  const updatedParent = await Parent.findOne({ userId })
    .populate("userId", "name email phone isActive lastLogin photo role")
    .populate(
      "children",
      "firstName lastName admissionNo className section photo",
    );

  return updatedParent;
};

/**
 * Get parent statistics
 * @returns {Object} Parent statistics
 */
exports.getParentStats = async () => {
  const totalParents = await Parent.countDocuments();
  const activeParents = await User.countDocuments({
    role: "parent",
    isActive: true,
  });
  const inactiveParents = await User.countDocuments({
    role: "parent",
    isActive: false,
  });

  // Parents with children
  const parentsWithChildren = await Parent.countDocuments({
    children: { $not: { $size: 0 } },
  });

  // Parents without children
  const parentsWithoutChildren = totalParents - parentsWithChildren;

  // Average children per parent
  const avgChildrenResult = await Parent.aggregate([
    {
      $group: {
        _id: null,
        avgChildren: { $avg: { $size: "$children" } },
      },
    },
  ]);

  const avgChildren =
    avgChildrenResult.length > 0
      ? Math.round(avgChildrenResult[0].avgChildren * 100) / 100
      : 0;

  return {
    total: totalParents,
    active: activeParents,
    inactive: inactiveParents,
    withChildren: parentsWithChildren,
    withoutChildren: parentsWithoutChildren,
    averageChildrenPerParent: avgChildren,
  };
};

// ============================================================
// FILE: src/modules/parent/parent.service.js
// KAHAN DALO: File ke bilkul END mein (last exports ke baad)
// ============================================================

// Yeh line upar already hogi, dobara mat likhna:
// const Student = require('../student/student.model');
// Agar nahi hai toh add karo file ke top mein:
const { Attendance } = require("../attendance/attendance.model");

// ─── FEATURE 5: STUDENT ATTENDANCE DIFF FOR PARENT ──────────
/**
 * Parent apne student ki attendance difference dekh sakta hai
 * Route: GET /api/parents/student/:studentId/attendance-diff
 *        ?fromDate=YYYY-MM-DD&toDate=YYYY-MM-DD
 */
exports.getStudentAttendanceDiff = async (
  parentUserId,
  studentId,
  { fromDate, toDate } = {},
) => {
  // Verify parent has access to this student
  const student = await Student.findOne({
    _id: studentId,
    parentUserId: parentUserId,
  });

  if (!student) {
    throw new ErrorResponse("Student not found or access denied", 403);
  }

  const from =
    fromDate ||
    new Date(new Date().getFullYear(), new Date().getMonth(), 1)
      .toISOString()
      .slice(0, 10);
  const to = toDate || new Date().toISOString().slice(0, 10);

  const records = await Attendance.find({
    studentId: student._id,
    attendanceDateKey: { $gte: from, $lte: to },
  })
    .populate("classId", "name startTime endTime")
    .sort({ attendanceDateKey: 1 })
    .lean();

  const summary = records.map((rec) => {
    const cls = rec.classId;
    let expectedHours = 0;
    let hoursAttended = 0;

    if (cls && cls.startTime && cls.endTime) {
      const [sh, sm] = cls.startTime.split(":").map(Number);
      const [eh, em] = cls.endTime.split(":").map(Number);
      expectedHours = parseFloat(
        ((eh * 60 + em - sh * 60 - sm) / 60).toFixed(2),
      );
    }

    if (rec.status === "Present") hoursAttended = expectedHours;

    const difference = parseFloat((hoursAttended - expectedHours).toFixed(2));

    return {
      date: rec.attendanceDateKey,
      status: rec.status,
      classId: rec.classId?._id || null,
      className: rec.className || cls?.name || "",
      expectedHours,
      hoursAttended,
      difference,
      isDeficit: difference < 0,
    };
  });

  const totalExpected = summary.reduce((a, r) => a + r.expectedHours, 0);
  const totalAttended = summary.reduce((a, r) => a + r.hoursAttended, 0);

  return {
    student: {
      id: student._id,
      name: `${student.firstName} ${student.lastName}`,
      admissionNo: student.admissionNo,
    },
    fromDate: from,
    toDate: to,
    totalExpectedHours: parseFloat(totalExpected.toFixed(2)),
    totalAttendedHours: parseFloat(totalAttended.toFixed(2)),
    totalDeficitHours: parseFloat((totalAttended - totalExpected).toFixed(2)),
    records: summary,
  };
};
