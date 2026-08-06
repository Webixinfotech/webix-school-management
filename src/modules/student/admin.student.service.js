
//New code for admin.student.service.js

const mongoose = require("mongoose");
const Student = require("./student.model");
const Class = require("../../modules/class/class.model");
const Enquiry = require("../../modules/enquiry/enquiry.model");
const ErrorResponse = require("../../utils/errorResponse");
const { Attendance } = require("../attendance/attendance.model");
const { checkTimingConflict } = require("../class/class.service");
const feeService = require("../fee/fee.service");
const logger = require("../../config/logger");

// ─────────────────────────────────────────────────────────────
// HELPERS
// ─────────────────────────────────────────────────────────────

/**
 * Helper: Find student by _id OR admissionNo string (e.g. BB250001)
 */
const findStudentByIdOrAdmissionNo = (idParam, session = null) => {
  const isObjectId = /^[a-fA-F0-9]{24}$/.test(idParam);

  const query = Student.findOne({
    $or: [{ admissionNo: idParam }, ...(isObjectId ? [{ _id: idParam }] : [])],
  });

  if (session) query.session(session);

  return query;
};

/**
 * Build MongoDB query from filter parameters
 */
const buildStudentQuery = (filters = {}) => {
  const query = {};

  // Text search across multiple fields
  if (filters.search) {
    const searchRegex = new RegExp(filters.search, "i");
    query.$or = [
      { firstName: searchRegex },
      { lastName: searchRegex },
      { admissionNo: searchRegex },
      { "parentDetails.primaryName": searchRegex },
      { "parentDetails.primaryEmail": searchRegex },
      { "parentDetails.primaryPhone": searchRegex },
      { fatherName: searchRegex },
      { motherName: searchRegex },
    ];
  }

  // Simple equality filters
  if (filters.status) query.status = filters.status;
  if (filters.className) query.className = filters.className;
  if (filters.section) query.section = filters.section;
  if (filters.gender) query.gender = filters.gender;
  if (filters.admissionYear) query.admissionYear = Number(filters.admissionYear);
  if (filters.admissionAY) query.admissionAY = filters.admissionAY;
  if (filters.bloodGroup) query.bloodGroup = filters.bloodGroup;

  // classIds filter — convert to ObjectId array (Fix: was using String before)
  if (filters.classIds) {
    let classIds = filters.classIds;
    if (typeof classIds === "string") {
      try {
        classIds = JSON.parse(classIds);
      } catch {
        classIds = [];
      }
    }
    if (Array.isArray(classIds) && classIds.length > 0) {
      const validIds = classIds
        .filter((id) => mongoose.Types.ObjectId.isValid(id))
        .map((id) => new mongoose.Types.ObjectId(id));
      if (validIds.length > 0) {
        query.classIds = { $in: validIds };
      }
    }
  }

  // Parent existence filter
  if (filters.hasParent === "true" || filters.hasParent === true) {
    query.parentUserId = { $ne: null };
  } else if (filters.hasParent === "false" || filters.hasParent === false) {
    query.parentUserId = null;
  }

  // Photo existence filter
  if (filters.hasPhoto === "true" || filters.hasPhoto === true) {
    query.photo = { $ne: null };
  } else if (filters.hasPhoto === "false" || filters.hasPhoto === false) {
    query.photo = null;
  }

  // Referral filter
  if (filters.isReferred === "true" || filters.isReferred === true) {
    query["referralInfo.wasReferred"] = true;
  } else if (filters.isReferred === "false" || filters.isReferred === false) {
    query["referralInfo.wasReferred"] = { $ne: true };
  }

  // Date range filters
  if (filters.dateFrom || filters.dateTo) {
    query.admissionDate = {};
    if (filters.dateFrom) {
      query.admissionDate.$gte = new Date(filters.dateFrom);
    }
    if (filters.dateTo) {
      query.admissionDate.$lte = new Date(filters.dateTo);
    }
  }

  return query;
};

/**
 * Apply fields projection based on 'fields' query param
 */
const applyFieldProjection = (query, fieldsStr) => {
  if (!fieldsStr) return;

  const allowedFields = [
    "firstName",
    "lastName",
    "admissionNo",
    "dateOfBirth",
    "gender",
    "bloodGroup",
    "photo",
    "className",
    "section",
    "rollNo",
    "admissionDate",
    "status",
    "qrCode",
    "parentDetails",
    "address",
    "referralInfo",
    "siblings",
    "admissionYear",
    "admissionAY",
    "classIds",
    "classTimings",
    "paidFlexiHours",
    "freeFlexiHours",
    "consumedFlexiHours",
    "createdAt",
    "updatedAt",
    "documentVerification",
  ];

  const requestedFields = fieldsStr
    .split(",")
    .map((f) => f.trim())
    .filter((f) => allowedFields.includes(f));

  if (requestedFields.length > 0) {
    query.select(requestedFields.join(" "));
  }
};

