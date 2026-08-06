const mongoose = require("mongoose");
const Class = require("./class.model");
const Student = require("../student/student.model");
const Teacher = require("../teacher/teacher.model");
const ErrorResponse = require("../../utils/errorResponse");

/**
 * Helper: Find class by _id OR classId string (e.g. CLS001)
 * @param {string} id - The ID parameter from request
 * @returns {Promise<Class|null>}
 */
const findClass = async (id) => {
  const isObjectId = mongoose.Types.ObjectId.isValid(id);
  return Class.findOne({
    $or: [...(isObjectId ? [{ _id: id }] : []), { classId: id }],
  });
};

/**
 * Helper: Get student count for a class
 * @param {string} classId - The class ID string
 * @returns {Promise<number>}
 */
// const getStudentCount = async (classId) => {
//   return Student.countDocuments({ classIds: classId });
// };

const getStudentCount = async (classMongoId) => {
  return Student.countDocuments({ classIds: classMongoId });
};

/**
 * Helper: Build class object with student count
 * @param {Class} cls - Class document
 * @returns {Object}
 */
// const buildClassWithCount = async (cls) => {
//   const count = await getStudentCount(cls._id);
//   const obj = cls.toObject();
//   obj.studentCount = count;
//   return obj;
// };

const buildClassWithCount = async (cls) => {
  const count = await getStudentCount(cls._id);
  const obj = cls.toObject();
  obj.studentCount = count;
  return obj;
};

/**
 * Helper: Check if teacher is authorized to access a class
 * @param {string} userId - Teacher's user ID
 * @param {Class} cls - Class document
 * @throws {ErrorResponse}
 *
 */
const checkTeacherAccess = async (userId, cls) => {
  const teacher = await Teacher.findOne({ userId });
  if (!teacher || !teacher.classIds.some((id) => id.equals(cls._id))) {
    throw new ErrorResponse("Not authorized to access this class", 403);
  }
};

/**
 * Create a new class
 * @param {Object} body - Request body
 * @param {Object} user - Authenticated user
 * @returns {Object} Created class
 */
exports.createClass = async (body, user) => {
  const {
    name,
    section,
    classType,
    startTime,
    endTime,
    days,
    level,
    status,
    teacherId,
    baseFee,
    feeType,
    lateFineApplicable,
    monthlyFreeHours,
    installmentTemplate,
    isPrepaidHoursCard,
    hoursInTier,
  } = body;

  if (!name || !name.trim()) {
    throw new ErrorResponse("Class name is required", 400);
  }
  if (!classType) {
    throw new ErrorResponse("Class type is required", 400);
  }
  if (!["FIXED_TIME", "FLEX_TIME", "HOURS_BASED"].includes(classType)) {
    throw new ErrorResponse(
      "classType must be FIXED_TIME, FLEX_TIME, or HOURS_BASED",
      400,
    );
  }
  if (classType === "FIXED_TIME") {
    if (!startTime) {
      throw new ErrorResponse(
        "startTime is required for FIXED_TIME class",
        400,
      );
    }
    if (!endTime) {
      throw new ErrorResponse("endTime is required for FIXED_TIME class", 400);
    }
  }

  // Prepaid Flexi Card tiers only apply to HOURS_BASED classes; force off
  // for anything else so a stray flag on a FIXED_TIME/FLEX_TIME class can't
  // accidentally opt it out of the legacy free-hours/overage billing path.
  const isCard =
    classType === "HOURS_BASED" && Boolean(isPrepaidHoursCard);

  const classData = {
    name: name.trim(),
    section: section ? section.trim() : "",
    classType,
    startTime: classType === "FIXED_TIME" ? startTime : null,
    endTime: classType === "FIXED_TIME" ? endTime : null,
    days: Array.isArray(days) ? days : [],
    level: level !== undefined ? Number(level) : 0,
    status: status || "Active",
    createdBy: user._id,
    baseFee: baseFee !== undefined ? Number(baseFee) : 0,
    feeType: feeType || "MONTHLY",
    lateFineApplicable:
      lateFineApplicable !== undefined ? Boolean(lateFineApplicable) : false,
    // A prepaid card never credits monthly free hours — its balance comes
    // exclusively from purchases (see fee module Flexi Card ledger).
    monthlyFreeHours: isCard
      ? 0
      : monthlyFreeHours !== undefined
        ? Number(monthlyFreeHours)
        : 0,
    installmentTemplate: Array.isArray(installmentTemplate)
      ? installmentTemplate
      : [],
    isPrepaidHoursCard: isCard,
    hoursInTier: isCard && hoursInTier !== undefined ? Number(hoursInTier) : 0,
  };

  if (teacherId) {
    const teacher = await Teacher.findById(teacherId);
    if (!teacher) {
      throw new ErrorResponse("Teacher not found", 404);
    }
    classData.teacherId = teacherId;
  }

  const newClass = await Class.create(classData);

  // if (teacherId) {
  //   await Teacher.findByIdAndUpdate(teacherId, {
  //     $addToSet: { classIds: newClass.classId },
  //   });
  // }

  if (teacherId) {
    await Teacher.findByIdAndUpdate(teacherId, {
      $addToSet: { classIds: newClass._id },
    });
  }

  await newClass.populate("teacherId", "name employeeId photo");

  return newClass;
};

