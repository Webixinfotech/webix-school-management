const mongoose = require("mongoose");
const Class = require("./class.model");
const Student = require("../student/student.model");
const Teacher = require("../teacher/teacher.model");
const ErrorResponse = require("../../utils/errorResponse");

// ─────────────────────────────────────────────────────────────
// HELPERS
// ─────────────────────────────────────────────────────────────

/**
 * Helper: Find class by _id OR classId string (e.g. CLS001)
 */
const findClass = async (id) => {
  const isObjectId = mongoose.Types.ObjectId.isValid(id);
  return Class.findOne({
    $or: [...(isObjectId ? [{ _id: id }] : []), { classId: id }],
  });
};

/**
 * Helper: Get student count for a class
 * Fix: accepts ObjectId (cls._id), not classId string
 */
const getStudentCount = async (classMongoId) => {
  return Student.countDocuments({ classIds: classMongoId });
};

/**
 * Helper: Build class object with student count
 * Fix: pass cls._id (ObjectId) instead of cls.classId (string)
 */
const buildClassWithCount = async (cls) => {
  const count = await getStudentCount(cls._id);
  const obj = cls.toObject();
  obj.studentCount = count;
  return obj;
};

/**
 * Helper: Check if teacher is authorized to access a class
 * Fix: use .equals() for ObjectId comparison
 */
const checkTeacherAccess = async (userId, cls) => {
  const teacher = await Teacher.findOne({ userId });
  if (
    !teacher ||
    !teacher.classIds.some((id) => id.equals(cls._id))
  ) {
    throw new ErrorResponse("Not authorized to access this class", 403);
  }
};

// ─────────────────────────────────────────────────────────────
// TIMING CLASH HELPERS
// ─────────────────────────────────────────────────────────────

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

// ─────────────────────────────────────────────────────────────
// EXPORTS
// ─────────────────────────────────────────────────────────────

/**
 * Create a new class
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
      throw new ErrorResponse("startTime is required for FIXED_TIME class", 400);
    }
    if (!endTime) {
      throw new ErrorResponse("endTime is required for FIXED_TIME class", 400);
    }
  }

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
    monthlyFreeHours:
      monthlyFreeHours !== undefined ? Number(monthlyFreeHours) : 0,
  };

  if (teacherId) {
    const teacher = await Teacher.findById(teacherId);
    if (!teacher) {
      throw new ErrorResponse("Teacher not found", 404);
    }
    classData.teacherId = teacherId;
  }

  const newClass = await Class.create(classData);

  // Fix: store cls._id (ObjectId) in Teacher.classIds, not cls.classId (string)
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
 */
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
  // Fix: pass cls._id (ObjectId)
  classObj.studentCount = await getStudentCount(cls._id);

  return classObj;
};

/**
 * Update a class
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
    baseFee,
    feeType,
    lateFineApplicable,
    monthlyFreeHours,
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

  // Fee fields
  if (baseFee !== undefined) cls.baseFee = Number(baseFee);
  if (feeType !== undefined) cls.feeType = feeType;
  if (lateFineApplicable !== undefined)
    cls.lateFineApplicable = Boolean(lateFineApplicable);
  if (monthlyFreeHours !== undefined)
    cls.monthlyFreeHours = Number(monthlyFreeHours);

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
  // Fix: pass cls._id (ObjectId)
  classObj.studentCount = await getStudentCount(cls._id);

  return classObj;
};

/**
 * Delete a class
 */
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
 */
exports.getClassStudents = async (id, userRole, userId) => {
  const cls = await findClass(id);
  if (!cls) {
    throw new ErrorResponse("Class not found", 404);
  }

  if (userRole === "teacher") {
    await checkTeacherAccess(userId, cls);
  }

  // Fix: query by cls._id (ObjectId)
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
      parentPhone: stuObj.parentDetails?.primaryPhone || "",
      parentEmail: stuObj.parentDetails?.primaryEmail || "",
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
 */
exports.assignTeacher = async (id, teacherId) => {
  const cls = await findClass(id);
  if (!cls) {
    throw new ErrorResponse("Class not found", 404);
  }

  if (!teacherId) {
    // Unassign: remove class from old teacher's classIds
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

  // If reassigning from a different teacher, remove from old teacher first
  if (cls.teacherId && cls.teacherId.toString() !== teacherId) {
    await Teacher.findByIdAndUpdate(cls.teacherId, {
      $pull: { classIds: cls._id },
    });
  }

  cls.teacherId = teacherId;
  await cls.save();

  // Fix: store cls._id (ObjectId)
  await Teacher.findByIdAndUpdate(teacherId, {
    $addToSet: { classIds: cls._id },
  });

  await cls.populate("teacherId", "name employeeId photo");

  return cls;
};

/**
 * Get classes assigned to the logged-in teacher
 */
exports.getMyClasses = async (userId) => {
  const teacher = await Teacher.findOne({ userId });
  if (!teacher) {
    throw new ErrorResponse("Teacher profile not found", 404);
  }

  if (!teacher.classIds || teacher.classIds.length === 0) {
    return { total: 0, data: [], message: "No classes assigned yet" };
  }

  // teacher.classIds are ObjectIds — this query is already correct
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
 */
exports.getTeachersInClass = async (id) => {
  const cls = await findClass(id);
  if (!cls) {
    throw new ErrorResponse("Class not found", 404);
  }

  // Fix: query by cls._id (ObjectId)
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