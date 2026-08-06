const fs = require("fs");
const mongoose = require("mongoose");
const Student = require("./student.model");
const Parent = require("../shared/parent.model");
const User = require("../auth/user.model");

//new code
const { Attendance } = require("../attendance/attendance.model");
const StudentEnrollment = require("../fee/studentEnrollment.model");
const Invoice = require("../fee/invoice.model");
const StudentWallet = require("../fee/studentWallet.model");
const feeService = require("../fee/fee.service");
const academicSessionService = require("../academicSession/academicSession.service");
const logger = require("../../config/logger");




const Referral = require("../../modules/referral/referral.model");
const referralService = require("../../modules/referral/referral.service");
const Class = require("../../modules/class/class.model");
const Enquiry = require("../../modules/enquiry/enquiry.model");
const ErrorResponse = require("../../utils/errorResponse");
const s3Service = require("../../services/s3.service");

/**
 * SECURITY: strips parent phone/email off a student doc (mutates the
 * plain-object form) for a teacher who lacks canViewStudentMobile.
 * admin/sub-admin/parent are never redacted here — callers only invoke
 * this for role === 'teacher'.
 * Covers both `parentDetails.{primaryPhone,primaryEmail}` and the
 * populated `parentUserId.{phone,email}` — both were being sent to every
 * teacher regardless of the toggle before this fix.
 */
const redactParentContact = (studentDoc) => {
  const obj =
    typeof studentDoc.toObject === "function"
      ? studentDoc.toObject()
      : studentDoc;
  if (obj.parentDetails) {
    obj.parentDetails = {
      ...obj.parentDetails,
      primaryPhone: "",
      primaryEmail: "",
    };
  }
  if (obj.parentUserId && typeof obj.parentUserId === "object") {
    obj.parentUserId = { ...obj.parentUserId, phone: "", email: "" };
  }
  return obj;
};

/**
 * Helper: Find student by _id OR admissionNo string (e.g. BB250001)
 * @param {string} idParam - The ID parameter from request
 * @param {mongoose.ClientSession} session - Optional MongoDB session for transactions
 * @returns {mongoose.Query}
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
 * Helper: Validate that all classIds exist and are active
 * @param {Array} classIds - Array of class ObjectId strings
 * @returns {Promise<{valid: boolean, error?: string}>}
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
 * Helper: Safely parse JSON strings
 * @param {*} val - Value to parse
 * @param {*} fallback - Fallback value if parsing fails
 * @returns {*} Parsed value or fallback
 */
const parseJSON = (val, fallback) => {
  try {
    return val ? JSON.parse(val) : fallback;
  } catch {
    return fallback;
  }
};

/**
 * Helper: Delete uploaded file if exists (no-op for memory storage)
 * @param {Object} file - Multer file object
 */
const deleteUploadedFile = (file) => {
  // With memoryStorage, files are in memory buffer - no disk cleanup needed
  // This function is kept for backward compatibility
  return;
};

/**
 * Get all students with pagination and filtering
 * @param {Object} queryOptions - Query options
 * @param {string} queryOptions.search - Search term
 * @param {string} queryOptions.status - Status filter
 * @param {string} queryOptions.className - Class name filter
 * @param {string} queryOptions.section - Section filter
 * @param {string} queryOptions.sessionId - Academic session filter
 * @param {number} queryOptions.page - Page number
 * @param {number} queryOptions.limit - Items per page
 * @returns {Object} Students list with pagination info
 */
exports.getAllStudents = async ({
  search,
  status,
  className,
  section,
  sessionId,
  page = 1,
  limit = 20,
}, requesterRole, teacherPermissions) => {
  const query = {};

  if (status) {
    query.status = status;
  }

  if (className) {
    query.className = className;
  }

  if (section) {
    query.section = section;
  }

  if (sessionId) {
    query.sessionId = sessionId;
  }

  if (search) {
    const searchRegex = new RegExp(search, "i");
    query.$or = [
      { firstName: searchRegex },
      { lastName: searchRegex },
      { admissionNo: searchRegex },
      { "parentDetails.primaryEmail": searchRegex },
      { "parentDetails.primaryPhone": searchRegex },
    ];
  }

  const total = await Student.countDocuments(query);

  const students = await Student.find(query)
    .populate("parentUserId", "name email phone isActive lastLogin")
    .sort({ createdAt: -1 })
    .limit(parseInt(limit))
    .skip((parseInt(page) - 1) * parseInt(limit));

  // Add adminNotes from related enquiry for each student
  const canViewMobile = requesterRole !== "teacher" || teacherPermissions?.canViewStudentMobile === true;
  const studentsWithNotes = await Promise.all(
    students.map(async (student) => {
      const enquiry = await Enquiry.findOne({ studentId: student._id }).select(
        "adminNotes",
      );
      student.adminNotes = enquiry ? enquiry.adminNotes : "";
      return canViewMobile ? student : redactParentContact(student);
    }),
  );

  return {
    total,
    page: parseInt(page),
    pages: Math.ceil(total / parseInt(limit)),
    count: studentsWithNotes.length,
    data: studentsWithNotes,
  };
};