/**
 * Get all classes with pagination and filtering
 * @param {Object} queryOptions - Query options
 * @param {string} queryOptions.search - Search term
 * @param {string} queryOptions.classType - Class type filter
 * @param {string} queryOptions.status - Status filter
 * @param {number} queryOptions.page - Page number
 * @param {number} queryOptions.limit - Items per page
 * @param {string} userRole - Requesting user's role
 * @param {string} userId - Requesting user's ID
 * @returns {Object} Classes list with pagination
 */
// exports.getAllClasses = async (
//   { search, classType, status, page = 1, limit = 50 },
//   userRole,
//   userId,
// ) => {
//   const query = {};

//   if (search) {
//     query.$or = [
//       { name: { $regex: search, $options: "i" } },
//       { classId: { $regex: search, $options: "i" } },
//       { section: { $regex: search, $options: "i" } },
//     ];
//   }

//   if (classType) query.classType = classType;
//   if (status) query.status = status;

//   if (userRole === "teacher") {
//     const teacher = await Teacher.findOne({ userId });
//     if (!teacher) {
//       return { total: 0, page: parseInt(page), pages: 0, count: 0, data: [] };
//     }
//     query.classId = { $in: teacher.classIds || [] };
//   }

//   const pageNum = parseInt(page);
//   const limitNum = parseInt(limit);
//   const skip = (pageNum - 1) * limitNum;

//   const total = await Class.countDocuments(query);
//   const classes = await Class.find(query)
//     .populate("teacherId", "name employeeId photo")
//     .sort({ level: 1, name: 1 })
//     .skip(skip)
//     .limit(limitNum);

//   const classesWithCount = await Promise.all(classes.map(buildClassWithCount));

//   return {
//     total,
//     page: pageNum,
//     pages: Math.ceil(total / limitNum),
//     count: classes.length,
//     data: classesWithCount,
//   };
// };

exports.getAllClasses = async (
  { search, classType, status, page = 1, limit = 50 },
  userRole,
  userId,
) => {
  const query = {};

  if (search) {
    query.$or = [
      { name: { $regex: search, $options: "i" } },
      { classId: { $regex: search, $options: "i" } },
      { section: { $regex: search, $options: "i" } },
    ];
  }

  if (classType) query.classType = classType;
  if (status) query.status = status;

  if (userRole === "teacher") {
    const teacher = await Teacher.findOne({ userId });
    if (!teacher) {
      return { total: 0, page: parseInt(page), pages: 0, count: 0, data: [] };
    }
    // Fix: teacher.classIds are ObjectIds — query Class._id, not Class.classId
    query._id = { $in: teacher.classIds || [] };
  }

  const pageNum = parseInt(page);
  const limitNum = parseInt(limit);
  const skip = (pageNum - 1) * limitNum;

  const total = await Class.countDocuments(query);
  const classes = await Class.find(query)
    .populate("teacherId", "name employeeId photo")
    .sort({ level: 1, name: 1 })
    .skip(skip)
    .limit(limitNum);

  const classesWithCount = await Promise.all(classes.map(buildClassWithCount));

  return {
    total,
    page: pageNum,
    pages: Math.ceil(total / limitNum),
    count: classes.length,
    data: classesWithCount,
  };
};
/**
 * Get a single class by ID or classId
 * @param {string} id - Class ID or classId
 * @param {string} userRole - Requesting user's role
 * @param {string} userId - Requesting user's ID
 * @returns {Object} Class document with student count
 */