/**
 * Apply population (joins) based on 'include' query param
 */
const applyIncludes = (query, includeStr) => {
  if (!includeStr) return;

  const includes = includeStr.split(",").map((i) => i.trim());

  if (includes.includes("parent")) {
    query.populate("parentUserId", "name email phone isActive lastLogin");
  }

  if (includes.includes("classes")) {
    query.populate("classIds", "classId name section classType status");
  }
};

/**
 * Build sort object
 */
const buildSort = (sortBy = "createdAt", sortOrder = "desc") => {
  const validSortFields = [
    "firstName",
    "lastName",
    "admissionNo",
    "admissionDate",
    "className",
    "section",
    "status",
    "createdAt",
    "parentDetails.primaryName",
  ];

  if (!validSortFields.includes(sortBy)) {
    sortBy = "createdAt";
  }

  const sortDirection = sortOrder === "asc" ? 1 : -1;
  return { [sortBy]: sortDirection };
};

// ─────────────────────────────────────────────────────────────
// EXPORTS
// ─────────────────────────────────────────────────────────────

/**
 * Get comprehensive statistics for admin dashboard
 */
exports.getAdminStudentStats = async () => {
  const total = await Student.countDocuments();

  const statusAgg = await Student.aggregate([
    { $group: { _id: "$status", count: { $sum: 1 } } },
  ]);

  const genderAgg = await Student.aggregate([
    { $group: { _id: "$gender", count: { $sum: 1 } } },
  ]);

  // Fix: classIds is now ObjectId — $lookup to get class name and classId string
  const classAgg = await Student.aggregate([
    { $unwind: "$classIds" },
    { $group: { _id: "$classIds", count: { $sum: 1 } } },
    { $sort: { count: -1 } },
    { $limit: 10 },
    {
      $lookup: {
        from: "classes",
        localField: "_id",
        foreignField: "_id",
        as: "classInfo",
      },
    },
    { $unwind: { path: "$classInfo", preserveNullAndEmptyArrays: true } },
    {
      $project: {
        classId: "$classInfo.classId",
        className: "$classInfo.name",
        count: 1,
      },
    },
  ]);

  const monthlyAgg = await Student.aggregate([
    {
      $group: {
        _id: {
          year: { $year: "$admissionDate" },
          month: { $month: "$admissionDate" },
        },
        count: { $sum: 1 },
      },
    },
    { $sort: { "_id.year": -1, "_id.month": -1 } },
    { $limit: 12 },
  ]);

  const stats = {
    total,
    Active: 0,
    Inactive: 0,
    Graduated: 0,
    Transferred: 0,
    genderBreakdown: { Male: 0, Female: 0, Other: 0 },
    topClasses: [],
    monthlyTrend: [],
  };

  statusAgg.forEach((item) => {
    if (stats[item._id] !== undefined) {
      stats[item._id] = item.count;
    }
  });

  genderAgg.forEach((item) => {
    if (stats.genderBreakdown[item._id] !== undefined) {
      stats.genderBreakdown[item._id] = item.count;
    }
  });

  // Fix: now using classId string + className from $lookup
  classAgg.forEach((item) => {
    stats.topClasses.push({
      classId: item.classId || null,
      className: item.className || null,
      studentCount: item.count,
    });
  });

  monthlyAgg.forEach((item) => {
    stats.monthlyTrend.push({
      year: item._id.year,
      month: item._id.month,
      count: item.count,
    });
  });

  return stats;
};

/**
 * Get all students with advanced filtering (Admin only)
 */
