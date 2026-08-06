//______________________________________________________________

const fs = require("fs");
const mongoose = require("mongoose");
const Teacher = require("./teacher.model");
const User = require("../auth/user.model");
const Class = require("../../modules/class/class.model");
const ErrorResponse = require("../../utils/errorResponse");
const s3Service = require("../../services/s3.service");
const { Attendance } = require("../attendance/attendance.model");

// ─────────────────────────────────────────────────────────────
// HELPERS
// ─────────────────────────────────────────────────────────────

/**
 * Helper: Find teacher by _id OR employeeId string (e.g. EMP001)
 */
const findTeacherByIdOrEmployeeId = (idParam, session = null) => {
  const isObjectId = /^[a-fA-F0-9]{24}$/.test(idParam);

  const query = Teacher.findOne({
    $or: [{ employeeId: idParam }, ...(isObjectId ? [{ _id: idParam }] : [])],
  });

  if (session) query.session(session);

  return query;
};

/**
 * Helper: Filter adminNotes based on user role
 */
const filterNotesForRole = (teacher, userRole) => {
  if (!teacher.adminNotes || teacher.adminNotes.length === 0) {
    return [];
  }

  if (userRole === "admin") {
    return teacher.adminNotes;
  }

  return [];
};

/**
 * Helper: Convert string to boolean
 */
const toBool = (val) => val === "true" || val === true;

/**
 * Helper: Validate that all classIds exist and are active
 */
const validateClassIds = async (classIds) => {
  if (!classIds || classIds.length === 0) {
    return { valid: true };
  }

  for (const classId of classIds) {
    if (!mongoose.Types.ObjectId.isValid(classId)) {
      return { valid: false, error: `Invalid class ID format: ${classId}` };
    }

    const classDoc = await Class.findById(classId);
    if (!classDoc || classDoc.status !== "Active") {
      return {
        valid: false,
        error: `Class ID ${classId} not found or inactive`,
      };
    }
  }

  return { valid: true };
};

/**
 * Helper: Delete uploaded file if exists (no-op for memory storage)
 */
const deleteUploadedFile = (file) => {
  return;
};

// ─────────────────────────────────────────────────────────────
// EXPORTS
// ─────────────────────────────────────────────────────────────

/**
 * Get all teachers with pagination and filtering
 */
exports.getAllTeachers = async (
  { search, status, page = 1, limit = 20 },
  userRole,
  userId = null,
) => {
  const query = {};

  if (status) query.status = status;

  if (search) {
    const searchRegex = new RegExp(search, "i");
    query.$or = [
      { name: searchRegex },
      { email: searchRegex },
      { employeeId: searchRegex },
    ];
  }

  const total = await Teacher.countDocuments(query);

  const teachers = await Teacher.find(query)
    .populate("userId", "name email phone isActive lastLogin")
    .sort({ createdAt: -1 })
    .limit(parseInt(limit))
    .skip((parseInt(page) - 1) * parseInt(limit));

  const filteredTeachers = teachers.map((teacher) => {
    const teacherObj = teacher.toObject();
    teacherObj.adminNotes = filterNotesForRole(teacher, userRole);
    return teacherObj;
  });

  return {
    total,
    page: parseInt(page),
    pages: Math.ceil(total / parseInt(limit)),
    count: filteredTeachers.length,
    data: filteredTeachers,
  };
};

/**
 * Get teacher by ID or employee ID
 */
exports.getTeacherById = async (idParam, userRole, userId, callerPermissions) => {
  const teacher = await findTeacherByIdOrEmployeeId(idParam).populate(
    "userId",
    "name email phone isActive lastLogin",
  );

  if (!teacher) {
    throw new ErrorResponse("Teacher not found", 404);
  }

  if (userRole === "teacher") {
    const isSelf = teacher.userId._id.toString() === userId.toString();
    const canManageEmployees = callerPermissions?.canManageEmployees === true;
    if (!isSelf && !canManageEmployees) {
      throw new ErrorResponse(
        "Not authorized to access this teacher profile",
        403,
      );
    }
  }

  const teacherObj = teacher.toObject();
  teacherObj.adminNotes = filterNotesForRole(teacher, userRole);

  return teacherObj;
};

/**
 * Create a new teacher with user account (transactional)
 */