exports.getClass = async (id, userRole, userId) => {
  const cls = await findClass(id);
  if (!cls) {
    throw new ErrorResponse("Class not found", 404);
  }

  if (userRole === "teacher") {
    await checkTeacherAccess(userId, cls);
  }

  await cls.populate("teacherId", "name employeeId photo phone");

  const classObj = cls.toObject();
  classObj.studentCount = await getStudentCount(cls._id);

  return classObj;
};

/**
 * Update a class
 * @param {string} id - Class ID or classId
 * @param {Object} body - Update data
 * @returns {Object} Updated class
//  */
// exports.updateClass = async (id, body) => {
//   const cls = await findClass(id);
//   if (!cls) {
//     throw new ErrorResponse("Class not found", 404);
//   }

//   const { name, section, classType, startTime, endTime, days, level, status } =
//     body;

//   const newType = classType || cls.classType;
//   if (
//     classType &&
//     !["FIXED_TIME", "FLEX_TIME", "HOURS_BASED"].includes(classType)
//   ) {
//     throw new ErrorResponse("Invalid classType", 400);
//   }
//   if (newType === "FIXED_TIME") {
//     const newStart = startTime !== undefined ? startTime : cls.startTime;
//     const newEnd = endTime !== undefined ? endTime : cls.endTime;
//     if (!newStart) {
//       throw new ErrorResponse("startTime is required for FIXED_TIME", 400);
//     }
//     if (!newEnd) {
//       throw new ErrorResponse("endTime is required for FIXED_TIME", 400);
//     }
//   }

//   if (name !== undefined) cls.name = name.trim();
//   if (section !== undefined) cls.section = section.trim();
//   if (classType !== undefined) cls.classType = classType;
//   if (days !== undefined) cls.days = Array.isArray(days) ? days : [];
//   if (level !== undefined) cls.level = Number(level);
//   if (status !== undefined) cls.status = status;

//   if (newType === "FIXED_TIME") {
//     if (startTime !== undefined) cls.startTime = startTime;
//     if (endTime !== undefined) cls.endTime = endTime;
//   } else {
//     cls.startTime = null;
//     cls.endTime = null;
//   }

//   await cls.save();
//   await cls.populate("teacherId", "name employeeId photo");

//   const classObj = cls.toObject();
//   classObj.studentCount = await getStudentCount(cls._id);

//   return classObj;
// };

/**
 * Update a class
 * @param {string} id - Class ID or classId
 * @param {Object} body - Update data
 * @returns {Object} Updated class
 */
exports.updateClass = async (id, body) => {
  const cls = await findClass(id);
  if (!cls) {
    throw new ErrorResponse("Class not found", 404);
  }

  const {
    name,
    section,
    classType,
    startTime,
    endTime,
    days,
    level,
    status,
    // ── Fee fields ──────────────────────────────
    baseFee,
    feeType,
    lateFineApplicable,
    monthlyFreeHours,
    installmentTemplate,
    isPrepaidHoursCard,
    hoursInTier,
  } = body;

  const newType = classType || cls.classType;
  if (
    classType &&
    !["FIXED_TIME", "FLEX_TIME", "HOURS_BASED"].includes(classType)
  ) {
    throw new ErrorResponse("Invalid classType", 400);
  }
  if (newType === "FIXED_TIME") {
    const newStart = startTime !== undefined ? startTime : cls.startTime;
    const newEnd = endTime !== undefined ? endTime : cls.endTime;
    if (!newStart) {
      throw new ErrorResponse("startTime is required for FIXED_TIME", 400);
    }
    if (!newEnd) {
      throw new ErrorResponse("endTime is required for FIXED_TIME", 400);
    }
  }

  if (name !== undefined) cls.name = name.trim();
  if (section !== undefined) cls.section = section.trim();
  if (classType !== undefined) cls.classType = classType;
  if (days !== undefined) cls.days = Array.isArray(days) ? days : [];
  if (level !== undefined) cls.level = Number(level);
  if (status !== undefined) cls.status = status;

  // ── Fee fields ──────────────────────────────────────────────────────────
  if (baseFee !== undefined) cls.baseFee = Number(baseFee);
  if (feeType !== undefined) cls.feeType = feeType;
  if (lateFineApplicable !== undefined)
    cls.lateFineApplicable = Boolean(lateFineApplicable);
  if (monthlyFreeHours !== undefined)
    cls.monthlyFreeHours = Number(monthlyFreeHours);
  if (installmentTemplate !== undefined)
    cls.installmentTemplate = Array.isArray(installmentTemplate)
      ? installmentTemplate
      : [];
  if (isPrepaidHoursCard !== undefined)
    cls.isPrepaidHoursCard = Boolean(isPrepaidHoursCard);
  if (hoursInTier !== undefined) cls.hoursInTier = Number(hoursInTier);

  // Prepaid Flexi Card tiers only apply to HOURS_BASED classes — force off
  // for anything else, and a card never credits monthly free hours.
  if (newType !== "HOURS_BASED") {
    cls.isPrepaidHoursCard = false;
    cls.hoursInTier = 0;
  }
  if (cls.isPrepaidHoursCard) {
    cls.monthlyFreeHours = 0;
  }

  if (newType === "FIXED_TIME") {
    if (startTime !== undefined) cls.startTime = startTime;
    if (endTime !== undefined) cls.endTime = endTime;
  } else {
    cls.startTime = null;
    cls.endTime = null;
  }

  await cls.save();
  await cls.populate("teacherId", "name employeeId photo");

  const classObj = cls.toObject();
  classObj.studentCount = await getStudentCount(cls._id);

  return classObj;
};