exports.getAllStudentsForAdmin = async (filters = {}, userRole = "admin") => {
  if (!["admin"].includes(userRole)) {
    throw new ErrorResponse("Unauthorized access", 403);
  }

  const {
    search,
    status,
    className,
    section,
    classIds,
    gender,
    admissionYear,
    admissionAY,
    bloodGroup,
    hasParent,
    hasPhoto,
    isReferred,
    dateFrom,
    dateTo,
    page = 1,
    limit = 20,
    sortBy,
    sortOrder,
    fields,
    include,
  } = filters;

  const query = buildStudentQuery({
    search,
    status,
    className,
    section,
    classIds,
    gender,
    admissionYear,
    admissionAY,
    bloodGroup,
    hasParent,
    hasPhoto,
    isReferred,
    dateFrom,
    dateTo,
  });

  const total = await Student.countDocuments(query);
  const sort = buildSort(sortBy, sortOrder);

  let studentQuery = Student.find(query).sort(sort);

  applyIncludes(studentQuery, include);
  applyFieldProjection(studentQuery, fields);

  const pageNum = parseInt(page) || 1;
  const limitNum = Math.min(parseInt(limit) || 20, 500);
  const skip = (pageNum - 1) * limitNum;

  const data = await studentQuery.skip(skip).limit(limitNum).lean();

  // Default parent populate if not explicitly included
  if (!include || !include.includes("parent")) {
    const populatedData = await Student.populate(data, {
      path: "parentUserId",
      select: "name email phone isActive lastLogin",
    });
    return {
      total,
      page: pageNum,
      pages: Math.ceil(total / limitNum),
      count: data.length,
      data: populatedData,
      metadata: {
        filtersApplied: Object.keys(filters).filter((k) => filters[k]),
        sort: { by: sortBy || "createdAt", order: sortOrder || "desc" },
        limit: limitNum,
      },
    };
  }

  return {
    total,
    page: pageNum,
    pages: Math.ceil(total / limitNum),
    count: data.length,
    data,
    metadata: {
      filtersApplied: Object.keys(filters).filter((k) => filters[k]),
      sort: { by: sortBy || "createdAt", order: sortOrder || "desc" },
      limit: limitNum,
    },
  };
};

/**
 * Get student by ID or admission number
 */
exports.getStudentById = async (idParam, options = {}) => {
  const student = await findStudentByIdOrAdmissionNo(idParam).populate(
    "parentUserId",
    "name email phone isActive lastLogin",
  );

  if (!student) {
    throw new ErrorResponse("Student not found", 404);
  }

  const enquiry = await Enquiry.findOne({ studentId: student._id }).select(
    "adminNotes",
  );
  student.adminNotes = enquiry ? enquiry.adminNotes : "";

  if (options.fields) {
    const projected = student.toObject();
    const allowedFields = options.fields.split(",").map((f) => f.trim());
    const filtered = {};
    allowedFields.forEach((field) => {
      if (projected[field] !== undefined) {
        filtered[field] = projected[field];
      }
    });
    return filtered;
  }

  return student;
};

/**
 * Export students data for admin (CSV/Excel ready)
 */
exports.exportStudents = async (filters = {}) => {
  const {
    search,
    status,
    className,
    section,
    classIds,
    gender,
    admissionYear,
    dateFrom,
    dateTo,
  } = filters;

  const query = buildStudentQuery({
    search,
    status,
    className,
    section,
    classIds,
    gender,
    admissionYear,
    dateFrom,
    dateTo,
  });

  const students = await Student.find(query)
    .populate("parentUserId", "name email phone")
    .sort({ admissionNo: 1 })
    .lean();

  return students.map((s) => ({
    admissionNo: s.admissionNo,
    firstName: s.firstName,
    lastName: s.lastName,
    fullName: `${s.firstName} ${s.lastName}`,
    dateOfBirth: s.dateOfBirth,
    gender: s.gender,
    className: s.className,
    section: s.section,
    rollNo: s.rollNo,
    status: s.status,
    parentName: s.parentUserId?.name || "",
    parentEmail: s.parentUserId?.email || "",
    parentPhone: s.parentUserId?.phone || "",
    admissionDate: s.admissionDate,
    bloodGroup: s.bloodGroup || "",
  }));
};

/**
 * Assign a class to student with timing clash validation
 * Route: POST /api/admin/students/:id/assign-class
 */
exports.assignClassToStudent = async (studentId, newClassId, user, feeOptions = {}) => {
  const student = await Student.findById(studentId);
  if (!student) throw new ErrorResponse("Student not found", 404);

  const newClass = await Class.findById(newClassId);
  if (!newClass) throw new ErrorResponse("Class not found", 404);

  // Fix: classIds are now ObjectId — no filter/String conversion needed
  const existingClasses = await Class.find({ _id: { $in: student.classIds } });

  const { clash, clashWith } = checkTimingConflict(existingClasses, newClass);
  if (clash) {
    throw new ErrorResponse(
      `Timing clash detected: "${newClass.name}" (${newClass.startTime}-${newClass.endTime}) overlaps with "${clashWith.name}" (${clashWith.startTime}-${clashWith.endTime})`,
      400,
    );
  }

  // Fix: use .equals() for ObjectId comparison instead of String()
  const alreadyAssigned = student.classIds.some((id) => id.equals(newClass._id));
  if (!alreadyAssigned) {
    student.classIds.push(newClass._id);
    await student.save();
  }

  // Also create the billing enrollment, so a student assigned here is
  // actually invoiced (previously this endpoint only updated the roster —
  // fee.service.enrollStudent was the only place StudentEnrollment got
  // created, so quick-assigned students were silently never billed).
  // A billing hiccup (e.g. already enrolled, class not billable) must not
  // fail the roster assignment itself, which has already succeeded above.
  let enrollment = null;
  if (user) {
    try {
      enrollment = await feeService.enrollStudent(
        { studentId, classId: newClassId, ...feeOptions },
        user,
      );
    } catch (err) {
      logger.warn(
        `[ASSIGN-CLASS] Billing enrollment skipped for student ${studentId} → class ${newClassId}: ${err.message}`,
      );
    }
  }

  return { success: true, student, enrollment };
};