/**
 * Get student by ID or admission number
 * @param {string} idParam - Student ID or admission number
 * @param {string} userRole - Requesting user's role
 * @param {string} userId - Requesting user's ID
 * @returns {Object} Student document
 */
exports.getStudentById = async (idParam, userRole, userId, teacherPermissions) => {
  const student = await findStudentByIdOrAdmissionNo(idParam).populate(
    "parentUserId",
    "name email phone isActive lastLogin",
  );

  if (!student) {
    throw new ErrorResponse("Student not found", 404);
  }

  // If role is parent, check if this student belongs to them
  if (userRole === "parent") {
    const parent = await Parent.findOne({ userId });

    if (!parent) {
      throw new ErrorResponse("Parent account not found", 404);
    }

    const isChild = parent.children.some(
      (childId) => childId.toString() === student._id.toString(),
    );

    if (!isChild) {
      throw new ErrorResponse("Not authorized to access this student", 403);
    }
  }

  // Fetch adminNotes from related enquiry (if any)
  const enquiry = await Enquiry.findOne({ studentId: student._id }).select(
    "adminNotes",
  );
  if (enquiry) {
    student.adminNotes = enquiry.adminNotes;
  } else {
    student.adminNotes = "";
  }

  const canViewMobile = userRole !== "teacher" || teacherPermissions?.canViewStudentMobile === true;
  return canViewMobile ? student : redactParentContact(student);
};

/**
 * Create a new student with parent account (transactional)
 * @param {Object} body - Request body
 * @param {Object} file - Uploaded file (optional)
 * @param {Object} user - Authenticated user
 * @returns {Object} Created student and parent data
 */