/**
 * Delete a class
 * @param {string} id - Class ID or classId
 * @returns {Object} Success message
 */
// exports.deleteClass = async (id) => {
//   const cls = await findClass(id);
//   if (!cls) {
//     throw new ErrorResponse("Class not found", 404);
//   }

//   const enrolledCount = await getStudentCount(cls.classId);
//   if (enrolledCount > 0) {
//     throw new ErrorResponse(
//       `Cannot delete class. ${enrolledCount} student(s) are enrolled. Remove students from this class first.`,
//       400,
//     );
//   }

//   await Teacher.updateMany(
//     { classIds: cls._id },
//     { $pull: { classIds: cls._id } },
//   );

//   await Class.deleteOne({ _id: cls._id });

//   return { message: "Class deleted successfully" };
// };

exports.deleteClass = async (id) => {
  const cls = await findClass(id);
  if (!cls) {
    throw new ErrorResponse("Class not found", 404);
  }

  // Fix: pass cls._id (ObjectId) — was passing cls.classId string before
  const enrolledCount = await getStudentCount(cls._id);
  if (enrolledCount > 0) {
    throw new ErrorResponse(
      `Cannot delete class. ${enrolledCount} student(s) are enrolled. Remove students from this class first.`,
      400,
    );
  }

  // Fix: pull by cls._id (ObjectId) from Teacher.classIds
  await Teacher.updateMany(
    { classIds: cls._id },
    { $pull: { classIds: cls._id } },
  );

  // Fix: also remove from Student.classIds
  await Student.updateMany(
    { classIds: cls._id },
    { $pull: { classIds: cls._id } },
  );

  await Class.deleteOne({ _id: cls._id });

  return { message: "Class deleted successfully" };
};

/**
 * Get students enrolled in a class
 * @param {string} id - Class ID or classId
 * @param {string} userRole - Requesting user's role
 * @param {string} userId - Requesting user's ID
 * @returns {Object} Students list
 */