exports.createTeacher = async (body, file, user) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const {
      name,
      email,
      phone,
      dob,
      dateOfJoining,
      employeeId,
      subjects,
      classIds,
      status,
      password,
      employeeType,
      fixedShift,
      fixedHours,
      monthlySalary,
      extraHourlyRate,
      holidayCalendar,
    } = body;
    // SECURITY: permissions are intentionally NOT read from `body` here.
    // A newly created teacher always starts with the schema defaults
    // below, no matter who creates them (admin, sub-admin, or a teacher
    // with canManageEmployees). This closes a privilege-escalation path
    // where a caller could hand a brand-new teacher account elevated
    // access (e.g. canManageFees/canManageEmployees) at creation time.
    // Permissions can only ever be changed afterwards via the dedicated
    // admin-only PUT /api/teachers/:id/permissions route.

    let parsedClassIds = [];
    if (classIds) {
      parsedClassIds =
        typeof classIds === "string" ? JSON.parse(classIds) : classIds;
    }

    const existingUser = await User.findOne({ email }).session(session);
    if (existingUser) {
      deleteUploadedFile(file);
      throw new ErrorResponse("Email already exists", 400);
    }

    const teacherUser = await User.create(
      [
        {
          name,
          email,
          password,
          phone,
          role: "teacher",
          createdBy: user._id,
        },
      ],
      { session },
    );

    let photoUrl = null;
    let photoKey = null;

    if (file) {
      const uploadResult = await s3Service.uploadToS3(
        file,
        "teachers",
        user._id.toString(),
        "photo",
      );
      photoUrl = uploadResult.url;
      photoKey = uploadResult.key;
    }

    const teacherData = {
      employeeId: employeeId || undefined,
      name,
      email,
      phone,
      dob: dob || null,
      dateOfJoining,
      status: status || "Active",
      subjects: subjects || "",
      classIds: parsedClassIds,
      photo: photoUrl,
      photoKey: photoKey,
      userId: teacherUser[0]._id,
      employeeType: employeeType || "FIXED_TIME",
      fixedShift: fixedShift || {
        gracePeriodMinutes: 15,
        halfDayThresholdHours: 3,
        extraHoursPayment: false,
      },
      fixedHours: fixedHours || {
        minimumHours: 2,
        halfDayThresholdHours: 1,
        extraHoursPayment: false,
      },
      monthlySalary: monthlySalary || 0,
      extraHourlyRate: extraHourlyRate || 0,
      holidayCalendar: holidayCalendar || "TEACHING",
      permissions: {
        // Safe, minimal defaults for a brand-new teacher — matches the
        // Teacher schema defaults exactly. Any change from here on must
        // go through PUT /api/teachers/:id/permissions (admin only).
        canViewStudentMobile: true,
        canMarkAttendance: true,
        canUploadPhotos: true,
        canViewSalary: false,
        canViewFeeInfo: false,
        canDisplayStaffQR: false,
        canManageFees: false,
        canManageStudents: false,
        canManageEmployees: false,
        canManageBirthdays: false,
        canManageEnquiries: false,
        aadhaarVerified: false,
        policeVerified: false,
      },
      adminNotes: [],
      createdBy: user._id,
    };

    const classValidation = await validateClassIds(teacherData.classIds);
    if (!classValidation.valid) {
      deleteUploadedFile(file);
      throw new ErrorResponse(classValidation.error, 400);
    }

    const teacher = await Teacher.create([teacherData], { session });

    await session.commitTransaction();

    return {
      teacher: {
        id: teacher[0]._id,
        userId: teacher[0].userId,
        employeeId: teacher[0].employeeId,
        name: teacher[0].name,
        email: teacher[0].email,
        phone: teacher[0].phone,
        status: teacher[0].status,
        photo: teacher[0].photo,
        qrCode: teacher[0].qrCode,
        classIds: teacher[0].classIds,
        subjects: teacher[0].subjects,
        permissions: teacher[0].permissions,
      },
      loginCredentials: {
        email: teacher[0].email,
        note: "Password as set by admin",
      },
    };
  } catch (err) {
    await session.abortTransaction();
    deleteUploadedFile(file);
    throw err;
  } finally {
    session.endSession();
  }
};

/**
 * Update teacher details
 * Fix: filteredData properly populated; classIds converted to ObjectId array
 */