exports.createStudent = async (body, file, user) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    // STEP 1: Parse parent and address data
    const parentData =
      typeof body.parent === "string" ? JSON.parse(body.parent) : body.parent;
    const addressData =
      typeof body.address === "string"
        ? JSON.parse(body.address)
        : body.address;

    // STEP 2: Check if parent email already exists
    const existingUser = await User.findOne({
      email: parentData.primaryEmail,
    }).session(session);
    if (existingUser) {
      deleteUploadedFile(file);
      throw new ErrorResponse("Parent email already exists", 400);
    }

    // STEP 3: Create User with role "parent"
    const parentUser = await User.create(
      [
        {
          name: parentData.primaryName,
          email: parentData.primaryEmail,
          password: parentData.password,
          role: "parent",
          phone: parentData.primaryPhone,
          createdBy: user._id,
        },
      ],
      { session },
    );

    // STEP 4: Create Parent document
    const parentDoc = await Parent.create(
      [
        {
          userId: parentUser[0]._id,
          children: [],
          address: addressData,
          createdBy: user._id,
        },
      ],
      { session },
    );

    // STEP 5: Build student data
    let photoUrl = null;
    let photoKey = null;

    // Upload photo to S3 if provided
    if (file) {
      const uploadResult = await s3Service.uploadToS3(
        file,
        "students",
        user._id.toString(),
        "photo",
      );
      photoUrl = uploadResult.url;
      photoKey = uploadResult.key;
    }

    // Explicit body.sessionId lets staff pre-admit into a not-yet-Active
    // "Upcoming" session; every other caller defaults to whatever session
    // is currently Active. Resolves to null (not an error) if neither
    // exists, preserving today's behavior with zero sessions created.
    const sessionId =
      body.sessionId || (await academicSessionService.getCurrentActiveSessionId());

    const studentData = {
      firstName: body.firstName,
      lastName: body.lastName,
      dateOfBirth: body.dateOfBirth || null,
      gender: body.gender || "Male",
      bloodGroup: body.bloodGroup || "",
      photo: photoUrl,
      photoKey: photoKey,
      className: body.className || "",
      section: body.section || "",
      rollNo: body.rollNo || "",
      admissionDate: body.admissionDate || Date.now(),
      status: body.status || "Active",
      parentUserId: parentUser[0]._id,
      parentDetails: {
        primaryName: parentData.primaryName,
        primaryEmail: parentData.primaryEmail,
        primaryPhone: parentData.primaryPhone,
        relation: parentData.relation || "Father",
        fatherName: parentData.fatherName || "",
        fatherPhone: parentData.fatherPhone || "",
        motherName: parentData.motherName || "",
        motherPhone: parentData.motherPhone || "",
      },
      address: addressData,
      createdBy: user._id,
      fatherDob: body.fatherDob || null,
      fatherEmail: body.fatherEmail || "",
      motherEmail: body.motherEmail || "",
      motherDob: body.motherDob || null,
      admissionYear: body.admissionYear ? Number(body.admissionYear) : null,
      admissionAY: body.admissionAY || "",
      sessionId,
      classIds: parseJSON(body.classIds, []),
      classTimings: parseJSON(body.classTimings, {}),
      paidFlexiHours: body.paidFlexiHours ? Number(body.paidFlexiHours) : 0,
      freeFlexiHours: body.freeFlexiHours ? Number(body.freeFlexiHours) : 0,
      consumedFlexiHours: body.consumedFlexiHours
        ? Number(body.consumedFlexiHours)
        : 0,
      siblings: parseJSON(body.siblings, []),
      documentVerification: {
        admissionForm: body.documentVerification?.admissionForm ?? false,
        birthCertificate: body.documentVerification?.birthCertificate ?? false,
        studentAadharCard:
          body.documentVerification?.studentAadharCard ?? false,
        motherAadharCard: body.documentVerification?.motherAadharCard ?? false,
        fatherAadharCard: body.documentVerification?.fatherAadharCard ?? false,
        studentPhoto: body.documentVerification?.studentPhoto ?? false,
        motherPhoto: body.documentVerification?.motherPhoto ?? false,
        fatherPhoto: body.documentVerification?.fatherPhoto ?? false,
        transferCertificate:
          body.documentVerification?.transferCertificate ?? false,
        medicalCertificate:
          body.documentVerification?.medicalCertificate ?? false,
        others: body.documentVerification?.others ?? false,
      },
    };

    // STEP 6: Validate classIds
    const classValidation = await validateClassIds(studentData.classIds);
    if (!classValidation.valid) {
      deleteUploadedFile(file);
      throw new ErrorResponse(classValidation.error, 400);
    }

    const student = await Student.create([studentData], { session });

    // STEP 7: Push student._id into parent.children
    parentDoc[0].children.push(student[0]._id);
    await parentDoc[0].save({ session });

    // STEP 8: Auto-link Referral (shared service)
    const mobilesToCheck = [
      parentData.primaryPhone,
      parentData.fatherPhone,
      parentData.motherPhone,
    ]
      .filter(Boolean)
      .map((m) => m.replace(/\D/g, "").slice(-10));

    const referralResult =
      await referralService.findAndMatchReferralForFresherAdmission(
        mobilesToCheck,
        student[0]._id,
        `${body.firstName} ${body.lastName}`,
        "Auto-joined: Student created directly by admin",
        session,
      );

    if (referralResult.found) {
      await Student.findByIdAndUpdate(
        student[0]._id,
        {
          referralInfo: {
            wasReferred: true,
            referralId: referralResult.referralId,
            referredByParentId: referralResult.referrerParentId,
            referredByName: "",
          },
        },
        { session },
      );
    }

    const referralTracking = referralResult.found
      ? {
          found: true,
          referralId: referralResult.referralId,
          referredBy: referralResult.referredBy,
          autoUpdatedToJoined: true,
        }
      : { found: false };

    // STEP 9: Commit transaction
    await session.commitTransaction();

    return {
      student: {
        id: student[0]._id,
        admissionNo: student[0].admissionNo,
        fullName: student[0].fullName,
        className: student[0].className,
        section: student[0].section,
        qrCode: student[0].qrCode,
        status: student[0].status,
        photo: student[0].photo,
        sessionId: student[0].sessionId,
      },
      parentAccount: {
        id: parentUser[0]._id,
        name: parentUser[0].name,
        email: parentUser[0].email,
        phone: parentUser[0].phone,
        role: parentUser[0].role,
      },
      referralTracking,
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
 * Update student photo
 * @param {string} idParam - Student ID or admission number
 * @param {Object} file - Uploaded file
 * @returns {Object} Updated student data
 */
exports.updateStudentPhoto = async (idParam, file) => {
  const student = await findStudentByIdOrAdmissionNo(idParam);

  if (!student) {
    deleteUploadedFile(file);
    throw new ErrorResponse("Student not found", 404);
  }

  // Delete old photo from S3 if photoKey exists
  if (student.photoKey) {
    try {
      await s3Service.deleteFromS3(student.photoKey);
    } catch (s3Error) {
      console.log("S3 file not found or already deleted:", student.photoKey);
    }
  } else if (student.photo && !student.photo.startsWith("http")) {
    // Legacy: Delete local file if it's not an S3 URL
    try {
      fs.unlinkSync(student.photo);
    } catch (unlinkErr) {
      // Ignore error if file not found
    }
  }

  // Upload new photo to S3
  const uploadResult = await s3Service.uploadToS3(
    file,
    "students",
    student._id.toString(),
    "photo",
  );

  // Update student with new photo URL and S3 key
  student.photo = uploadResult.url;
  student.photoKey = uploadResult.key;
  await student.save();

  return {
    id: student._id,
    admissionNo: student.admissionNo,
    fullName: student.fullName,
    photo: student.photo,
    photoKey: student.photoKey,
  };
};

/**
 * Update student details
 * @param {string} idParam - Student ID or admission number
 * @param {Object} updateData - Fields to update
 * @param {Object} [adminUser] - The admin performing the update (needed to
 *   sync classIds changes into billing enrollments)
 * @returns {Object} Updated student
 */
exports.updateStudent = async (idParam, updateData, adminUser = null) => {
  // Fields that can be updated
  const allowedFields = [
    "firstName",
    "lastName",
    "dateOfBirth",
    "gender",
    "bloodGroup",
    "className",
    "section",
    "rollNo",
    "status",
    "address",
    "fatherDob",
    "fatherEmail",
    "motherEmail",
    "motherDob",
    "admissionYear",
    "admissionAY",
    "classIds",
    "classTimings",
    "paidFlexiHours",
    "freeFlexiHours",
    "consumedFlexiHours",
    "siblings",
    "documentVerification",
  ];

  const filteredData = {};

  allowedFields.forEach((field) => {
    if (updateData[field] !== undefined) {
      if (
        [
          "paidFlexiHours",
          "freeFlexiHours",
          "consumedFlexiHours",
          "admissionYear",
        ].includes(field)
      ) {
        filteredData[field] = Number(updateData[field]);
      } else {
        filteredData[field] = updateData[field];
      }
    }
  });

  const student = await findStudentByIdOrAdmissionNo(idParam);

  if (!student) {
    throw new ErrorResponse("Student not found", 404);
  }

  // Validate classIds if being updated
  const previousClassIds = (student.classIds || []).map((id) => id.toString());
  if (filteredData.classIds !== undefined) {
    const parsedClassIds =
      typeof filteredData.classIds === "string"
        ? JSON.parse(filteredData.classIds)
        : filteredData.classIds;
    const classValidation = await validateClassIds(parsedClassIds);
    if (!classValidation.valid) {
      throw new ErrorResponse(classValidation.error, 400);
    }
    filteredData.classIds = parsedClassIds;
  }

  const updatedStudent = await Student.findByIdAndUpdate(
    student._id,
    filteredData,
    {
      new: true,
      runValidators: true,
    },
  ).populate("parentUserId", "name email phone isActive lastLogin");

  // Keep billing enrollment in sync with a classIds change made through this
  // generic edit form — previously only the dedicated assign-class/enroll
  // flows touched StudentEnrollment, so an edit here silently desynced them.
  if (filteredData.classIds !== undefined) {
    const newClassIds = filteredData.classIds.map((id) => id.toString());
    const added = newClassIds.filter((id) => !previousClassIds.includes(id));
    const removed = previousClassIds.filter((id) => !newClassIds.includes(id));

    for (const classId of added) {
      try {
        await feeService.enrollStudent(
          { studentId: student._id, classId },
          adminUser || { _id: student._id },
        );
      } catch (err) {
        logger.warn(`[STUDENT-UPDATE] Enrollment skipped for ${student._id} → class ${classId}: ${err.message}`);
      }
    }
    if (removed.length > 0) {
      await StudentEnrollment.updateMany(
        { studentId: student._id, classId: { $in: removed }, status: "Active" },
        { $set: { status: "Cancelled" } },
      );
    }
  }

  // Keep the name snapshot on wallet/enrollment records in sync when the
  // student's name is edited — those collections copy the name at
  // creation time and never re-read it from Student afterward.
  if (filteredData.firstName !== undefined || filteredData.lastName !== undefined) {
    const newName = `${updatedStudent.firstName} ${updatedStudent.lastName}`.trim();
    await Promise.all([
      StudentWallet.updateOne({ studentId: student._id }, { $set: { studentName: newName } }),
      StudentEnrollment.updateMany({ studentId: student._id }, { $set: { studentName: newName } }),
    ]);
  }

  return updatedStudent;
};

/**
 * Delete student
 * @param {string} idParam - Student ID or admission number
 * @returns {Object} Success message
 */
exports.deleteStudent = async (idParam) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const student = await findStudentByIdOrAdmissionNo(idParam, session);

    if (!student) {
      throw new ErrorResponse("Student not found", 404);
    }

    if (student.photoKey) {
      try {
        await s3Service.deleteFromS3(student.photoKey);
      } catch (s3Error) {
        console.log("S3 file not found or already deleted:", student.photoKey);
      }
    } else if (student.photo && !student.photo.startsWith("http")) {
      // Legacy: Delete local file if it's not an S3 URL
      try {
        fs.unlinkSync(student.photo);
      } catch (unlinkErr) {
        // Ignore error if file not found
      }
    }

    const parent = await Parent.findOne({
      userId: student.parentUserId,
    }).session(session);

    if (!parent) {
      throw new ErrorResponse("Parent not found", 404);
    }

    parent.children = parent.children.filter(
      (childId) => childId.toString() !== student._id.toString(),
    );

    if (parent.children.length === 0) {
      await Parent.deleteOne({ _id: parent._id }, { session });
      await User.deleteOne({ _id: parent.userId }, { session });
    } else {
      await parent.save({ session });
    }

    // Cascade: attendance records
await Attendance.deleteMany({ studentId: student._id }, { session });

// Cascade: cancel all enrollments
await StudentEnrollment.updateMany(
  { studentId: student._id },
  { $set: { status: 'Cancelled' } },
  { session }
);

// Cascade: cancel unpaid/partial invoices
await Invoice.updateMany(
  { studentId: student._id, status: { $in: ['UNPAID', 'PARTIAL'] } },
  { $set: { status: 'CANCELLED' } },
  { session }
);

// Cascade: mark wallet as zero (keep for audit)
await StudentWallet.updateOne(
  { studentId: student._id },
  { $set: { balance: 0 } },
  { session }
);

await Student.deleteOne({ _id: student._id }, { session });


    await session.commitTransaction();

    return { message: "Student deleted successfully" };
  } catch (err) {
    await session.abortTransaction();
    throw err;
  } finally {
    session.endSession();
  }
};

/**
 * Get my children (for parent users)
 * @param {string} userId - Parent user ID
 * @returns {Object} Children list
 */
exports.getMyChildren = async (userId) => {
  const parent = await Parent.findOne({ userId }).populate({
    path: "children",
    populate: {
      path: "parentUserId",
      select: "name email phone isActive lastLogin",
    },
  });

  if (!parent) {
    throw new ErrorResponse("Parent account not found", 404);
  }

  // Add adminNotes from related enquiry for each child
  const childrenWithNotes = await Promise.all(
    parent.children.map(async (child) => {
      const enquiry = await Enquiry.findOne({ studentId: child._id }).select(
        "adminNotes",
      );
      child.adminNotes = enquiry ? enquiry.adminNotes : "";
      return child;
    }),
  );

  return {
    count: childrenWithNotes.length,
    data: childrenWithNotes,
  };
};