exports.getClassStudents = async (id, userRole, userId, teacherPermissions) => {
  const cls = await findClass(id);
  if (!cls) {
    throw new ErrorResponse("Class not found", 404);
  }

  if (userRole === "teacher") {
    await checkTeacherAccess(userId, cls);
  }

  // SECURITY FIX: parentPhone/parentEmail were previously always included
  // in this response — the canViewStudentMobile toggle only hid a
  // (mismatched, non-functional) UI field on the frontend and never
  // actually redacted anything server-side. Now genuinely enforced.
  const canViewMobile = userRole !== "teacher" || teacherPermissions?.canViewStudentMobile === true;

  const students = await Student.find(
    { classIds: cls._id },
    {
      _id: 1,
      admissionNo: 1,
      firstName: 1,
      lastName: 1,
      fullName: 1,
      photo: 1,
      gender: 1,
      dateOfBirth: 1,
      status: 1,
      classTimings: 1,
      parentDetails: 1,
      parentUserId: 1,
    },
  )
    .populate("parentUserId", "name email phone isActive lastLogin")
    .sort({ firstName: 1, lastName: 1 });

  const studentList = students.map((stu) => {
    const stuObj = stu.toObject();

    let timingForThisClass = {};
    if (stuObj.classTimings) {
      const ct = stuObj.classTimings;
      if (ct instanceof Map) {
        timingForThisClass = ct.get(cls.classId) || {};
      } else if (typeof ct === "object") {
        timingForThisClass = ct[cls.classId] || {};
      }
    }

    return {
      _id: stuObj._id,
      admissionNo: stuObj.admissionNo,
      name:
        stuObj.fullName ||
        `${stuObj.firstName || ""} ${stuObj.lastName || ""}`.trim(),
      firstName: stuObj.firstName,
      lastName: stuObj.lastName,
      photo: stuObj.photo,
      gender: stuObj.gender,
      dateOfBirth: stuObj.dateOfBirth,
      status: stuObj.status,
      parentName:
        stuObj.parentDetails?.primaryName ||
        stuObj.parentDetails?.fatherName ||
        "",
      parentPhone: canViewMobile ? (stuObj.parentDetails?.primaryPhone || "") : "",
      parentEmail: canViewMobile ? (stuObj.parentDetails?.primaryEmail || "") : "",
      timing: {
        ...(cls.classType === "FIXED_TIME" && {
          startTime: cls.startTime,
          endTime: cls.endTime,
        }),
        ...(cls.classType === "FLEX_TIME" && {
          startTime: timingForThisClass.startTime || null,
          endTime: timingForThisClass.endTime || null,
        }),
        ...(cls.classType === "HOURS_BASED" && {
          paidFlexiHours: timingForThisClass.paidFlexiHours || 0,
          freeFlexiHours: timingForThisClass.freeFlexiHours ?? 0,
          consumedFlexiHours: timingForThisClass.consumedFlexiHours || 0,
          assignedHours: timingForThisClass.assignedHours || 0,
        }),
      },
    };
  });

  return {
    classId: cls.classId,
    className: cls.name,
    classType: cls.classType,
    total: studentList.length,
    data: studentList,
  };
};

/**
 * Assign or unassign a teacher to a class
 * @param {string} id - Class ID or classId
 * @param {string} teacherId - Teacher ID to assign (null to unassign)
 * @returns {Object} Updated class
 */
exports.assignTeacher = async (id, teacherId) => {
  const cls = await findClass(id);
  if (!cls) {
    throw new ErrorResponse("Class not found", 404);
  }

  if (!teacherId) {
    if (cls.teacherId) {
      await Teacher.findByIdAndUpdate(cls.teacherId, {
        $pull: { classIds: cls._id },
      });
    }
    cls.teacherId = null;
    await cls.save();
    return cls;
  }

  const teacher = await Teacher.findById(teacherId);
  if (!teacher) {
    throw new ErrorResponse("Teacher not found", 404);
  }

  if (cls.teacherId && cls.teacherId.toString() !== teacherId) {
    await Teacher.findByIdAndUpdate(cls.teacherId, {
      $pull: { classIds: cls._id },
    });
  }

  cls.teacherId = teacherId;
  await cls.save();

  await Teacher.findByIdAndUpdate(teacherId, {
    $addToSet: { classIds: cls._id },
  });

  await cls.populate("teacherId", "name employeeId photo");

  return cls;
};

/**
 * Get classes assigned to the logged-in teacher
 * @param {string} userId - Teacher's user ID
 * @returns {Object} Classes list
 */
exports.getMyClasses = async (userId) => {
  const teacher = await Teacher.findOne({ userId });
  if (!teacher) {
    throw new ErrorResponse("Teacher profile not found", 404);
  }

  if (!teacher.classIds || teacher.classIds.length === 0) {
    return { total: 0, data: [], message: "No classes assigned yet" };
  }

  const classes = await Class.find({
    _id: { $in: teacher.classIds },
  }).sort({ level: 1, name: 1 });

  const classesWithCount = await Promise.all(classes.map(buildClassWithCount));

  return {
    total: classesWithCount.length,
    data: classesWithCount,
  };
};