exports.updateTeacher = async (idParam, updateData) => {
  // SECURITY: "permissions" is deliberately excluded from this whitelist.
  // Previously it was included here with no key-filtering (unlike
  // updateTeacherPermissions' validPermissionKeys allowlist below), which
  // meant ANY caller of this generic edit endpoint — including sub-admin,
  // who is NOT allowed to touch permissions per the dedicated route's
  // roleGuard('admin') — could silently overwrite a teacher's permissions
  // object. Now that teachers with canManageEmployees can also call this
  // route, that gap would let a teacher grant themselves/anyone elevated
  // access. Permissions may ONLY be changed via
  // PUT /api/teachers/:id/permissions (admin only).
  const updatableFields = [
    "name",
    "phone",
    "dob",
    "dateOfJoining",
    "subjects",
    "classIds",
    "status",
    "employeeType",
    "fixedShift",
    "fixedHours",
    "monthlySalary",
    "extraHourlyRate",
    "holidayCalendar",
    "bloodGroup",
  ];

  const filteredData = {};

  updatableFields.forEach((field) => {
    if (updateData[field] !== undefined) {
      // Fix: classIds — parse if string, then convert each to ObjectId
      if (field === "classIds") {
        const raw =
          typeof updateData[field] === "string"
            ? JSON.parse(updateData[field])
            : updateData[field];
        filteredData[field] = raw
          .filter((id) => mongoose.Types.ObjectId.isValid(id))
          .map((id) => new mongoose.Types.ObjectId(id));
      } else {
        // Fix: all other fields properly assigned to filteredData
        filteredData[field] = updateData[field];
      }
    }
  });

  const teacher = await findTeacherByIdOrEmployeeId(idParam);

  if (!teacher) {
    throw new ErrorResponse("Teacher not found", 404);
  }

  // Validate classIds if being updated
  const previousClassIds = (teacher.classIds || []).map((id) => id.toString());
  if (filteredData.classIds !== undefined) {
    const classValidation = await validateClassIds(filteredData.classIds);
    if (!classValidation.valid) {
      throw new ErrorResponse(classValidation.error, 400);
    }
  }

  const updatedTeacher = await Teacher.findByIdAndUpdate(
    teacher._id,
    filteredData,
    {
      new: true,
      runValidators: true,
    },
  ).populate("userId", "name email phone isActive lastLogin");

  // Keep Class.teacherId in sync with a classIds change made through this
  // generic edit form — previously only the dedicated assign-teacher flow
  // (class.service.assignTeacher) kept the two sides in sync.
  if (filteredData.classIds !== undefined) {
    const newClassIds = filteredData.classIds.map((id) => id.toString());
    const added = newClassIds.filter((id) => !previousClassIds.includes(id));
    const removed = previousClassIds.filter((id) => !newClassIds.includes(id));

    if (added.length > 0) {
      await Class.updateMany(
        { _id: { $in: added } },
        { $set: { teacherId: teacher._id } },
      );
    }
    if (removed.length > 0) {
      await Class.updateMany(
        { _id: { $in: removed }, teacherId: teacher._id },
        { $set: { teacherId: null } },
      );
    }
  }

  return updatedTeacher;
};

/**
 * Update teacher permissions
 */
exports.updateTeacherPermissions = async (idParam, permissions) => {
  if (!permissions || typeof permissions !== "object") {
    throw new ErrorResponse("Please provide permissions object", 400);
  }

  const validPermissionKeys = [
    "canViewStudentMobile",
    "canMarkAttendance",
    "canUploadPhotos",
    "canViewSalary",
    "canViewFeeInfo",
    "canDisplayStaffQR",
    "canScanEmployeeQR",
    "attendanceViaQR",
    "attendanceViaPhone",
    "canManageFees",
    "canManageStudents",
    "canManageEmployees",
    "canManageBirthdays",
    "canManageEnquiries",
    "canViewBirthdays",
    "canManageCertificates",
    "canManageDailyActivity",
    "canManageCalendar",
    "canManageLibraryCatalog",
    "canManageLibraryIssue",
    "canViewLibraryReports",
    "canManageInventoryStockIn",
    "canManageInventoryStockOut",
    "canManageInventoryCatalog",
    "canViewInventoryReports",
    "aadhaarVerified",
    "policeVerified",
  ];

  const permUpdate = {};
  Object.keys(permissions).forEach((key) => {
    if (validPermissionKeys.includes(key)) {
      permUpdate[`permissions.${key}`] = toBool(permissions[key]);
    }
  });

  if (Object.keys(permUpdate).length === 0) {
    throw new ErrorResponse("No valid permissions provided", 400);
  }

  const teacher = await Teacher.findByIdAndUpdate(
    idParam,
    { $set: permUpdate },
    { new: true, runValidators: true },
  ).populate("userId", "name email phone isActive lastLogin");

  if (!teacher) {
    throw new ErrorResponse("Teacher not found", 404);
  }

  return teacher;
};