/**
 * Get students who are red-flagged (absent 3+ times in last 7 days)
 * Route: GET /api/admin/students/red-flagged
 */
exports.getRedFlaggedStudents = async () => {
  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
  const fromKey = sevenDaysAgo.toISOString().slice(0, 10);

  const result = await Attendance.aggregate([
    {
      $match: {
        status: "Absent",
        attendanceDateKey: { $gte: fromKey },
      },
    },
    {
      $group: {
        _id: "$studentId",
        absentCount: { $sum: 1 },
        studentName: { $first: "$studentName" },
        admissionNo: { $first: "$studentAdmissionNo" },
      },
    },
    { $match: { absentCount: { $gte: 3 } } },
    { $sort: { absentCount: -1 } },
  ]);

  return result.map((r) => ({
    studentId: r._id,
    studentName: r.studentName,
    admissionNo: r.admissionNo,
    absentInLast7Days: r.absentCount,
    isRedFlagged: true,
  }));
};

/**
 * Get free days per student
 * Route: GET /api/admin/students/free-days-report?fromDate=YYYY-MM-DD&toDate=YYYY-MM-DD
 */
exports.getStudentFreeDaysReport = async ({
  fromDate,
  toDate,
  classId,
} = {}) => {
  const from =
    fromDate ||
    new Date(new Date().getFullYear(), new Date().getMonth(), 1)
      .toISOString()
      .slice(0, 10);
  const to = toDate || new Date().toISOString().slice(0, 10);

  const startD = new Date(from);
  const endD = new Date(to);
  const totalDays = Math.ceil((endD - startD) / (1000 * 60 * 60 * 24)) + 1;

  const studentQuery = { status: "Active" };

  // Fix: classId from query param is a string — convert to ObjectId
  if (classId && mongoose.Types.ObjectId.isValid(classId)) {
    studentQuery.classIds = new mongoose.Types.ObjectId(classId);
  }

  const students = await Student.find(studentQuery).select(
    "firstName lastName admissionNo classIds",
  );

  const report = await Promise.all(
    students.map(async (s) => {
      const attendedDays = await Attendance.countDocuments({
        studentId: s._id,
        attendanceDateKey: { $gte: from, $lte: to },
        status: "Present",
      });

      return {
        studentId: s._id,
        name: `${s.firstName} ${s.lastName}`,
        admissionNo: s.admissionNo,
        totalDaysInRange: totalDays,
        attendedDays,
        freeDays: totalDays - attendedDays,
      };
    }),
  );

  return report;
};

/**
 * Get students sorted by attendance count
 * Route: GET /api/admin/students/attendance-ranking?order=asc|desc&fromDate=YYYY-MM-DD&toDate=YYYY-MM-DD
 */
exports.getStudentsByAttendanceOrder = async ({
  order = "desc",
  fromDate,
  toDate,
} = {}) => {
  const from =
    fromDate ||
    new Date(new Date().getFullYear(), new Date().getMonth(), 1)
      .toISOString()
      .slice(0, 10);
  const to = toDate || new Date().toISOString().slice(0, 10);

  const startD = new Date(from);
  const endD = new Date(to);
  const totalDays = Math.ceil((endD - startD) / (1000 * 60 * 60 * 24)) + 1;

  const ranking = await Attendance.aggregate([
    {
      $match: {
        attendanceDateKey: { $gte: from, $lte: to },
        status: "Present",
      },
    },
    {
      $group: {
        _id: "$studentId",
        presentDays: { $sum: 1 },
        studentName: { $first: "$studentName" },
        admissionNo: { $first: "$studentAdmissionNo" },
      },
    },
    {
      $project: {
        studentId: "$_id",
        studentName: 1,
        admissionNo: 1,
        presentDays: 1,
        totalDays: { $literal: totalDays },
        percentage: {
          $round: [
            { $multiply: [{ $divide: ["$presentDays", totalDays] }, 100] },
            1,
          ],
        },
      },
    },
    { $sort: { presentDays: order === "asc" ? 1 : -1 } },
  ]);

  return ranking;
};

//end code 