/**
 * Get classes by type (active only)
 * @param {string} classType - Class type
 * @returns {Object} Classes list
 */
exports.getClassesByType = async (classType) => {
  if (!["FIXED_TIME", "FLEX_TIME", "HOURS_BASED"].includes(classType)) {
    throw new ErrorResponse("Invalid class type", 400);
  }

  const classes = await Class.find({ classType, status: "Active" })
    .populate("teacherId", "name employeeId photo")
    .sort({ name: 1 });

  return { total: classes.length, data: classes };
};

/**
 * Get classes by day (active only)
 * @param {string} day - Day of week
 * @returns {Object} Classes list
 */
exports.getClassesByDay = async (day) => {
  const validDays = ["MON", "TUE", "WED", "THU", "FRI", "SAT", "SUN"];
  const dayUpper = day.toUpperCase();
  if (!validDays.includes(dayUpper)) {
    throw new ErrorResponse("Invalid day", 400);
  }

  const classes = await Class.find({ days: dayUpper, status: "Active" })
    .populate("teacherId", "name employeeId photo")
    .sort({ name: 1 });

  return { total: classes.length, data: classes };
};

/**
 * Get teachers assigned to a class
 * @param {string} id - Class ID or classId
 * @returns {Object} Teachers list
 */
exports.getTeachersInClass = async (id) => {
  const cls = await findClass(id);
  if (!cls) {
    throw new ErrorResponse("Class not found", 404);
  }

  const teachers = await Teacher.find({ classIds: cls._id }).select(
    "name employeeId email phone subjects status",
  );

  return {
    classId: cls.classId,
    className: cls.name,
    total: teachers.length,
    data: teachers,
  };
};

// ============================================================
// FILE: src/modules/class/class.service.js
// KAHAN DALO: File ke bilkul NEECHE (module.exports ke upar nahi,
//             last exports function ke baad)
// ============================================================

// ─── TIMING CLASH HELPER ────────────────────────────────────
const timeToMinutes = (timeStr) => {
  if (!timeStr) return null;
  const [h, m] = timeStr.split(":").map(Number);
  return h * 60 + m;
};

const timingsOverlap = (startA, endA, startB, endB) => {
  const s1 = timeToMinutes(startA);
  const e1 = timeToMinutes(endA);
  const s2 = timeToMinutes(startB);
  const e2 = timeToMinutes(endB);
  if (!s1 || !e1 || !s2 || !e2) return false;
  return s1 < e2 && s2 < e1;
};

/**
 * Check if newClass timing clashes with any of existingClasses
 * @param {Array} existingClasses - Array of Class documents
 * @param {Object} newClass - New Class document to check against
 * @returns {{ clash: boolean, clashWith: Object|null }}
 */
const checkTimingConflict = (existingClasses, newClass) => {
  if (newClass.classType !== "FIXED_TIME")
    return { clash: false, clashWith: null };

  for (const cls of existingClasses) {
    if (String(cls._id) === String(newClass._id)) continue;
    if (cls.classType !== "FIXED_TIME") continue;

    const commonDays = (cls.days || []).filter((d) =>
      (newClass.days || []).includes(d),
    );
    if (commonDays.length === 0) continue;

    if (
      timingsOverlap(
        cls.startTime,
        cls.endTime,
        newClass.startTime,
        newClass.endTime,
      )
    ) {
      return { clash: true, clashWith: cls };
    }
  }
  return { clash: false, clashWith: null };
};

exports.checkTimingConflict = checkTimingConflict;

// ─── ASSIGN STUDENT TO CLASS WITH CLASH CHECK ───────────────
// Yeh function admin.student.service.js mein student assign karte
// waqt call karo, ya directly class assign route mein use karo.
//
// Usage example (admin.student.service.js mein):
//
//   const { checkTimingConflict } = require('../class/class.service');
//   const existingClasses = await Class.find({ _id: { $in: student.classIds } });
//   const newClass = await Class.findById(newClassId);
//   const { clash, clashWith } = checkTimingConflict(existingClasses, newClass);
//   if (clash) throw new ErrorResponse(
//     `Timing clash: "${newClass.name}" overlaps with "${clashWith.name}"`, 400
//   );