/**
 * Update teacher photo
 */
exports.updateTeacherPhoto = async (idParam, file) => {
  const teacher = await findTeacherByIdOrEmployeeId(idParam);

  if (!teacher) {
    deleteUploadedFile(file);
    throw new ErrorResponse("Teacher not found", 404);
  }

  if (teacher.photoKey) {
    try {
      await s3Service.deleteFromS3(teacher.photoKey);
    } catch (s3Error) {
      console.log("S3 file not found or already deleted:", teacher.photoKey);
    }
  } else if (teacher.photo && !teacher.photo.startsWith("http")) {
    try {
      fs.unlinkSync(teacher.photo);
    } catch (unlinkErr) {
      // Ignore
    }
  }

  const uploadResult = await s3Service.uploadToS3(
    file,
    "teachers",
    teacher._id.toString(),
    "photo",
  );

  teacher.photo = uploadResult.url;
  teacher.photoKey = uploadResult.key;
  await teacher.save();

  return {
    id: teacher._id,
    employeeId: teacher.employeeId,
    name: teacher.name,
    photo: teacher.photo,
    photoKey: teacher.photoKey,
  };
};

/**
 * Delete teacher (transactional)
 */
exports.deleteTeacher = async (idParam) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const teacher = await findTeacherByIdOrEmployeeId(idParam, session);

    if (!teacher) {
      throw new ErrorResponse("Teacher not found", 404);
    }

    if (teacher.photoKey) {
      try {
        await s3Service.deleteFromS3(teacher.photoKey);
      } catch (s3Error) {
        console.log("S3 file not found or already deleted:", teacher.photoKey);
      }
    } else if (teacher.photo && !teacher.photo.startsWith("http")) {
      try {
        fs.unlinkSync(teacher.photo);
      } catch (unlinkErr) {
        // Ignore
      }
    }

    await User.deleteOne({ _id: teacher.userId }, { session });
    await Teacher.deleteOne({ _id: teacher._id }, { session });

    await session.commitTransaction();

    return { message: "Teacher deleted successfully" };
  } catch (err) {
    await session.abortTransaction();
    throw err;
  } finally {
    session.endSession();
  }
};

/**
 * Get my profile (for teacher users)
 */
exports.getMyProfile = async (userId) => {
  const teacher = await Teacher.findOne({ userId }).populate(
    "userId",
    "name email phone isActive lastLogin",
  );

  if (!teacher) {
    throw new ErrorResponse("Teacher profile not found", 404);
  }

  const teacherObj = teacher.toObject();
  teacherObj.adminNotes = [];

  return teacherObj;
};

/**
 * Add admin note to teacher
 */
exports.addAdminNote = async (idParam, noteData, user) => {
  const { note, visibleToSubAdmin } = noteData;

  if (!note || !note.trim()) {
    throw new ErrorResponse("Note content is required", 400);
  }

  const teacher = await findTeacherByIdOrEmployeeId(idParam);

  if (!teacher) {
    throw new ErrorResponse("Teacher not found", 404);
  }

  teacher.adminNotes.push({
    note: note.trim(),
    createdBy: user._id,
    createdByRole: user.role,
    visibleToSubAdmin:
      visibleToSubAdmin === true || visibleToSubAdmin === "true",
    createdAt: new Date(),
    updatedAt: new Date(),
  });

  await teacher.save();

  return { notes: filterNotesForRole(teacher, user.role) };
};

/**
 * Update admin note
 */
exports.updateAdminNote = async (idParam, noteId, updateData, userRole) => {
  const teacher = await findTeacherByIdOrEmployeeId(idParam);

  if (!teacher) {
    throw new ErrorResponse("Teacher not found", 404);
  }

  const note = teacher.adminNotes.id(noteId);

  if (!note) {
    throw new ErrorResponse("Note not found", 404);
  }

  if (updateData.note !== undefined) {
    note.note = updateData.note.trim();
  }

  if (updateData.visibleToSubAdmin !== undefined) {
    note.visibleToSubAdmin =
      updateData.visibleToSubAdmin === true ||
      updateData.visibleToSubAdmin === "true";
  }

  note.updatedAt = new Date();
  await teacher.save();

  return { notes: filterNotesForRole(teacher, userRole) };
};

/**
 * Delete admin note
 */
exports.deleteAdminNote = async (idParam, noteId) => {
  const teacher = await findTeacherByIdOrEmployeeId(idParam);

  if (!teacher) {
    throw new ErrorResponse("Teacher not found", 404);
  }

  const note = teacher.adminNotes.id(noteId);

  if (!note) {
    throw new ErrorResponse("Note not found", 404);
  }

  teacher.adminNotes.pull(noteId);
  await teacher.save();

  return { message: "Note deleted successfully" };
};

/**
 * Get admin notes for a teacher
 */
exports.getNotes = async (idParam, userRole) => {
  const teacher = await findTeacherByIdOrEmployeeId(idParam);

  if (!teacher) {
    throw new ErrorResponse("Teacher not found", 404);
  }

  const filteredNotes = filterNotesForRole(teacher, userRole);

  return { count: filteredNotes.length, data: filteredNotes };
};

/**
 * Teacher dashboard stats
 * Fix: use ObjectId array for Student.classIds query
 */
exports.getTeacherDashboardStats = async (userId) => {
  const teacher = await Teacher.findOne({ userId });
  if (!teacher) throw new ErrorResponse("Teacher profile not found", 404);

  // Use Class.find by teacherId — single source of truth after Fix 3
  const classes = await Class.find({
    teacherId: teacher._id,
    status: "Active",
  }).lean();
  const classIds = classes.map((c) => c._id); // ObjectId array

  const today = new Date();
  const dayNames = ["SUN", "MON", "TUE", "WED", "THU", "FRI", "SAT"];
  const todayDay = dayNames[today.getDay()];
  const todayKey = today.toISOString().slice(0, 10);

  const todayClasses = classes.filter((c) => (c.days || []).includes(todayDay));

  const Student = require("../student/student.model");

  // Fix: classIds is ObjectId array — Student.classIds is also ObjectId now
  const totalStudents = await Student.countDocuments({
    classIds: { $in: classIds },
    status: "Active",
  });

  const todayAttendance = await Attendance.aggregate([
    {
      $match: {
        classId: { $in: classIds },
        attendanceDateKey: todayKey,
      },
    },
    {
      $group: {
        _id: "$status",
        count: { $sum: 1 },
      },
    },
  ]);

  const todayPresent =
    todayAttendance.find((a) => a._id === "Present")?.count || 0;
  const todayAbsent =
    todayAttendance.find((a) => a._id === "Absent")?.count || 0;
  const todayTotal = todayPresent + todayAbsent;

  const trend = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(today.getDate() - i);
    const dateKey = d.toISOString().slice(0, 10);

    const dayData = await Attendance.aggregate([
      {
        $match: {
          classId: { $in: classIds },
          attendanceDateKey: dateKey,
        },
      },
      {
        $group: {
          _id: "$status",
          count: { $sum: 1 },
        },
      },
    ]);

    trend.push({
      date: dateKey,
      present: dayData.find((a) => a._id === "Present")?.count || 0,
      absent: dayData.find((a) => a._id === "Absent")?.count || 0,
    });
  }

  return {
    totalClasses: classes.length,
    todayClasses: todayClasses.map((c) => ({
      id: c._id,
      name: c.name,
      startTime: c.startTime,
      endTime: c.endTime,
      days: c.days,
    })),
    totalStudents,
    todayAttendance: {
      total: todayTotal,
      present: todayPresent,
      absent: todayAbsent,
      percentage:
        todayTotal > 0
          ? parseFloat(((todayPresent / todayTotal) * 100).toFixed(1))
          : 0,
    },
    weeklyAttendanceTrend: trend,
  };
};
