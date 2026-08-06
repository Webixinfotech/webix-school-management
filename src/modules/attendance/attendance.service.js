//===============New code for auto attendence =================//

// const mongoose = require("mongoose");
// const { Attendance } = require("./attendance.model");
// const Student = require("../student/student.model");
// const Teacher = require("../teacher/teacher.model");
// const Parent = require("../shared/parent.model");
// const Class = require("../class/class.model");
// const CenterSession = require("./centerSession.model");
// const User = require("../auth/user.model");
// const NotificationService = require("../notification/notification.service");
// const logger = require("../../config/logger");
// const ErrorResponse = require("../../utils/errorResponse");

// const DEFAULT_TIMEZONE = process.env.APP_TIMEZONE || "Asia/Kolkata";

// const getDateKeyFromParts = (date) => {
//   const formatter = new Intl.DateTimeFormat("en-CA", {
//     timeZone: DEFAULT_TIMEZONE,
//     year: "numeric",
//     month: "2-digit",
//     day: "2-digit",
//   });

//   const parts = formatter.formatToParts(date);
//   const year = parts.find((part) => part.type === "year")?.value;
//   const month = parts.find((part) => part.type === "month")?.value;
//   const day = parts.find((part) => part.type === "day")?.value;

//   return `${year}-${month}-${day}`;
// };

// const normalizeAttendanceDate = (input) => {
//   let dateKey;

//   if (!input) {
//     dateKey = getDateKeyFromParts(new Date());
//   } else if (
//     typeof input === "string" &&
//     /^\d{4}-\d{2}-\d{2}$/.test(input.trim())
//   ) {
//     dateKey = input.trim();
//   } else {
//     const parsed = new Date(input);
//     if (Number.isNaN(parsed.getTime())) {
//       throw new ErrorResponse("Invalid attendance date", 400);
//     }
//     dateKey = getDateKeyFromParts(parsed);
//   }

//   return {
//     attendanceDateKey: dateKey,
//     attendanceDate: new Date(`${dateKey}T00:00:00.000Z`),
//   };
// };

// const findStudentByIdOrAdmissionNo = (idParam) => {
//   const isObjectId = /^[a-fA-F0-9]{24}$/.test(idParam);

//   return Student.findOne({
//     $or: [{ admissionNo: idParam }, ...(isObjectId ? [{ _id: idParam }] : [])],
//   });
// };

// const getTeacherByUserId = async (userId) => {
//   return Teacher.findOne({ userId });
// };

// const ensureStudentIsActive = (student) => {
//   if (student.status !== "Active") {
//     throw new ErrorResponse(
//       "Attendance can only be marked for active students",
//       400,
//     );
//   }
// };

// const resolveStudentClassContext = async (student, teacherClassIds = []) => {
//   const normalizedTeacherClassIds = (teacherClassIds || []).map((id) =>
//     String(id),
//   );
//   const normalizedStudentClassIds = (student.classIds || []).map((id) =>
//     String(id),
//   );
//   let matchedClass = null;

//   if (normalizedStudentClassIds.length > 0) {
//     const preferredClassId =
//       normalizedTeacherClassIds.length > 0
//         ? normalizedStudentClassIds.find((id) =>
//             normalizedTeacherClassIds.includes(id),
//           )
//         : normalizedStudentClassIds[0];

//     if (preferredClassId && mongoose.Types.ObjectId.isValid(preferredClassId)) {
//       matchedClass = await Class.findById(preferredClassId).select(
//         "_id classId name section",
//       );
//     }
//   }

//   if (!matchedClass && student.className) {
//     const classQuery = {
//       name: student.className,
//     };

//     if (student.section) {
//       classQuery.section = student.section;
//     }

//     if (normalizedTeacherClassIds.length > 0) {
//       classQuery._id = { $in: normalizedTeacherClassIds };
//     }

//     matchedClass = await Class.findOne(classQuery).select(
//       "_id classId name section",
//     );
//   }

//   return {
//     classId: matchedClass?._id || null,
//     classCode: matchedClass?.classId || "",
//     className: matchedClass?.name || student.className || "",
//     section: matchedClass?.section || student.section || "",
//   };
// };

// const assertParentHasStudentAccess = async (userId, studentId) => {
//   const parent = await Parent.findOne({ userId });

//   if (!parent) {
//     throw new ErrorResponse("Parent account not found", 404);
//   }

//   const hasStudent = parent.children.some(
//     (childId) => childId.toString() === studentId.toString(),
//   );

//   if (!hasStudent) {
//     throw new ErrorResponse(
//       "Not authorized to access this student attendance",
//       403,
//     );
//   }
// };

// const getTeacherAccessContext = async (
//   user,
//   { requireMarkPermission = false } = {},
// ) => {
//   if (user.role !== "teacher") {
//     return null;
//   }

//   const teacher = await getTeacherByUserId(user._id);

//   if (!teacher) {
//     throw new ErrorResponse("Teacher profile not found", 404);
//   }

//   if (requireMarkPermission && !teacher.permissions?.canMarkAttendance) {
//     throw new ErrorResponse("Teacher is not allowed to mark attendance", 403);
//   }

//   return teacher;
// };

// const assertUserCanAccessStudent = async (user, student, options = {}) => {
//   if (user.role === "admin" || user.role === "sub-admin") {
//     return {
//       teacher: null,
//       classContext: await resolveStudentClassContext(student),
//     };
//   }

//   if (user.role === "teacher") {
//     const teacher = await getTeacherAccessContext(user, options);
//     // const teacherClassIds = (teacher.classIds || []).map((id) => String(id));
//     const teacherClassIds = teacher.classIds || [];

//     if (teacherClassIds.length === 0) {
//       throw new ErrorResponse("Teacher is not assigned to any class", 403);
//     }

//     const classContext = await resolveStudentClassContext(
//       student,
//       teacherClassIds,
//     );

//   if (
//   !classContext.classId ||
//   !teacherClassIds.some((id) => id.equals(classContext.classId))
// ) {
//       throw new ErrorResponse(
//         "Teacher is not assigned to this student class",
//         403,
//       );
//     }

//     return { teacher, classContext };
//   }

//   if (user.role === "parent") {
//     await assertParentHasStudentAccess(user._id, student._id);

//     return {
//       teacher: null,
//       classContext: await resolveStudentClassContext(student),
//     };
//   }

//   throw new ErrorResponse(
//     `User role '${user.role}' is not authorized to access attendance`,
//     403,
//   );
// };

// const buildAttendancePayload = ({
//   student,
//   classContext,
//   normalizedDate,
//   status,
//   method,
//   remarks,
//   sessionLabel,
//   user,
//   teacher,
// }) => ({
//   studentId: student._id,
//   studentAdmissionNo: student.admissionNo,
//   studentName: `${student.firstName} ${student.lastName}`.trim(),
//   qrCode: student.qrCode || "",
//   classId: classContext.classId || null,
//   classCode: classContext.classCode || "",
//   className: classContext.className || "",
//   section: classContext.section || "",
//   attendanceDate: normalizedDate.attendanceDate,
//   attendanceDateKey: normalizedDate.attendanceDateKey,
//   sessionLabel: sessionLabel || "FULL_DAY",
//   status,
//   method,
//   remarks: remarks ? remarks.trim() : "",
//   markedBy: user._id,
//   markedByRole: user.role,
//   markedByTeacherId: teacher?._id || null,
//   markedAt: new Date(),
// });

// const enrichAttendanceQuery = (query) => {
//   return query
//     .populate(
//       "studentId",
//       "admissionNo firstName lastName className section qrCode status",
//     )
//     .populate(
//       "classId",
//       "classId name section classType startTime endTime status",
//     )
//     .populate("markedBy", "name email role phone")
//     .populate("markedByTeacherId", "employeeId name email phone");
// };

// const getTeacherScopedAttendanceFilter = async (user) => {
//   if (user.role !== "teacher") {
//     return {};
//   }

//   const teacher = await getTeacherAccessContext(user);
//   const teacherClassIds = (teacher.classIds || []).map((id) => String(id));

//   return {
//     $or: [
//       { classId: { $in: teacherClassIds } },
//       { markedByTeacherId: teacher._id },
//     ],
//   };
// };

// exports.scanAttendance = async (body, user) => {
//   const { qrCode, attendanceDate, sessionLabel = "FULL_DAY" } = body;
//   const teacher = await getTeacherAccessContext(user, {
//     requireMarkPermission: true,
//   });

//   const student = await Student.findOne({ qrCode: qrCode.trim() });

//   if (!student) {
//     throw new ErrorResponse("Invalid QR code or student not found", 404);
//   }

//   ensureStudentIsActive(student);

//   const access = await assertUserCanAccessStudent(user, student, {
//     requireMarkPermission: true,
//   });
//   const normalizedDate = normalizeAttendanceDate(attendanceDate);

//   let attendance = await Attendance.findOne({
//     studentId: student._id,
//     attendanceDateKey: normalizedDate.attendanceDateKey,
//     sessionLabel,
//   });

//   let action = "created";

//   if (attendance) {
//     if (attendance.status === "Present") {
//       action = "already_marked";
//     } else {
//       const payload = buildAttendancePayload({
//         student,
//         classContext: access.classContext,
//         normalizedDate,
//         status: "Present",
//         method: "qr",
//         remarks: body.remarks || attendance.remarks,
//         sessionLabel,
//         user,
//         teacher: teacher || access.teacher,
//       });

//       attendance = await Attendance.findByIdAndUpdate(attendance._id, payload, {
//         new: true,
//         runValidators: true,
//       });
//       action = "updated";
//     }
//   } else {
//     const payload = buildAttendancePayload({
//       student,
//       classContext: access.classContext,
//       normalizedDate,
//       status: "Present",
//       method: "qr",
//       remarks: body.remarks,
//       sessionLabel,
//       user,
//       teacher: teacher || access.teacher,
//     });

//     attendance = await Attendance.create(payload);
//   }

//   const populatedAttendance = await enrichAttendanceQuery(
//     Attendance.findById(attendance._id),
//   );

//   // --- Send Notification to Parent ---
//   // This is done in the background (fire and forget) to not slow down the API response.
//   if (action !== "already_marked" && student.parentUserId) {
//     NotificationService.sendAttendanceNotification(
//       student._id,
//       student.parentUserId,
//       "Present", // QR scan always marks as 'Present'
//       normalizedDate.attendanceDateKey,
//       `${student.firstName} ${student.lastName}`,
//     ).catch((err) =>
//       logger.error(
//         `[Notification Failed] Scan Attendance for student ${student._id}: ${err.message}`,
//       ),
//     );
//   }

//   return {
//     action,
//     attendance: populatedAttendance,
//     student: {
//       id: student._id,
//       admissionNo: student.admissionNo,
//       fullName: `${student.firstName} ${student.lastName}`.trim(),
//       className: access.classContext.className,
//       section: access.classContext.section,
//       qrCode: student.qrCode,
//     },
//   };
// };

// // =========================================================================
// // FEATURE: 8:00 PM MISSED CHECK-OUT AUTOMATION & ADMIN NOTIFICATION
// // =========================================================================

// exports.autoCloseMissedCenterSessions = async () => {
//   const dateKey = new Date().toISOString().slice(0, 10);

//   // Find sessions that are still active today or earlier
//   const activeSessions = await CenterSession.find({
//     status: "ACTIVE",
//     dateKey: { $lte: dateKey },
//   }).populate("studentId");

//   if (!activeSessions || activeSessions.length === 0) {
//     return 0;
//   }

//   const now = new Date();
//   let autoCheckoutSummary = [];
//   let totalDeductedHours = 0;

//   for (const session of activeSessions) {
//     const student = session.studentId;
//     if (!student) continue;

//     // Set out time to exactly when the cron runs (8:00 PM)
//     session.outTime = now;
//     session.status = "MISSED_CHECKOUT";

//     const sessionStart = session.inTime.getTime();
//     const sessionEnd = session.outTime.getTime();
//     const totalStayMinutes = (sessionEnd - sessionStart) / 60000;
//     session.totalStayMinutes = Math.floor(totalStayMinutes);

//     const todayAttendances = await Attendance.find({
//       studentId: student._id,
//       attendanceDateKey: session.dateKey,
//       status: "Present",
//     }).populate("classId");

//     let classMinutesInSession = 0;

//     for (const att of todayAttendances) {
//       if (att.classId && att.classId.startTime && att.classId.endTime) {
//         const [sHours, sMins] = att.classId.startTime.split(":").map(Number);
//         const [eHours, eMins] = att.classId.endTime.split(":").map(Number);

//         const cStartDt = new Date(session.inTime);
//         cStartDt.setHours(sHours, sMins, 0, 0);

//         const cEndDt = new Date(session.inTime);
//         cEndDt.setHours(eHours, eMins, 0, 0);

//         const overlapStart = Math.max(sessionStart, cStartDt.getTime());
//         const overlapEnd = Math.min(sessionEnd, cEndDt.getTime());

//         if (overlapStart < overlapEnd) {
//           classMinutesInSession += (overlapEnd - overlapStart) / 60000;
//         }
//       }
//     }

//     const idleMinutes = Math.max(
//       0,
//       session.totalStayMinutes - classMinutesInSession,
//     );
//     const GRACE_PERIOD_MINS = 15;
//     let deductedHours = 0;

// if (idleMinutes > GRACE_PERIOD_MINS) {
//        deductedHours = parseFloat((idleMinutes / 60).toFixed(2));
//        session.deductedFlexiHours = deductedHours;
//        session.notes = `Auto-closed at 8 PM. Idle time: ${Math.floor(idleMinutes)} mins. Deducted: ${deductedHours} hrs.`;

//        await Student.findByIdAndUpdate(
//          student._id,
//          {
//            $inc: {
//              consumedFlexiHours: deductedHours,
//            },
//          },
//          { strict: false },
//        );

//       // Notify Parent about the auto-checkout deduction
//       if (student.parentUserId) {
//         const studentName = student.firstName || "Your child";
//         const title = `🏫 Auto Check-Out & Hourly Billing Update`;
//         const body = `Hello! ${studentName} was automatically checked out from the center at 8:00 PM. Extra time spent: ${Math.floor(idleMinutes)} mins. As per policy, ${deductedHours} flexi-hours have been adjusted.`;

//         NotificationService.sendToSingleUser(
//           student.parentUserId,
//           title,
//           body,
//           {
//             type: "flexi_hours_deduction_auto",
//             studentId: student._id.toString(),
//           },
//         ).catch((err) =>
//           logger.error(
//             "Failed to send auto-checkout parent notification:",
//             err,
//           ),
//         );
//       }
//     } else {
//       session.notes = `Auto-closed at 8 PM. Idle time: ${Math.floor(idleMinutes)} mins (Within grace period).`;
//     }

//     await session.save();
//     autoCheckoutSummary.push({
//       name: `${student.firstName} ${student.lastName}`.trim(),
//       deducted: deductedHours,
//     });
//     totalDeductedHours += deductedHours;
//   }

//   // NOTIFY ALL ADMINS AND SUB-ADMINS
//   try {
//     const admins = await User.find({
//       role: { $in: ["admin", "sub-admin"] },
//       isActive: true,
//     }).select("_id");
//     if (admins.length > 0) {
//       const adminIds = admins.map((a) => a._id);
//       const title = `🔔 8:00 PM Auto Check-Out Summary`;
//       const body = `${autoCheckoutSummary.length} student(s) missed manual check-out and were auto-closed. Total flexi-hours deducted: ${totalDeductedHours.toFixed(2)} hrs.`;

//       await NotificationService.sendToMultipleUsers(adminIds, title, body, {
//         type: "admin_auto_checkout_summary",
//       });
//     }
//   } catch (err) {
//     logger.error("Failed to send admin auto-checkout summary:", err);
//   }

//   return autoCheckoutSummary.length;
// };

// exports.manualMarkAttendance = async (body, user) => {
//   const {
//     studentId,
//     attendanceDate,
//     status,
//     remarks,
//     sessionLabel = "FULL_DAY",
//     method = "manual",
//   } = body;

//   const student = await findStudentByIdOrAdmissionNo(studentId.trim());

//   if (!student) {
//     throw new ErrorResponse("Student not found", 404);
//   }

//   ensureStudentIsActive(student);

//   const access = await assertUserCanAccessStudent(user, student, {
//     requireMarkPermission: true,
//   });
//   const normalizedDate = normalizeAttendanceDate(attendanceDate);

//   let attendance = await Attendance.findOne({
//     studentId: student._id,
//     attendanceDateKey: normalizedDate.attendanceDateKey,
//     sessionLabel,
//   });

//   const payload = buildAttendancePayload({
//     student,
//     classContext: access.classContext,
//     normalizedDate,
//     status,
//     method,
//     remarks,
//     sessionLabel,
//     user,
//     teacher: access.teacher,
//   });

//   const action = attendance ? "updated" : "created";

//   if (attendance) {
//     attendance = await Attendance.findByIdAndUpdate(attendance._id, payload, {
//       new: true,
//       runValidators: true,
//     });
//   } else {
//     attendance = await Attendance.create(payload);
//   }

//   const populatedAttendance = await enrichAttendanceQuery(
//     Attendance.findById(attendance._id),
//   );

//   // --- Send Notification to Parent ---
//   // This is done in the background (fire and forget) to not slow down the API response.
//   if (student.parentUserId) {
//     NotificationService.sendAttendanceNotification(
//       student._id,
//       student.parentUserId,
//       status, // Status from the request body ('Present', 'Absent', 'Late')
//       normalizedDate.attendanceDateKey,
//       `${student.firstName} ${student.lastName}`,
//     ).catch((err) =>
//       logger.error(
//         `[Notification Failed] Manual Mark Attendance for student ${student._id}: ${err.message}`,
//       ),
//     );
//   }

//   return {
//     action,
//     attendance: populatedAttendance,
//   };
// };

// exports.getAttendanceList = async (filters, user) => {
//   const {
//     date,
//     dateFrom,
//     dateTo,
//     status,
//     className,
//     section,
//     sessionLabel,
//     studentId,
//     page = 1,
//     limit = 20,
//   } = filters;

//   const query = {};

//   if (date) {
//     query.attendanceDateKey = date;
//   }

//   if (dateFrom || dateTo) {
//     query.attendanceDateKey = {};
//     if (dateFrom) query.attendanceDateKey.$gte = dateFrom;
//     if (dateTo) query.attendanceDateKey.$lte = dateTo;
//   }

//   if (status) {
//     query.status = status;
//   }

//   if (className) {
//     query.className = className;
//   }

//   if (section) {
//     query.section = section;
//   }

//   if (sessionLabel) {
//     query.sessionLabel = sessionLabel;
//   }

//   if (studentId) {
//     const student = await findStudentByIdOrAdmissionNo(studentId);

//     if (!student) {
//       throw new ErrorResponse("Student not found", 404);
//     }

//     if (user.role === "parent") {
//       await assertParentHasStudentAccess(user._id, student._id);
//     }

//     query.studentId = student._id;
//   }

//   if (user.role === "parent" && !studentId) {
//     const parent = await Parent.findOne({ userId: user._id });

//     if (!parent) {
//       throw new ErrorResponse("Parent account not found", 404);
//     }

//     query.studentId = { $in: parent.children };
//   }

//   if (user.role === "teacher") {
//     Object.assign(query, await getTeacherScopedAttendanceFilter(user));
//   }

//   const pageNum = parseInt(page, 10);
//   const limitNum = parseInt(limit, 10);

//   const total = await Attendance.countDocuments(query);

//   const data = await enrichAttendanceQuery(
//     Attendance.find(query)
//       .sort({ attendanceDateKey: -1, markedAt: -1 })
//       .skip((pageNum - 1) * limitNum)
//       .limit(limitNum),
//   );

//   return {
//     total,
//     page: pageNum,
//     pages: Math.ceil(total / limitNum),
//     count: data.length,
//     data,
//   };
// };

// exports.getStudentAttendance = async (studentIdParam, filters, user) => {
//   const student = await findStudentByIdOrAdmissionNo(studentIdParam);

//   if (!student) {
//     throw new ErrorResponse("Student not found", 404);
//   }

//   await assertUserCanAccessStudent(user, student);

//   const query = {
//     studentId: student._id,
//   };

//   if (filters.dateFrom || filters.dateTo) {
//     query.attendanceDateKey = {};
//     if (filters.dateFrom) query.attendanceDateKey.$gte = filters.dateFrom;
//     if (filters.dateTo) query.attendanceDateKey.$lte = filters.dateTo;
//   }

//   const records = await enrichAttendanceQuery(
//     Attendance.find(query).sort({ attendanceDateKey: -1, markedAt: -1 }),
//   );

//   const summary = records.reduce(
//     (acc, record) => {
//       acc.total += 1;
//       acc[record.status] = (acc[record.status] || 0) + 1;
//       return acc;
//     },
//     {
//       total: 0,
//       Present: 0,
//       Absent: 0,
//       Late: 0,
//       Leave: 0,
//     },
//   );

//   return {
//     student: {
//       id: student._id,
//       admissionNo: student.admissionNo,
//       fullName: `${student.firstName} ${student.lastName}`.trim(),
//       className: student.className,
//       section: student.section,
//       qrCode: student.qrCode,
//     },
//     summary,
//     count: records.length,
//     data: records,
//   };
// };

// exports.getDailySummary = async (date, user) => {
//   const dateKey = date || normalizeAttendanceDate().attendanceDateKey;
//   const match = {
//     attendanceDateKey: dateKey,
//   };

//   if (user.role === "parent") {
//     throw new ErrorResponse(
//       `User role '${user.role}' is not authorized to access this route`,
//       403,
//     );
//   }

//   if (user.role === "teacher") {
//     Object.assign(match, await getTeacherScopedAttendanceFilter(user));
//   }

//   const counts = await Attendance.aggregate([
//     { $match: match },
//     {
//       $group: {
//         _id: "$status",
//         count: { $sum: 1 },
//       },
//     },
//   ]);

//   const classWise = await Attendance.aggregate([
//     { $match: match },
//     {
//       $group: {
//         _id: {
//           className: "$className",
//           section: "$section",
//         },
//         total: { $sum: 1 },
//         present: {
//           $sum: {
//             $cond: [{ $eq: ["$status", "Present"] }, 1, 0],
//           },
//         },
//         absent: {
//           $sum: {
//             $cond: [{ $eq: ["$status", "Absent"] }, 1, 0],
//           },
//         },
//         late: {
//           $sum: {
//             $cond: [{ $eq: ["$status", "Late"] }, 1, 0],
//           },
//         },
//         leave: {
//           $sum: {
//             $cond: [{ $eq: ["$status", "Leave"] }, 1, 0],
//           },
//         },
//       },
//     },
//     {
//       $project: {
//         _id: 0,
//         className: "$_id.className",
//         section: "$_id.section",
//         total: 1,
//         present: 1,
//         absent: 1,
//         late: 1,
//         leave: 1,
//       },
//     },
//     { $sort: { className: 1, section: 1 } },
//   ]);

//   const summary = {
//     date: dateKey,
//     total: 0,
//     Present: 0,
//     Absent: 0,
//     Late: 0,
//     Leave: 0,
//   };

//   counts.forEach((item) => {
//     summary[item._id] = item.count;
//     summary.total += item.count;
//   });

//   return {
//     summary,
//     classWise,
//   };
// };

// exports.updateAttendance = async (idParam, updateData, user) => {
//   const attendance = await Attendance.findById(idParam);

//   if (!attendance) {
//     throw new ErrorResponse("Attendance record not found", 404);
//   }

//   const student = await Student.findById(attendance.studentId);

//   if (!student) {
//     throw new ErrorResponse("Linked student not found", 404);
//   }

//   const access = await assertUserCanAccessStudent(user, student, {
//     requireMarkPermission: true,
//   });

//   const nextDate = updateData.attendanceDate
//     ? normalizeAttendanceDate(updateData.attendanceDate)
//     : {
//         attendanceDate: attendance.attendanceDate,
//         attendanceDateKey: attendance.attendanceDateKey,
//       };

//   const nextSession = updateData.sessionLabel || attendance.sessionLabel;

//   const duplicate = await Attendance.findOne({
//     _id: { $ne: attendance._id },
//     studentId: student._id,
//     attendanceDateKey: nextDate.attendanceDateKey,
//     sessionLabel: nextSession,
//   });

//   if (duplicate) {
//     throw new ErrorResponse(
//       "Attendance already exists for this student, date, and session",
//       400,
//     );
//   }

//   const payload = buildAttendancePayload({
//     student,
//     classContext: access.classContext,
//     normalizedDate: nextDate,
//     status: updateData.status || attendance.status,
//     method: updateData.method || attendance.method,
//     remarks:
//       updateData.remarks !== undefined
//         ? updateData.remarks
//         : attendance.remarks,
//     sessionLabel: nextSession,
//     user,
//     teacher: access.teacher,
//   });

//   const updatedAttendance = await Attendance.findByIdAndUpdate(
//     attendance._id,
//     payload,
//     { new: true, runValidators: true },
//   );

//   return enrichAttendanceQuery(Attendance.findById(updatedAttendance._id));
// };

// // =========================================================================
// // FEATURE: SESSION-BASED CENTER ATTENDANCE & FLEXI HOURS DEDUCTION (GATE)
// // =========================================================================

// // ─── AUTO CLASS ATTENDANCE HELPER ────────────────────────────────────────────

// /**
//  * IST-safe time parser
//  * Convert "HH:MM" string to today's Date object in IST
//  */
// const parseClassTime = (timeStr, baseDateIST) => {
//   const [h, m] = timeStr.split(":").map(Number);
//   const d = new Date(baseDateIST);
//   d.setHours(h, m, 0, 0);
//   return d;
// };

// /**
//  * Get current IST time as "HH:MM" string
//  */
// const getCurrentISTTime = () => {
//   const now = new Date();
//   const ist = new Date(
//     now.toLocaleString("en-US", { timeZone: "Asia/Kolkata" }),
//   );
//   return `${String(ist.getHours()).padStart(2, "0")}:${String(ist.getMinutes()).padStart(2, "0")}`;
// };

// /**
//  * Get current IST date key YYYY-MM-DD
//  */
// const getISTDateKey = () => {
//   const ist = new Date(
//     new Date().toLocaleString("en-US", { timeZone: "Asia/Kolkata" }),
//   );
//   return `${ist.getFullYear()}-${String(ist.getMonth() + 1).padStart(2, "0")}-${String(ist.getDate()).padStart(2, "0")}`;
// };

// /**
//  * Auto-mark class attendance for a student based on center check-in
//  * Called on center check-in AND by cron every minute
//  *
//  * Logic:
//  * - Find all classes student is enrolled in
//  * - For each class: if class is currently running (startTime <= now <= endTime)
//  *   AND today is a valid class day → mark Present (if not already)
//  * - Method = 'system' so teacher knows it was auto-marked
//  */
// const autoMarkClassAttendance = async (student, dateKey, systemUserId) => {
//   // if (!student.classIds || student.classIds.length === 0) return [];
//   if (!student.classIds || student.classIds.length === 0) return [];

//   const now = new Date();
//   const istNow = new Date(
//     now.toLocaleString("en-US", { timeZone: "Asia/Kolkata" }),
//   );
//   const dayNames = ["SUN", "MON", "TUE", "WED", "THU", "FRI", "SAT"];
//   const todayDay = dayNames[istNow.getDay()];
//   const currentTimeStr = getCurrentISTTime();

//   // Fetch all classes student is enrolled in — FIXED_TIME and FLEX_TIME only
//   // HOURS_BASED classes are handled by flexi deduction, not attendance
//   // const enrolledClasses = await Class.find({
//   //   $or: [
//   //     { classId: { $in: student.classIds } },
//   //     {
//   //       _id: {
//   //         $in: student.classIds.filter((id) => /^[a-fA-F0-9]{24}$/.test(id)),
//   //       },
//   //     },
//   //   ],
//   //   classType: { $in: ["FIXED_TIME", "FLEX_TIME"] },
//   //   status: "Active",
//   // }).lean();

//   const enrolledClasses = await Class.find({
//   _id: { $in: student.classIds },
//   status: 'Active',
//   classType: { $in: ['FIXED_TIME', 'FLEX_TIME'] },
// });

//   const marked = [];

//   for (const cls of enrolledClasses) {
//     // Check if class runs today
//     if (cls.days && cls.days.length > 0 && !cls.days.includes(todayDay))
//       continue;

//     // Get class start/end time
//     // For FLEX_TIME — check student's classTimings map
//     let startTime = cls.startTime;
//     let endTime = cls.endTime;

//     if (cls.classType === "FLEX_TIME" && student.classTimings) {
//       const timing =
//         student.classTimings[cls.classId] ||
//         student.classTimings[String(cls._id)];
//       if (timing?.startTime) startTime = timing.startTime;
//       if (timing?.endTime) endTime = timing.endTime;
//     }

//     if (!startTime || !endTime) continue;

//     // Is class running right now?
//     const isRunning = currentTimeStr >= startTime && currentTimeStr < endTime;
//     if (!isRunning) continue;

//     // Already marked for this class today?
//     const existing = await Attendance.findOne({
//       studentId: student._id,
//       classId: cls._id,
//       attendanceDateKey: dateKey,
//     });

//     if (existing) continue; // Already marked — skip

//     // Mark Present
//     const normalizedDate = normalizeAttendanceDate(dateKey);
//     const payload = {
//       studentId: student._id,
//       studentAdmissionNo: student.admissionNo,
//       studentName: `${student.firstName} ${student.lastName}`.trim(),
//       qrCode: student.qrCode || "",
//       classId: cls._id,
//       classCode: cls.classId || "",
//       className: cls.name || "",
//       section: cls.section || "",
//       attendanceDate: normalizedDate.attendanceDate,
//       attendanceDateKey: dateKey,
//       sessionLabel: "FULL_DAY",
//       status: "Present",
//       method: "system",
//       remarks: "Auto-marked on center check-in",
//       markedBy: systemUserId,
//       markedByRole: "system",
//       checkInTime: now,
//     };

//     try {
//       await Attendance.create(payload);
//       marked.push({
//         classId: cls._id,
//         className: cls.name,
//         startTime,
//         endTime,
//       });
//       logger.info(
//         `[AUTO-ATT] Marked Present: ${student.admissionNo} | ${cls.name} | ${dateKey}`,
//       );
//     } catch (err) {
//       // Duplicate key — already exists, ignore
//       if (err.code !== 11000) {
//         logger.error(
//           `[AUTO-ATT] Failed to mark ${student.admissionNo} in ${cls.name}: ${err.message}`,
//         );
//       }
//     }
//   }

//   return marked;
// };

// /**
//  * Auto-close class attendance checkOutTime when class ends
//  * Called by cron every minute
//  * If student is still in center when class ends → set checkOutTime = class endTime
//  */
// const autoCloseClassAttendance = async (dateKey) => {
//   const currentTimeStr = getCurrentISTTime();

//   // Find all Present records today without checkout
//   const activeRecords = await Attendance.find({
//     attendanceDateKey: dateKey,
//     status: "Present",
//     method: "system",
//     checkOutTime: { $exists: false },
//   }).populate("classId", "endTime startTime");

//   let closed = 0;

//   for (const record of activeRecords) {
//     if (!record.classId?.endTime) continue;
//     if (currentTimeStr >= record.classId.endTime) {
//       // Class ended — set checkout to class end time
//       const endDate = new Date();
//       const [eh, em] = record.classId.endTime.split(":").map(Number);
//       endDate.setHours(eh, em, 0, 0);

//       await Attendance.findByIdAndUpdate(record._id, {
//         checkOutTime: endDate,
//         isAutoCheckedOut: true,
//       });
//       closed++;
//     }
//   }

//   if (closed > 0) {
//     logger.info(
//       `[AUTO-ATT] Auto-closed checkOutTime for ${closed} class records on ${dateKey}`,
//     );
//   }
//   return closed;
// };

// // Export helpers for cron use
// exports.autoMarkClassAttendance = autoMarkClassAttendance;
// exports.autoCloseClassAttendance = autoCloseClassAttendance;
// exports.getISTDateKey = getISTDateKey;

// // ─────────────────────────────────────────────────────────────────────────────

// exports.centerCheckIn = async (body, user) => {
//   const { qrCode, studentId } = body;

//   let student;
//   if (qrCode) {
//     student = await Student.findOne({ qrCode: qrCode.trim() });
//   } else if (studentId) {
//     student = await findStudentByIdOrAdmissionNo(studentId.trim());
//   }

//   if (!student) {
//     throw new ErrorResponse("Student not found or invalid QR", 404);
//   }

//   ensureStudentIsActive(student);

//   const dateKey = new Date().toISOString().slice(0, 10);

//   // Check if an active session already exists today
//   const existingSession = await CenterSession.findOne({
//     studentId: student._id,
//     dateKey: dateKey,
//     status: "ACTIVE",
//   });

//   if (existingSession) {
//     throw new ErrorResponse(
//       "Student is already checked in at the center.",
//       400,
//     );
//   }

//   const session = await CenterSession.create({
//     studentId: student._id,
//     dateKey: dateKey,
//     inTime: new Date(),
//     status: "ACTIVE",
//   });

//   // ── AUTO-MARK currently running classes as Present ────────────────────────
//   // Fetch full student doc with classIds and classTimings for auto-mark logic
//   const fullStudent = await Student.findById(student._id)
//     .select(
//       "classIds classTimings firstName lastName admissionNo qrCode parentUserId",
//     )
//     .lean();

//   const markedClasses = await autoMarkClassAttendance(
//     fullStudent,
//     dateKey,
//     user._id,
//   );

//   // Notify parent — check-in + which classes auto-marked
//   if (student.parentUserId) {
//     const studentName = `${student.firstName} ${student.lastName}`.trim();
//     const classNames = markedClasses.map((c) => c.className).join(", ");
//     const classMsg =
//       markedClasses.length > 0 ? ` Auto-marked Present in: ${classNames}.` : "";

//     NotificationService.sendToSingleUser(
//       student.parentUserId,
//       `✅ ${studentName} reached school`,
//       `${studentName} has checked in at ${new Date().toLocaleTimeString("en-IN", { timeZone: "Asia/Kolkata" })}.${classMsg}`,
//       { type: "center_checkin", studentId: student._id.toString() },
//     ).catch((err) =>
//       logger.error("Failed to send check-in notification:", err),
//     );
//   }

//   return {
//     message: "Center Check-In successful",
//     session,
//     autoMarkedClasses: markedClasses,
//     student: {
//       name: `${student.firstName} ${student.lastName}`.trim(),
//       admissionNo: student.admissionNo,
//     },
//   };
// };

// exports.centerCheckOut = async (body, user) => {
//   const { qrCode, studentId } = body;

//   let student;
//   if (qrCode) {
//     student = await Student.findOne({ qrCode: qrCode.trim() });
//   } else if (studentId) {
//     student = await findStudentByIdOrAdmissionNo(studentId.trim());
//   }

//   if (!student) {
//     throw new ErrorResponse("Student not found or invalid QR", 404);
//   }

//   const dateKey = new Date().toISOString().slice(0, 10);

//   const session = await CenterSession.findOne({
//     studentId: student._id,
//     status: "ACTIVE",
//     dateKey: { $lte: dateKey }, // Can handle previous day missed checkouts too if cron failed
//   });

//   if (!session) {
//     throw new ErrorResponse(
//       "No active Center Check-In session found for this student",
//       404,
//     );
//   }

//   session.outTime = new Date();
//   session.status = "COMPLETED";

//   const sessionStart = session.inTime.getTime();
//   const sessionEnd = session.outTime.getTime();
//   const totalStayMinutes = (sessionEnd - sessionStart) / 60000;
//   session.totalStayMinutes = Math.floor(totalStayMinutes);

//   // Find classes attended TODAY
//   const todayAttendances = await Attendance.find({
//     studentId: student._id,
//     attendanceDateKey: session.dateKey,
//     status: "Present",
//   }).populate("classId");

//   let classMinutesInSession = 0;

//   // Calculate class overlapping time
//   for (const att of todayAttendances) {
//     if (att.classId && att.classId.startTime && att.classId.endTime) {
//       const [sHours, sMins] = att.classId.startTime.split(":").map(Number);
//       const [eHours, eMins] = att.classId.endTime.split(":").map(Number);

//       const cStartDt = new Date(session.inTime);
//       cStartDt.setHours(sHours, sMins, 0, 0);

//       const cEndDt = new Date(session.inTime);
//       cEndDt.setHours(eHours, eMins, 0, 0);

//       const cStart = cStartDt.getTime();
//       const cEnd = cEndDt.getTime();

//       const overlapStart = Math.max(sessionStart, cStart);
//       const overlapEnd = Math.min(sessionEnd, cEnd);

//       if (overlapStart < overlapEnd) {
//         classMinutesInSession += (overlapEnd - overlapStart) / 60000;
//       }
//     }
//   }

//   // ── THE MAGIC MATH ──
//   const idleMinutes = Math.max(
//     0,
//     session.totalStayMinutes - classMinutesInSession,
//   );

//   const GRACE_PERIOD_MINS = 15;
//   let deductedHours = 0;

// if (idleMinutes > GRACE_PERIOD_MINS) {
//        deductedHours = parseFloat((idleMinutes / 60).toFixed(2));
//        session.deductedFlexiHours = deductedHours;
//        session.notes = `Idle time: ${Math.floor(idleMinutes)} mins. Deducted: ${deductedHours} hrs.`;

//        await Student.findByIdAndUpdate(
//          student._id,
//          {
//            $inc: {
//              consumedFlexiHours: deductedHours,
//            },
//          },
//          { strict: false },
//        ); // strict false ensures it doesn't fail if schema lacks field

//     // SEND PUSH NOTIFICATION TO PARENT
//     if (student.parentUserId) {
//       const studentName = student.firstName || "Your child";
//       const title = `🏫 Update regarding ${studentName}'s Hourly Billing`;
//       const body = `Hello! ${studentName} spent some extra time (${Math.floor(idleMinutes)} mins) safely at the center today after classes. As per our extended care policy, ${deductedHours} flexi-hours have been adjusted from your account. Have a great day!`;

//       NotificationService.sendToSingleUser(student.parentUserId, title, body, {
//         type: "flexi_hours_deduction",
//         studentId: student._id.toString(),
//         deductedHours: deductedHours.toString(),
//         idleMinutes: Math.floor(idleMinutes).toString(),
//       }).catch((err) =>
//         logger.error("Failed to send flexi hours deduction notification:", err),
//       );
//     }
//   } else {
//     session.notes = `Idle time: ${Math.floor(idleMinutes)} mins (Within grace period).`;
//   }

//   await session.save();

//   return {
//     message: "Center Check-Out successful",
//     session,
//     math: {
//       totalStayMinutes: Math.floor(session.totalStayMinutes),
//       classMinutesInSession: Math.floor(classMinutesInSession),
//       idleMinutes: Math.floor(idleMinutes),
//       gracePeriodApplied: GRACE_PERIOD_MINS,
//       deductedHours,
//     },
//   };
// };


//===========================================================================//

const mongoose = require("mongoose");
const { Attendance } = require("./attendance.model");
const Student = require("../student/student.model");
const Teacher = require("../teacher/teacher.model");
const Parent = require("../shared/parent.model");
const Class = require("../class/class.model");
const CenterSession = require("./centerSession.model");
const User = require("../auth/user.model");
const NotificationService = require("../notification/notification.service");
const logger = require("../../config/logger");
const ErrorResponse = require("../../utils/errorResponse");
const flexiCardService = require("../fee/flexiCard.service");
const academicSessionService = require("../academicSession/academicSession.service");

const DEFAULT_TIMEZONE = process.env.APP_TIMEZONE || "Asia/Kolkata";

// Shared grace period (minutes) before idle/overstay time starts eating into
// a student's flexi-hours balance. Used by both the Center Session checkout
// flow and the manual-edit flexi recompute below — single source of truth
// so the two flows can never silently drift apart.
const GRACE_PERIOD_MINS = 15;

// =========================================================================
// SHARED FLEXI-HOURS RECOMPUTE HELPER
// =========================================================================
// Works out stayMinutes / scheduledMinutes / extraMinutes / flexiHoursDeducted
// for a given check-in -> check-out window, the exact same way regardless of
// *how* the attendance was captured (manual create, manual edit). This is
// the single source of truth so a student's flexi balance can never drift
// depending on which screen/endpoint was used.
//
// Idle time is measured against ALL of the student's "Present" sessions for
// that calendar day (not just the record being saved) — so a student with
// Morning + Afternoon classes isn't flagged idle during the Afternoon class
// just because we only looked at the Morning record's own class window.
const computeFlexiRecomputeFields = async ({
  studentId,
  attendanceDateKey,
  checkInTime,
  checkOutTime,
  classIdForCalc,
  excludeRecordId,
}) => {
  const checkInMs = checkInTime.getTime();
  const checkOutMs = checkOutTime.getTime();

  if (checkOutMs <= checkInMs) {
    throw new ErrorResponse(
      "Check-out time must be after check-in time",
      400,
    );
  }

  const stayMinutes = Math.floor((checkOutMs - checkInMs) / 60000);

  // Pull in every OTHER class session the student was marked "Present" for
  // that day, so we can net out time actually spent in a scheduled class
  // (i.e. don't treat a legit Afternoon class as "idle/extra" time just
  // because we're looking at the Morning record's window).
  // IMPORTANT: exclude the record currently being saved (excludeRecordId).
  // On a fresh CREATE it doesn't exist in the DB yet anyway — but on an
  // EDIT it already exists as "Present" with its OLD checkIn/checkOut, so
  // leaving it in would count stale data (or double count it). Its own
  // fresh window is always added explicitly below via classIdForCalc.
  const sessionQuery = { studentId, attendanceDateKey, status: "Present" };
  if (excludeRecordId) {
    sessionQuery._id = { $ne: excludeRecordId };
  }

  const todaySessions = await Attendance.find(sessionQuery).populate(
    "classId",
    "startTime endTime",
  );

  let classMinutesInWindow = 0;
  for (const sessionRec of todaySessions) {
    const cls = sessionRec.classId;
    if (!cls?.startTime || !cls?.endTime) continue;

    const cStartDt = buildISTDateTime(checkInTime, cls.startTime);
    const cEndDt = buildISTDateTime(checkInTime, cls.endTime);

    const overlapStart = Math.max(checkInMs, cStartDt.getTime());
    const overlapEnd = Math.min(checkOutMs, cEndDt.getTime());

    if (overlapStart < overlapEnd) {
      classMinutesInWindow += (overlapEnd - overlapStart) / 60000;
    }
  }

  // scheduledMinutes stays specific to THIS record's own class (display
  // field only — "how long was this particular class supposed to run"),
  // separate from the full-day idle-time math above.
  const classDoc = classIdForCalc
    ? await Class.findById(classIdForCalc).select("startTime endTime")
    : null;

  let scheduledMinutes = null;
  if (classDoc?.startTime && classDoc?.endTime) {
    const [sH, sM] = classDoc.startTime.split(":").map(Number);
    const [eH, eM] = classDoc.endTime.split(":").map(Number);
    scheduledMinutes = eH * 60 + eM - (sH * 60 + sM);

    // Always explicitly net out THIS record's own class window too — it
    // must never be skipped just because the record isn't in the DB yet
    // (fresh create) or was excluded above (edit). Without this, a brand
    // new manual create always had classMinutesInWindow stuck at 0 and its
    // *entire* stay got billed as idle/extra, even while the student was
    // sitting in their own scheduled class the whole time.
    const ownStartDt = buildISTDateTime(checkInTime, classDoc.startTime);
    const ownEndDt = buildISTDateTime(checkInTime, classDoc.endTime);

    const ownOverlapStart = Math.max(checkInMs, ownStartDt.getTime());
    const ownOverlapEnd = Math.min(checkOutMs, ownEndDt.getTime());

    if (ownOverlapStart < ownOverlapEnd) {
      classMinutesInWindow += (ownOverlapEnd - ownOverlapStart) / 60000;
    }
  }

  const idleMinutes = Math.max(0, stayMinutes - classMinutesInWindow);

  let flexiHoursDeducted = 0;
  if (idleMinutes > GRACE_PERIOD_MINS) {
    flexiHoursDeducted = parseFloat((idleMinutes / 60).toFixed(2));
  }

  return {
    stayMinutes,
    scheduledMinutes,
    extraMinutes: Math.floor(idleMinutes),
    flexiHoursDeducted,
  };
};

const getDateKeyFromParts = (date) => {
  const formatter = new Intl.DateTimeFormat("en-CA", {
    timeZone: DEFAULT_TIMEZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });

  const parts = formatter.formatToParts(date);
  const year = parts.find((part) => part.type === "year")?.value;
  const month = parts.find((part) => part.type === "month")?.value;
  const day = parts.find((part) => part.type === "day")?.value;

  return `${year}-${month}-${day}`;
};

const normalizeAttendanceDate = (input) => {
  let dateKey;

  if (!input) {
    dateKey = getDateKeyFromParts(new Date());
  } else if (
    typeof input === "string" &&
    /^\d{4}-\d{2}-\d{2}$/.test(input.trim())
  ) {
    dateKey = input.trim();
  } else {
    const parsed = new Date(input);
    if (Number.isNaN(parsed.getTime())) {
      throw new ErrorResponse("Invalid attendance date", 400);
    }
    dateKey = getDateKeyFromParts(parsed);
  }

  return {
    attendanceDateKey: dateKey,
    attendanceDate: new Date(`${dateKey}T00:00:00.000Z`),
  };
};

const findStudentByIdOrAdmissionNo = (idParam) => {
  const isObjectId = /^[a-fA-F0-9]{24}$/.test(idParam);

  return Student.findOne({
    $or: [{ admissionNo: idParam }, ...(isObjectId ? [{ _id: idParam }] : [])],
  });
};

const getTeacherByUserId = async (userId) => {
  return Teacher.findOne({ userId });
};

const ensureStudentIsActive = (student) => {
  if (student.status !== "Active") {
    throw new ErrorResponse(
      "Attendance can only be marked for active students",
      400,
    );
  }
};

/**
 * Resolve which class context to use for a student's attendance.
 * Fix: teacherClassIds are ObjectIds — use .equals() for comparison,
 *      and pass ObjectId array to MongoDB _id query.
 */
const resolveStudentClassContext = async (student, teacherClassIds = []) => {
  // teacherClassIds are ObjectIds (from teacher.classIds after migration)
  // student.classIds are also ObjectIds after migration
  const studentClassIds = student.classIds || [];
  let matchedClass = null;

  if (studentClassIds.length > 0) {
    let preferredId;

    if (teacherClassIds.length > 0) {
      // Find first student classId that is in teacher's classIds
      preferredId = studentClassIds.find((sId) =>
        teacherClassIds.some((tId) => tId.equals(sId)),
      );
    } else {
      preferredId = studentClassIds[0];
    }

    if (preferredId) {
      matchedClass = await Class.findById(preferredId).select(
        "_id classId name section",
      );
    }
  }

  // Fallback: match by className/section string (for legacy data)
  if (!matchedClass && student.className) {
    const classQuery = { name: student.className };
    if (student.section) classQuery.section = student.section;

    // Fix: pass ObjectId array to _id query, not String array
    if (teacherClassIds.length > 0) {
      classQuery._id = { $in: teacherClassIds };
    }

    matchedClass = await Class.findOne(classQuery).select(
      "_id classId name section",
    );
  }

  return {
    classId: matchedClass?._id || null,
    classCode: matchedClass?.classId || "",
    className: matchedClass?.name || student.className || "",
    section: matchedClass?.section || student.section || "",
  };
};

const assertParentHasStudentAccess = async (userId, studentId) => {
  const parent = await Parent.findOne({ userId });

  if (!parent) {
    throw new ErrorResponse("Parent account not found", 404);
  }

  const hasStudent = parent.children.some(
    (childId) => childId.toString() === studentId.toString(),
  );

  if (!hasStudent) {
    throw new ErrorResponse(
      "Not authorized to access this student attendance",
      403,
    );
  }
};

const getTeacherAccessContext = async (
  user,
  { requireMarkPermission = false } = {},
) => {
  if (user.role !== "teacher") {
    return null;
  }

  const teacher = await getTeacherByUserId(user._id);

  if (!teacher) {
    throw new ErrorResponse("Teacher profile not found", 404);
  }

  if (requireMarkPermission && !teacher.permissions?.canMarkAttendance) {
    throw new ErrorResponse("Teacher is not allowed to mark attendance", 403);
  }

  return teacher;
};

const assertUserCanAccessStudent = async (user, student, options = {}) => {
  if (user.role === "admin") {
    return {
      teacher: null,
      classContext: await resolveStudentClassContext(student),
    };
  }

  if (user.role === "teacher") {
    const teacher = await getTeacherAccessContext(user, options);
    // Fix: keep as ObjectId array — do NOT map to String
    const teacherClassIds = teacher.classIds || [];

    if (teacherClassIds.length === 0) {
      throw new ErrorResponse("Teacher is not assigned to any class", 403);
    }

    const classContext = await resolveStudentClassContext(
      student,
      teacherClassIds,
    );

    // Fix: use .equals() for ObjectId comparison
    if (
      !classContext.classId ||
      !teacherClassIds.some((id) => id.equals(classContext.classId))
    ) {
      throw new ErrorResponse(
        "Teacher is not assigned to this student class",
        403,
      );
    }

    return { teacher, classContext };
  }

  if (user.role === "parent") {
    await assertParentHasStudentAccess(user._id, student._id);

    return {
      teacher: null,
      classContext: await resolveStudentClassContext(student),
    };
  }

  throw new ErrorResponse(
    `User role '${user.role}' is not authorized to access attendance`,
    403,
  );
};

const buildAttendancePayload = ({
  student,
  classContext,
  normalizedDate,
  status,
  method,
  remarks,
  sessionLabel,
  user,
  teacher,
  sessionId,
}) => ({
  studentId: student._id,
  studentAdmissionNo: student.admissionNo,
  studentName: `${student.firstName} ${student.lastName}`.trim(),
  qrCode: student.qrCode || "",
  classId: classContext.classId || null,
  classCode: classContext.classCode || "",
  className: classContext.className || "",
  section: classContext.section || "",
  attendanceDate: normalizedDate.attendanceDate,
  attendanceDateKey: normalizedDate.attendanceDateKey,
  sessionLabel: sessionLabel || "FULL_DAY",
  status,
  method,
  remarks: remarks ? remarks.trim() : "",
  markedBy: user._id,
  markedByRole: user.role,
  markedByTeacherId: teacher?._id || null,
  markedAt: new Date(),
  sessionId: sessionId ?? null,
});

const enrichAttendanceQuery = (query) => {
  return query
    .populate(
      "studentId",
      "admissionNo firstName lastName className section qrCode status",
    )
    .populate(
      "classId",
      "classId name section classType startTime endTime status",
    )
    .populate("markedBy", "name email role phone")
    .populate("markedByTeacherId", "employeeId name email phone");
};

/**
 * Get attendance filter scoped to teacher's assigned classes.
 * Fix: use ObjectId array for classId $in query.
 */
const getTeacherScopedAttendanceFilter = async (user) => {
  if (user.role !== "teacher") {
    return {};
  }

  const teacher = await getTeacherAccessContext(user);
  // Fix: keep ObjectIds, do NOT convert to String
  const teacherClassIds = teacher.classIds || [];

  return {
    $or: [
      { classId: { $in: teacherClassIds } }, // ObjectId array — correct
      { markedByTeacherId: teacher._id },
    ],
  };
};

exports.scanAttendance = async (body, user) => {
  const { qrCode, attendanceDate, sessionLabel = "FULL_DAY", checkInTime, checkOutTime } = body;
  const teacher = await getTeacherAccessContext(user, {
    requireMarkPermission: true,
  });

  const student = await Student.findOne({ qrCode: qrCode.trim() });

  if (!student) {
    throw new ErrorResponse("Invalid QR code or student not found", 404);
  }

  ensureStudentIsActive(student);

  const access = await assertUserCanAccessStudent(user, student, {
    requireMarkPermission: true,
  });
  const normalizedDate = normalizeAttendanceDate(attendanceDate);
  const sessionId = await academicSessionService.getCurrentActiveSessionId();

  let attendance = await Attendance.findOne({
    studentId: student._id,
    attendanceDateKey: normalizedDate.attendanceDateKey,
    sessionLabel,
  });

  let action = "created";

  if (attendance) {
    if (attendance.status === "Present") {
      action = "already_marked";
    } else {
      const payload = buildAttendancePayload({
        student,
        classContext: access.classContext,
        normalizedDate,
        status: "Present",
        method: "qr",
        remarks: body.remarks || attendance.remarks,
        sessionLabel,
        user,
        teacher: teacher || access.teacher,
        sessionId,
      });

      if (checkInTime !== undefined) {
        payload.checkInTime = checkInTime;
      }
      if (checkOutTime !== undefined) {
        payload.checkOutTime = checkOutTime;
      }

      attendance = await Attendance.findByIdAndUpdate(attendance._id, payload, {
        new: true,
        runValidators: true,
      });
      action = "updated";
    }
  } else {
    const payload = buildAttendancePayload({
      student,
      classContext: access.classContext,
      normalizedDate,
      status: "Present",
      method: "qr",
      remarks: body.remarks,
      sessionLabel,
      user,
      teacher: teacher || access.teacher,
      sessionId,
    });

    if (checkInTime !== undefined) {
      payload.checkInTime = checkInTime;
    }
    if (checkOutTime !== undefined) {
      payload.checkOutTime = checkOutTime;
    }

    attendance = await Attendance.create(payload);
  }

  const populatedAttendance = await enrichAttendanceQuery(
    Attendance.findById(attendance._id),
  );

  if (action !== "already_marked" && student.parentUserId) {
    NotificationService.sendAttendanceNotification(
      student._id,
      student.parentUserId,
      "Present",
      normalizedDate.attendanceDateKey,
      `${student.firstName} ${student.lastName}`,
    ).catch((err) =>
      logger.error(
        `[Notification Failed] Scan Attendance for student ${student._id}: ${err.message}`,
      ),
    );
  }

  return {
    action,
    attendance: populatedAttendance,
    student: {
      id: student._id,
      admissionNo: student.admissionNo,
      fullName: `${student.firstName} ${student.lastName}`.trim(),
      className: access.classContext.className,
      section: access.classContext.section,
      qrCode: student.qrCode,
    },
  };
};

// =========================================================================
// FEATURE: 8:00 PM MISSED CHECK-OUT AUTOMATION & ADMIN NOTIFICATION
// =========================================================================

exports.autoCloseMissedCenterSessions = async () => {
  const dateKey = getISTDateKey();

  const activeSessions = await CenterSession.find({
    status: "ACTIVE",
    dateKey: { $lte: dateKey },
  }).populate("studentId");

  if (!activeSessions || activeSessions.length === 0) {
    return 0;
  }

  const now = new Date();
  let autoCheckoutSummary = [];
  let totalDeductedHours = 0;

  for (const session of activeSessions) {
    const student = session.studentId;
    if (!student) continue;

    session.outTime = now;
    session.status = "MISSED_CHECKOUT";

    const sessionStart = session.inTime.getTime();
    const sessionEnd = session.outTime.getTime();
    const totalStayMinutes = (sessionEnd - sessionStart) / 60000;
    session.totalStayMinutes = Math.floor(totalStayMinutes);

    const todayAttendances = await Attendance.find({
      studentId: student._id,
      attendanceDateKey: session.dateKey,
      status: "Present",
    }).populate("classId");

    let classMinutesInSession = 0;

    for (const att of todayAttendances) {
      if (att.classId && att.classId.startTime && att.classId.endTime) {
        const cStartDt = buildISTDateTime(session.inTime, att.classId.startTime);
        const cEndDt = buildISTDateTime(session.inTime, att.classId.endTime);

        const overlapStart = Math.max(sessionStart, cStartDt.getTime());
        const overlapEnd = Math.min(sessionEnd, cEndDt.getTime());

        if (overlapStart < overlapEnd) {
          classMinutesInSession += (overlapEnd - overlapStart) / 60000;
        }
      }
    }

    const idleMinutes = Math.max(
      0,
      session.totalStayMinutes - classMinutesInSession,
    );
    const GRACE_PERIOD_MINS = 15;
    let deductedHours = 0;

    if (idleMinutes > GRACE_PERIOD_MINS) {
      deductedHours = parseFloat((idleMinutes / 60).toFixed(2));
      session.deductedFlexiHours = deductedHours;
      session.notes = `Auto-closed at 8 PM. Idle time: ${Math.floor(idleMinutes)} mins. Deducted: ${deductedHours} hrs.`;

      // Prepaid Flexi Card routing: this idle-time deduction spans the
      // whole center session, not one specific class, so it can only be
      // safely attributed to a card when exactly one HOURS_BASED class was
      // attended that day (unambiguous). Any other case (zero, or more
      // than one) falls through to the legacy global pool exactly as
      // before — splitting one idle-time deduction across multiple cards
      // isn't something the source document defines, so it's left alone
      // rather than guessed at.
      const hoursBasedClassIds = [
        ...new Set(
          todayAttendances
            .filter((att) => att.classId && att.classId.classType === "HOURS_BASED")
            .map((att) => String(att.classId._id)),
        ),
      ];

      let cardResult = null;
      if (hoursBasedClassIds.length === 1) {
        cardResult = await flexiCardService.syncAttendanceDeduction(
          student._id,
          hoursBasedClassIds[0],
          deductedHours,
          null,
          0,
        );
      }

      if (!cardResult) {
        await Student.findByIdAndUpdate(
          student._id,
          { $inc: { consumedFlexiHours: deductedHours } },
          { strict: false },
        );
      }

      if (student.parentUserId) {
        const studentName = student.firstName || "Your child";
        const title = `🏫 Auto Check-Out & Hourly Billing Update`;
        const body = `Hello! ${studentName} was automatically checked out from the center at 8:00 PM. Extra time spent: ${Math.floor(idleMinutes)} mins. As per policy, ${deductedHours} flexi-hours have been adjusted.`;

        NotificationService.notifyUser(
          student.parentUserId,
          title,
          body,
          {
            type: "flexi_hours_deduction_auto",
            studentId: student._id.toString(),
          },
        ).catch((err) =>
          logger.error(
            "Failed to send auto-checkout parent notification:",
            err,
          ),
        );
      }
    } else {
      session.notes = `Auto-closed at 8 PM. Idle time: ${Math.floor(idleMinutes)} mins (Within grace period).`;
    }

    await session.save();
    autoCheckoutSummary.push({
      name: `${student.firstName} ${student.lastName}`.trim(),
      deducted: deductedHours,
    });
    totalDeductedHours += deductedHours;
  }

  try {
    const admins = await User.find({
      role: { $in: ["admin"] },
      isActive: true,
    }).select("_id");
    if (admins.length > 0) {
      const adminIds = admins.map((a) => a._id);
      const title = `🔔 8:00 PM Auto Check-Out Summary`;
      const body = `${autoCheckoutSummary.length} student(s) missed manual check-out and were auto-closed. Total flexi-hours deducted: ${totalDeductedHours.toFixed(2)} hrs.`;

      await NotificationService.notifyUsers(adminIds, title, body, {
        type: "admin_auto_checkout_summary",
      });
    }
  } catch (err) {
    logger.error("Failed to send admin auto-checkout summary:", err);
  }

  return autoCheckoutSummary.length;
};

exports.manualMarkAttendance = async (body, user) => {
  const {
    studentId,
    attendanceDate,
    status,
    remarks,
    sessionLabel = "FULL_DAY",
    method = "manual",
    checkInTime,
    checkOutTime,
  } = body;

  const student = await findStudentByIdOrAdmissionNo(studentId.trim());

  if (!student) {
    throw new ErrorResponse("Student not found", 404);
  }

  ensureStudentIsActive(student);

  const access = await assertUserCanAccessStudent(user, student, {
    requireMarkPermission: true,
  });
  const normalizedDate = normalizeAttendanceDate(attendanceDate);
  const sessionId = await academicSessionService.getCurrentActiveSessionId();

  let attendance = await Attendance.findOne({
    studentId: student._id,
    attendanceDateKey: normalizedDate.attendanceDateKey,
    sessionLabel,
  });

  const payload = buildAttendancePayload({
    student,
    classContext: access.classContext,
    normalizedDate,
    status,
    method,
    remarks,
    sessionLabel,
    user,
    teacher: access.teacher,
    sessionId,
  });

  // STEP 2c: set checkoutSource only when checkOutTime is part of the update
  if (checkInTime !== undefined && checkInTime !== null) {
    payload.checkInTime = checkInTime;
  }
  if (checkOutTime !== undefined && checkOutTime !== null) {
    payload.checkOutTime = checkOutTime;
    payload.checkoutSource = "manual";
  }

  // Consistent with updateAttendance(): an explicit `null` means "clear
  // this time", handled via $unset so the field is actually removed
  // instead of being stored as a null Date.
  const unsetFields = {};
  if (checkInTime === null) unsetFields.checkInTime = "";
  if (checkOutTime === null) unsetFields.checkOutTime = "";

  // =========================================================================
  // FLEXI-HOURS RECOMPUTE (manual create/edit)
  // =========================================================================
  // Whether the admin is creating a brand-new manual record or re-marking an
  // existing one, if we end up with a full check-in -> check-out window we
  // recompute stayMinutes/extraMinutes/flexiHoursDeducted the same way
  // updateAttendance() does — checking every one of the student's "Present"
  // sessions for the day so a class actually attended in between never gets
  // billed as idle/extra time. We always reverse this record's own
  // previously-stored flexiHoursDeducted before applying the fresh one, so
  // Student.consumedFlexiHours only ever moves by the net delta — repeat
  // manual re-marks can never double-deduct.
  const effectiveCheckIn =
    checkInTime === null
      ? null
      : checkInTime !== undefined
        ? new Date(checkInTime)
        : attendance?.checkInTime || null;

  const effectiveCheckOut =
    checkOutTime === null
      ? null
      : checkOutTime !== undefined
        ? new Date(checkOutTime)
        : attendance?.checkOutTime || null;

  const oldDeduction = attendance?.flexiHoursDeducted || 0;
  const classIdForCalc = payload.classId || attendance?.classId || null;
  let flexiHoursDelta = 0;

  if (effectiveCheckIn && effectiveCheckOut) {
    const flexiResult = await computeFlexiRecomputeFields({
      studentId: student._id,
      attendanceDateKey: normalizedDate.attendanceDateKey,
      checkInTime: effectiveCheckIn,
      checkOutTime: effectiveCheckOut,
      classIdForCalc,
      excludeRecordId: attendance?._id,
    });

    payload.stayMinutes = flexiResult.stayMinutes;
    payload.scheduledMinutes = flexiResult.scheduledMinutes;
    payload.extraMinutes = flexiResult.extraMinutes;
    payload.flexiHoursDeducted = flexiResult.flexiHoursDeducted;
    payload.checkoutSource = "manual";

    flexiHoursDelta = flexiResult.flexiHoursDeducted - oldDeduction;
  } else if (attendance) {
    // Window incomplete on an existing record (e.g. only check-in was
    // cleared/updated) — clear any stale computed values so old numbers
    // don't linger, and reverse whatever deduction was previously applied.
    unsetFields.stayMinutes = "";
    unsetFields.scheduledMinutes = "";
    unsetFields.extraMinutes = "";
    payload.flexiHoursDeducted = 0;
    flexiHoursDelta = 0 - oldDeduction;
  }

  // Prepaid Flexi Card routing: if this record's class is a prepaid-card
  // enrollment, the deduction/reversal goes to that card's own ledger
  // instead of the legacy global Student pool — reversing this record's
  // own previous deduction (on whichever purchase it was originally
  // charged to) before applying the fresh one, same idempotent-edit
  // guarantee as the legacy path. Returns null for ordinary HOURS_BASED
  // classes, in which case behavior below is completely unchanged.
  let cardResult = null;
  if (classIdForCalc) {
    cardResult = await flexiCardService.syncAttendanceDeduction(
      student._id,
      classIdForCalc,
      payload.flexiHoursDeducted || 0,
      attendance?.flexiCardPurchaseId || null,
      oldDeduction,
    );
  }
  if (cardResult) {
    payload.flexiCardPurchaseId = cardResult.purchaseId;
    payload.flexiHoursDeducted = cardResult.hoursDeducted;
    flexiHoursDelta = 0; // absorbed by the card ledger, not the legacy pool
  } else {
    payload.flexiCardPurchaseId = null;
  }

  const action = attendance ? "updated" : "created";

  if (attendance) {
    const updateOps = { $set: payload };
    if (Object.keys(unsetFields).length > 0) {
      updateOps.$unset = unsetFields;
    }

    attendance = await Attendance.findByIdAndUpdate(attendance._id, updateOps, {
      new: true,
      runValidators: true,
    });
  } else {
    // On create, an explicit null for checkInTime just means "use the
    // schema default (now)" — payload simply won't have the key set above,
    // so Attendance.create() naturally applies the model's default.
    attendance = await Attendance.create(payload);
  }

  // Apply only the net change to the student's flexi balance — safe to run
  // on every manual mark/re-mark since we always reversed this record's own
  // prior deduction above first.
  if (flexiHoursDelta !== 0) {
    await Student.findByIdAndUpdate(
      student._id,
      { $inc: { consumedFlexiHours: flexiHoursDelta } },
      { strict: false },
    );
  }

  const populatedAttendance = await enrichAttendanceQuery(
    Attendance.findById(attendance._id),
  );

  if (student.parentUserId) {
    NotificationService.sendAttendanceNotification(
      student._id,
      student.parentUserId,
      status,
      normalizedDate.attendanceDateKey,
      `${student.firstName} ${student.lastName}`,
    ).catch((err) =>
      logger.error(
        `[Notification Failed] Manual Mark Attendance for student ${student._id}: ${err.message}`,
      ),
    );
  }

  return {
    action,
    attendance: populatedAttendance,
  };
};

exports.getAttendanceList = async (filters, user) => {
  const {
    date,
    dateFrom,
    dateTo,
    status,
    classId,
    className,
    section,
    sessionLabel,
    sessionId,
    studentId,
    page = 1,
    limit = 20,
  } = filters;

  const query = {};

  if (date) {
    query.attendanceDateKey = date;
  }

  if (dateFrom || dateTo) {
    query.attendanceDateKey = {};
    if (dateFrom) query.attendanceDateKey.$gte = dateFrom;
    if (dateTo) query.attendanceDateKey.$lte = dateTo;
  }

  if (status) query.status = status;
  if (classId) query.classId = classId;
  if (className) query.className = className;
  if (section) query.section = section;
  if (sessionLabel) query.sessionLabel = sessionLabel;
  if (sessionId) query.sessionId = sessionId;

  if (studentId) {
    const student = await findStudentByIdOrAdmissionNo(studentId);

    if (!student) {
      throw new ErrorResponse("Student not found", 404);
    }

    if (user.role === "parent") {
      await assertParentHasStudentAccess(user._id, student._id);
    }

    query.studentId = student._id;
  }

  if (user.role === "parent" && !studentId) {
    const parent = await Parent.findOne({ userId: user._id });

    if (!parent) {
      throw new ErrorResponse("Parent account not found", 404);
    }

    query.studentId = { $in: parent.children };
  }

  if (user.role === "teacher") {
    Object.assign(query, await getTeacherScopedAttendanceFilter(user));
  }

  const pageNum = parseInt(page, 10);
  const limitNum = parseInt(limit, 10);

  const total = await Attendance.countDocuments(query);

  const data = await enrichAttendanceQuery(
    Attendance.find(query)
      .sort({ attendanceDateKey: -1, markedAt: -1 })
      .skip((pageNum - 1) * limitNum)
      .limit(limitNum),
  );

  return {
    total,
    page: pageNum,
    pages: Math.ceil(total / limitNum),
    count: data.length,
    data,
  };
};

exports.getStudentAttendance = async (studentIdParam, filters, user) => {
  const student = await findStudentByIdOrAdmissionNo(studentIdParam);

  if (!student) {
    throw new ErrorResponse("Student not found", 404);
  }

  await assertUserCanAccessStudent(user, student);

  const query = { studentId: student._id };

  if (filters.dateFrom || filters.dateTo) {
    query.attendanceDateKey = {};
    if (filters.dateFrom) query.attendanceDateKey.$gte = filters.dateFrom;
    if (filters.dateTo) query.attendanceDateKey.$lte = filters.dateTo;
  }

  const records = await enrichAttendanceQuery(
    Attendance.find(query).sort({ attendanceDateKey: -1, markedAt: -1 }),
  );

  const summary = records.reduce(
    (acc, record) => {
      acc.total += 1;
      acc[record.status] = (acc[record.status] || 0) + 1;
      return acc;
    },
    { total: 0, Present: 0, Absent: 0, Late: 0, Leave: 0 },
  );

  return {
    student: {
      id: student._id,
      admissionNo: student.admissionNo,
      fullName: `${student.firstName} ${student.lastName}`.trim(),
      className: student.className,
      section: student.section,
      qrCode: student.qrCode,
    },
    summary,
    count: records.length,
    data: records,
  };
};

exports.getDailySummary = async (date, user) => {
  const dateKey = date || normalizeAttendanceDate().attendanceDateKey;
  const match = { attendanceDateKey: dateKey };

  if (user.role === "parent") {
    throw new ErrorResponse(
      `User role '${user.role}' is not authorized to access this route`,
      403,
    );
  }

  if (user.role === "teacher") {
    Object.assign(match, await getTeacherScopedAttendanceFilter(user));
  }

  const counts = await Attendance.aggregate([
    { $match: match },
    { $group: { _id: "$status", count: { $sum: 1 } } },
  ]);

  const classWise = await Attendance.aggregate([
    { $match: match },
    {
      $group: {
        _id: { className: "$className", section: "$section" },
        total: { $sum: 1 },
        present: { $sum: { $cond: [{ $eq: ["$status", "Present"] }, 1, 0] } },
        absent: { $sum: { $cond: [{ $eq: ["$status", "Absent"] }, 1, 0] } },
        late: { $sum: { $cond: [{ $eq: ["$status", "Late"] }, 1, 0] } },
        leave: { $sum: { $cond: [{ $eq: ["$status", "Leave"] }, 1, 0] } },
      },
    },
    {
      $project: {
        _id: 0,
        className: "$_id.className",
        section: "$_id.section",
        total: 1,
        present: 1,
        absent: 1,
        late: 1,
        leave: 1,
      },
    },
    { $sort: { className: 1, section: 1 } },
  ]);

  const summary = { date: dateKey, total: 0, Present: 0, Absent: 0, Late: 0, Leave: 0 };

  counts.forEach((item) => {
    summary[item._id] = item.count;
    summary.total += item.count;
  });

  return { summary, classWise };
};

exports.updateAttendance = async (idParam, updateData, user) => {
  const attendance = await Attendance.findById(idParam);

  if (!attendance) {
    throw new ErrorResponse("Attendance record not found", 404);
  }

  const student = await Student.findById(attendance.studentId);

  if (!student) {
    throw new ErrorResponse("Linked student not found", 404);
  }

  // NOTE: admin/sub-admin already pass through here with full access
  // regardless of who originally marked the record (assertUserCanAccessStudent
  // has no markedBy/markedByRole restriction) — so overwriting a
  // teacher-marked or QR-marked record was already allowed before this
  // change. What was missing was (a) flexi-hours staying in sync on repeat
  // edits and (b) a visible trail of who edited what and when — both added
  // below.
  const access = await assertUserCanAccessStudent(user, student, {
    requireMarkPermission: true,
  });

  const nextDate = updateData.attendanceDate
    ? normalizeAttendanceDate(updateData.attendanceDate)
    : {
        attendanceDate: attendance.attendanceDate,
        attendanceDateKey: attendance.attendanceDateKey,
      };

  const nextSession = updateData.sessionLabel || attendance.sessionLabel;

  const duplicate = await Attendance.findOne({
    _id: { $ne: attendance._id },
    studentId: student._id,
    attendanceDateKey: nextDate.attendanceDateKey,
    sessionLabel: nextSession,
  });

  if (duplicate) {
    throw new ErrorResponse(
      "Attendance already exists for this student, date, and session",
      400,
    );
  }

  const payload = buildAttendancePayload({
    student,
    classContext: access.classContext,
    normalizedDate: nextDate,
    status: updateData.status || attendance.status,
    method: updateData.method || attendance.method,
    remarks:
      updateData.remarks !== undefined ? updateData.remarks : attendance.remarks,
    sessionLabel: nextSession,
    user,
    teacher: access.teacher,
  });

  // STEP 2d: Handle null checkInTime/checkOutTime clearing
  const setFields = {};
  const unsetFields = {};

  // Copy all payload fields to setFields
  Object.assign(setFields, payload);

  // Handle checkInTime
  if (updateData.checkInTime === null) {
    delete setFields.checkInTime;
    unsetFields.checkInTime = "";
  } else if (updateData.checkInTime !== undefined) {
    setFields.checkInTime = updateData.checkInTime;
  }

  // Handle checkOutTime
  if (updateData.checkOutTime === null) {
    delete setFields.checkOutTime;
    unsetFields.checkOutTime = "";
  } else if (updateData.checkOutTime !== undefined) {
    setFields.checkOutTime = updateData.checkOutTime;
    setFields.checkoutSource = "manual";
  }

  // =========================================================================
  // FLEXI-HOURS RECOMPUTE ON EDIT (idempotent)
  // =========================================================================
  // Only re-run the deduction math when THIS edit actually touches
  // checkInTime/checkOutTime — editing just the status/remarks shouldn't
  // silently strip a center-session-verified checkoutSource or re-bill
  // anything. When times ARE touched, this is safe to run on every single
  // edit (1st, 2nd, 10th...) because we always reverse the record's own
  // previously-stored flexiHoursDeducted before applying the freshly
  // computed one — net effect on Student.consumedFlexiHours is always just
  // the delta, so repeat edits/corrections can never double-deduct.
  //
  // Scope note: this now matches centerCheckOut's approach — idle time is
  // computed against ALL of the student's "Present" sessions for that
  // calendar day (fetched fresh below), not just this one record's own
  // class. So if a student has Morning + Afternoon classes, editing the
  // Morning record's checkOutTime will correctly net out time spent in the
  // Afternoon class too, instead of flagging it as idle.
  const timesTouched =
    updateData.checkInTime !== undefined ||
    updateData.checkOutTime !== undefined;

  let flexiHoursDelta = 0;

  if (timesTouched) {
    const effectiveCheckIn =
      updateData.checkInTime === null
        ? null
        : updateData.checkInTime !== undefined
          ? new Date(updateData.checkInTime)
          : attendance.checkInTime || null;

    const effectiveCheckOut =
      updateData.checkOutTime === null
        ? null
        : updateData.checkOutTime !== undefined
          ? new Date(updateData.checkOutTime)
          : attendance.checkOutTime || null;

    const oldDeduction = attendance.flexiHoursDeducted || 0;
    // scheduledMinutes stays specific to THIS record's own class (display
    // field only — "how long was this particular class supposed to run"),
    // separate from the full-day idle-time math inside the helper.
    const classIdForCalc = payload.classId || attendance.classId || null;
    let newDeduction = 0;

    if (effectiveCheckIn && effectiveCheckOut) {
      const flexiResult = await computeFlexiRecomputeFields({
        studentId: student._id,
        attendanceDateKey: nextDate.attendanceDateKey,
        checkInTime: effectiveCheckIn,
        checkOutTime: effectiveCheckOut,
        classIdForCalc,
        excludeRecordId: attendance._id,
      });

      newDeduction = flexiResult.flexiHoursDeducted;

      setFields.stayMinutes = flexiResult.stayMinutes;
      setFields.scheduledMinutes = flexiResult.scheduledMinutes;
      setFields.extraMinutes = flexiResult.extraMinutes;
      setFields.flexiHoursDeducted = newDeduction;
      setFields.checkoutSource = "manual";
    } else {
      // Window is incomplete (check-in or check-out missing) — nothing to
      // bill; clear any previously computed values so stale numbers don't
      // linger on the record.
      unsetFields.stayMinutes = "";
      unsetFields.scheduledMinutes = "";
      unsetFields.extraMinutes = "";
      setFields.flexiHoursDeducted = 0;
      setFields.checkoutSource = null;
    }

    // Prepaid Flexi Card routing — see manualMarkAttendance for the full
    // rationale. Reverses this record's own previous deduction on whichever
    // purchase it was originally charged to, then applies the fresh amount.
    // Returns null for ordinary HOURS_BASED classes (legacy path below
    // stays completely unchanged in that case).
    let cardResult = null;
    if (classIdForCalc) {
      cardResult = await flexiCardService.syncAttendanceDeduction(
        student._id,
        classIdForCalc,
        newDeduction,
        attendance.flexiCardPurchaseId || null,
        oldDeduction,
      );
    }
    if (cardResult) {
      setFields.flexiCardPurchaseId = cardResult.purchaseId;
      setFields.flexiHoursDeducted = cardResult.hoursDeducted;
      newDeduction = cardResult.hoursDeducted;
    } else {
      setFields.flexiCardPurchaseId = null;
    }

    flexiHoursDelta = cardResult ? 0 : newDeduction - oldDeduction;
  }

  // =========================================================================
  // EDIT HISTORY (audit trail) — same shape as Enquiry.auditTrail
  // =========================================================================
  const trackedFields = [
    "status",
    "sessionLabel",
    "attendanceDate",
    "remarks",
    "checkInTime",
    "checkOutTime",
    "method",
    "markedBy",
    "markedByRole",
  ];

  const afterPreview = { ...attendance.toObject(), ...setFields };
  ["checkInTime", "checkOutTime"].forEach((field) => {
    if (unsetFields[field] !== undefined) afterPreview[field] = null;
  });

  const stringify = (v) => {
    if (v === undefined || v === null) return null;
    if (v instanceof Date) return v.toISOString();
    if (v && typeof v === "object" && v.toString) return v.toString();
    return v;
  };

  const beforeValues = {};
  const afterValues = {};
  const changedFields = [];

  trackedFields.forEach((field) => {
    const before = stringify(attendance[field]);
    const after = stringify(afterPreview[field]);
    if (before !== after) {
      changedFields.push(field);
      beforeValues[field] = before;
      afterValues[field] = after;
    }
  });

  const updateOps = {};
  if (Object.keys(setFields).length > 0) {
    updateOps.$set = setFields;
  }
  if (Object.keys(unsetFields).length > 0) {
    updateOps.$unset = unsetFields;
  }
  if (changedFields.length > 0) {
    updateOps.$push = {
      editHistory: {
        editedBy: user._id,
        editedByRole: user.role,
        editedAt: new Date(),
        changedFields,
        beforeValues,
        afterValues,
        note:
          (updateData.note || "").trim() ||
          `Updated by ${user.name || user.email || user.role}`,
      },
    };
  }

  const updatedAttendance = await Attendance.findByIdAndUpdate(
    attendance._id,
    updateOps,
    { new: true, runValidators: true },
  );

  // Apply only the net change — since we always reversed the record's own
  // prior deduction above before computing the fresh one, this single delta
  // keeps Student.consumedFlexiHours correct no matter how many times this
  // record gets edited.
  if (flexiHoursDelta !== 0) {
    await Student.findByIdAndUpdate(
      student._id,
      { $inc: { consumedFlexiHours: flexiHoursDelta } },
      { strict: false },
    );
  }

  return enrichAttendanceQuery(Attendance.findById(updatedAttendance._id));
};

// =========================================================================
// FEATURE: SESSION-BASED CENTER ATTENDANCE & FLEXI HOURS DEDUCTION (GATE)
// =========================================================================

const parseClassTime = (timeStr, baseDateIST) => {
  const [h, m] = timeStr.split(":").map(Number);
  const d = new Date(baseDateIST);
  d.setHours(h, m, 0, 0);
  return d;
};

// Uses Intl.DateTimeFormat (not the `new Date(toLocaleString(...))` re-parse
// pattern) — that pattern depends on the JS engine's locale/ICU data to
// round-trip correctly and has previously caused wrong-day bugs elsewhere
// in this codebase (birthday/holiday modules).
const getCurrentISTTime = () => {
  const formatter = new Intl.DateTimeFormat("en-GB", {
    timeZone: "Asia/Kolkata",
    hourCycle: "h23",
    hour: "2-digit",
    minute: "2-digit",
  });
  const parts = formatter.formatToParts(new Date());
  const hour = parts.find((part) => part.type === "hour")?.value;
  const minute = parts.find((part) => part.type === "minute")?.value;
  return `${hour}:${minute}`;
};

const getISTDateKey = () => getDateKeyFromParts(new Date());

// Build a real Date (UTC instant) for the given "HH:MM" wall-clock time on the
// IST calendar day of `refDate`. Using Date#setHours here would apply the
// *server's* local timezone instead of IST, which is wrong whenever the
// server doesn't run with TZ=Asia/Kolkata.
const buildISTDateTime = (refDate, timeStr) => {
  const dateKey = getDateKeyFromParts(refDate);
  const [h, m] = timeStr.split(":").map(Number);
  const hh = String(h).padStart(2, "0");
  const mm = String(m).padStart(2, "0");
  return new Date(`${dateKey}T${hh}:${mm}:00+05:30`);
};

/**
 * Auto-mark class attendance for a student based on center check-in.
 * Fix: student.classIds are ObjectIds — query Class._id directly.
 */
// Time-of-day bucket a class's start time falls into. The Attendance schema
// only has 4 sessionLabel slots (FULL_DAY/MORNING/AFTERNOON/EVENING) and the
// unique index is (studentId, attendanceDateKey, sessionLabel) — used by the
// teacher QR-scan/manual-mark flows as "one record per session per day".
// Auto-marking used to hardcode sessionLabel:'FULL_DAY' for every class,
// which meant a student in 2 classes on the same day collided on that index:
// the 2nd class's Attendance.create() threw E11000 and was silently dropped
// (see the catch block below). Bucketing by time-of-day lets classes at
// different times of day coexist as separate records without touching the
// shared index/schema used by the other attendance flows.
const resolveSessionLabelForTime = (timeStr) => {
  const [hour] = timeStr.split(":").map(Number);
  if (hour < 12) return "MORNING";
  if (hour < 17) return "AFTERNOON";
  return "EVENING";
};

const timeStrToMinutes = (timeStr) => {
  const [h, m] = timeStr.split(":").map(Number);
  return h * 60 + m;
};

// Correct overlap check — unlike class.service.js's timingsOverlap, this
// doesn't fall back to `false` for a 00:00 start time (0 is falsy in JS,
// which silently disables the check for any midnight-start class there).
const timeRangesOverlap = (startA, endA, startB, endB) =>
  timeStrToMinutes(startA) < timeStrToMinutes(endB) &&
  timeStrToMinutes(startB) < timeStrToMinutes(endA);

const autoMarkClassAttendance = async (student, dateKey, systemUserId) => {
  if (!student.classIds || student.classIds.length === 0) return [];

  const now = new Date();
  const todayDay = new Intl.DateTimeFormat("en-US", {
    timeZone: "Asia/Kolkata",
    weekday: "short",
  })
    .format(now)
    .toUpperCase();
  const currentTimeStr = getCurrentISTTime();

  // Fix: query by _id (ObjectId) — no more dual classId/string lookup
  const enrolledClasses = await Class.find({
    _id: { $in: student.classIds },
    status: "Active",
    classType: { $in: ["FIXED_TIME", "FLEX_TIME"] },
  }).lean();

  // Resolve each enrolled class's effective timing up front (base timing,
  // or the student's FLEX_TIME override) so overlap checks below can look
  // up the timing of a class that was already marked in an earlier cron
  // tick, not just the ones being considered in this pass.
  const resolvedTimings = new Map();
  for (const cls of enrolledClasses) {
    let startTime = cls.startTime;
    let endTime = cls.endTime;
    if (cls.classType === "FLEX_TIME" && student.classTimings) {
      const timing =
        student.classTimings[cls.classId] ||
        student.classTimings[String(cls._id)];
      if (timing?.startTime) startTime = timing.startTime;
      if (timing?.endTime) endTime = timing.endTime;
    }
    resolvedTimings.set(String(cls._id), { startTime, endTime });
  }

  const todaysPresentClasses = await Attendance.find({
    studentId: student._id,
    attendanceDateKey: dateKey,
    status: "Present",
    classId: { $ne: null },
  })
    .select("classId")
    .lean();

  const overlapsAlreadyMarkedClass = (classId, startTime, endTime) =>
    todaysPresentClasses.some((rec) => {
      if (String(rec.classId) === String(classId)) return false;
      const timing = resolvedTimings.get(String(rec.classId));
      if (!timing?.startTime || !timing?.endTime) return false;
      return timeRangesOverlap(startTime, endTime, timing.startTime, timing.endTime);
    });

  const marked = [];
  const sessionId = await academicSessionService.getCurrentActiveSessionId();

  for (const cls of enrolledClasses) {
    if (cls.days && cls.days.length > 0 && !cls.days.includes(todayDay))
      continue;

    const { startTime, endTime } = resolvedTimings.get(String(cls._id)) || {};
    if (!startTime || !endTime) continue;

    const isRunning = currentTimeStr >= startTime && currentTimeStr < endTime;
    if (!isRunning) continue;

    const existing = await Attendance.findOne({
      studentId: student._id,
      classId: cls._id,
      attendanceDateKey: dateKey,
    });

    if (existing) continue;

    if (overlapsAlreadyMarkedClass(cls._id, startTime, endTime)) {
      logger.warn(
        `[AUTO-ATT] Skipped ${student.admissionNo} for ${cls.name} (${dateKey}) — timing overlaps a class already marked Present today.`,
      );
      continue;
    }

    const normalizedDate = normalizeAttendanceDate(dateKey);
    const payload = {
      studentId: student._id,
      studentAdmissionNo: student.admissionNo,
      studentName: `${student.firstName} ${student.lastName}`.trim(),
      qrCode: student.qrCode || "",
      classId: cls._id,
      classCode: cls.classId || "",
      className: cls.name || "",
      section: cls.section || "",
      attendanceDate: normalizedDate.attendanceDate,
      attendanceDateKey: dateKey,
      sessionLabel: resolveSessionLabelForTime(startTime),
      status: "Present",
      method: "system",
      remarks: "Auto-marked on center check-in",
      markedBy: systemUserId,
      markedByRole: "system",
      checkInTime: now,
      sessionId,
    };

    try {
      await Attendance.create(payload);
      marked.push({
        classId: cls._id,
        className: cls.name,
        startTime,
        endTime,
      });
      logger.info(
        `[AUTO-ATT] Marked Present: ${student.admissionNo} | ${cls.name} | ${dateKey}`,
      );
    } catch (err) {
      if (err.code === 11000) {
        logger.warn(
          `[AUTO-ATT] Duplicate-key collision marking ${student.admissionNo} in ${cls.name} (${dateKey}, session ${resolveSessionLabelForTime(startTime)}) — another class in the same session bucket was already marked today, so this class's attendance was NOT recorded.`,
        );
      } else {
        logger.error(
          `[AUTO-ATT] Failed to mark ${student.admissionNo} in ${cls.name}: ${err.message}`,
        );
      }
    }
  }

  return marked;
};

// STEP 1A+C: Fixed - removed method: "system" filter, now works for all Present records
const autoCloseClassAttendance = async (dateKey) => {
  const currentTimeStr = getCurrentISTTime();

  const activeRecords = await Attendance.find({
    attendanceDateKey: dateKey,
    status: "Present",
    checkOutTime: { $exists: false },
  }).populate("classId", "endTime startTime");

  let closed = 0;

  for (const record of activeRecords) {
    // STEP 1D: Skip records without classId (center-level records handled separately)
    if (!record.classId?.endTime) continue;
    if (currentTimeStr >= record.classId.endTime) {
      const endDate = buildISTDateTime(new Date(), record.classId.endTime);

      await Attendance.findByIdAndUpdate(record._id, {
        checkOutTime: endDate,
        isAutoCheckedOut: true,
        checkoutSource: "cron_auto",
      });
      closed++;
    }
  }

  if (closed > 0) {
    logger.info(
      `[AUTO-ATT] Auto-closed checkOutTime for ${closed} class records on ${dateKey}`,
    );
  }
  return closed;
};

exports.autoMarkClassAttendance = autoMarkClassAttendance;
exports.autoCloseClassAttendance = autoCloseClassAttendance;
exports.getISTDateKey = getISTDateKey;

exports.centerCheckIn = async (body, user) => {
  const { qrCode, studentId } = body;

  let student;
  if (qrCode) {
    student = await Student.findOne({ qrCode: qrCode.trim() });
  } else if (studentId) {
    student = await findStudentByIdOrAdmissionNo(studentId.trim());
  }

  if (!student) {
    throw new ErrorResponse("Student not found or invalid QR", 404);
  }

  ensureStudentIsActive(student);

  const dateKey = getISTDateKey();

  const existingSession = await CenterSession.findOne({
    studentId: student._id,
    dateKey: dateKey,
    status: "ACTIVE",
  });

  if (existingSession) {
    throw new ErrorResponse(
      "Student is already checked in at the center.",
      400,
    );
  }

  const session = await CenterSession.create({
    studentId: student._id,
    dateKey: dateKey,
    inTime: new Date(),
    status: "ACTIVE",
  });

  const fullStudent = await Student.findById(student._id)
    .select(
      "classIds classTimings firstName lastName admissionNo qrCode parentUserId",
    )
    .lean();

  const markedClasses = await autoMarkClassAttendance(
    fullStudent,
    dateKey,
    user._id,
  );

  if (student.parentUserId) {
    const studentName = `${student.firstName} ${student.lastName}`.trim();
    const classNames = markedClasses.map((c) => c.className).join(", ");
    const classMsg =
      markedClasses.length > 0
        ? ` Auto-marked Present in: ${classNames}.`
        : "";

    NotificationService.notifyUser(
      student.parentUserId,
      `✅ ${studentName} reached school`,
      `${studentName} has checked in at ${new Date().toLocaleTimeString("en-IN", { timeZone: "Asia/Kolkata" })}.${classMsg}`,
      { type: "center_checkin", studentId: student._id.toString() },
    ).catch((err) =>
      logger.error("Failed to send check-in notification:", err),
    );
  }

  return {
    message: "Center Check-In successful",
    session,
    autoMarkedClasses: markedClasses,
    student: {
      name: `${student.firstName} ${student.lastName}`.trim(),
      admissionNo: student.admissionNo,
    },
  };
};

exports.centerCheckOut = async (body, user) => {
  const { qrCode, studentId } = body;

  let student;
  if (qrCode) {
    student = await Student.findOne({ qrCode: qrCode.trim() });
  } else if (studentId) {
    student = await findStudentByIdOrAdmissionNo(studentId.trim());
  }

  if (!student) {
    throw new ErrorResponse("Student not found or invalid QR", 404);
  }

  const dateKey = getISTDateKey();

  const session = await CenterSession.findOne({
    studentId: student._id,
    status: "ACTIVE",
    dateKey: { $lte: dateKey },
  });

  if (!session) {
    throw new ErrorResponse(
      "No active Center Check-In session found for this student",
      404,
    );
  }

  session.outTime = new Date();
  session.status = "COMPLETED";

  const sessionStart = session.inTime.getTime();
  const sessionEnd = session.outTime.getTime();
  const totalStayMinutes = (sessionEnd - sessionStart) / 60000;
  session.totalStayMinutes = Math.floor(totalStayMinutes);

  const todayAttendances = await Attendance.find({
    studentId: student._id,
    attendanceDateKey: session.dateKey,
    status: "Present",
  }).populate("classId");

  let classMinutesInSession = 0;

  for (const att of todayAttendances) {
    if (att.classId && att.classId.startTime && att.classId.endTime) {
      const cStartDt = buildISTDateTime(session.inTime, att.classId.startTime);
      const cEndDt = buildISTDateTime(session.inTime, att.classId.endTime);

      const overlapStart = Math.max(sessionStart, cStartDt.getTime());
      const overlapEnd = Math.min(sessionEnd, cEndDt.getTime());

      if (overlapStart < overlapEnd) {
        classMinutesInSession += (overlapEnd - overlapStart) / 60000;
      }
    }
  }

  const idleMinutes = Math.max(
    0,
    session.totalStayMinutes - classMinutesInSession,
  );

  // GRACE_PERIOD_MINS now comes from the shared module-level constant
  // (see top of file) so this stays in sync with the manual-edit recompute.
  let deductedHours = 0;

  if (idleMinutes > GRACE_PERIOD_MINS) {
    deductedHours = parseFloat((idleMinutes / 60).toFixed(2));
    session.deductedFlexiHours = deductedHours;
    session.notes = `Idle time: ${Math.floor(idleMinutes)} mins. Deducted: ${deductedHours} hrs.`;

    // Prepaid Flexi Card routing — see autoCloseMissedCenterSessions for
    // the full rationale. Only attributed to a card when exactly one
    // HOURS_BASED class was attended that day; otherwise the legacy
    // global pool is used, unchanged.
    const hoursBasedClassIds = [
      ...new Set(
        todayAttendances
          .filter((att) => att.classId && att.classId.classType === "HOURS_BASED")
          .map((att) => String(att.classId._id)),
      ),
    ];

    let cardResult = null;
    if (hoursBasedClassIds.length === 1) {
      cardResult = await flexiCardService.syncAttendanceDeduction(
        student._id,
        hoursBasedClassIds[0],
        deductedHours,
        null,
        0,
      );
    }

    if (!cardResult) {
      await Student.findByIdAndUpdate(
        student._id,
        { $inc: { consumedFlexiHours: deductedHours } },
        { strict: false },
      );
    }

    if (student.parentUserId) {
      const studentName = student.firstName || "Your child";
      const title = `🏫 Update regarding ${studentName}'s Hourly Billing`;
      const body = `Hello! ${studentName} spent some extra time (${Math.floor(idleMinutes)} mins) safely at the center today after classes. As per our extended care policy, ${deductedHours} flexi-hours have been adjusted from your account. Have a great day!`;

      NotificationService.notifyUser(student.parentUserId, title, body, {
        type: "flexi_hours_deduction",
        studentId: student._id.toString(),
        deductedHours: deductedHours.toString(),
        idleMinutes: Math.floor(idleMinutes).toString(),
      }).catch((err) =>
        logger.error(
          "Failed to send flexi hours deduction notification:",
          err,
        ),
      );
    }
  } else {
    session.notes = `Idle time: ${Math.floor(idleMinutes)} mins (Within grace period).`;
  }

  // STEP 2b: Sync computed data onto Attendance records
  // Manual entries intentionally do NOT get these computed values - only center_session verified data
  let syncedAttendanceCount = 0;
  try {
    const updatePayload = {
      checkOutTime: session.outTime,
      stayMinutes: Math.floor(session.totalStayMinutes),
      extraMinutes: Math.floor(idleMinutes),
      flexiHoursDeducted: deductedHours,
      checkoutSource: "center_session",
    };

    // STEP 2b: Compute scheduledMinutes per-record based on each record's classId
    for (const att of todayAttendances) {
      if (!att.checkOutTime && att.classId?.startTime && att.classId?.endTime) {
        const [sHours, sMins] = att.classId.startTime.split(":").map(Number);
        const [eHours, eMins] = att.classId.endTime.split(":").map(Number);
        const scheduledMins = (eHours * 60 + eMins) - (sHours * 60 + sMins);
        updatePayload.scheduledMinutes = scheduledMins;
        await Attendance.findByIdAndUpdate(att._id, updatePayload);
        syncedAttendanceCount++;
      } else if (!att.checkOutTime) {
        // Record without classId - only set basic fields
        await Attendance.findByIdAndUpdate(att._id, {
          checkOutTime: session.outTime,
          stayMinutes: Math.floor(session.totalStayMinutes),
          extraMinutes: Math.floor(idleMinutes),
          flexiHoursDeducted: deductedHours,
          checkoutSource: "center_session",
        });
        syncedAttendanceCount++;
      }
    }
  } catch (syncErr) {
    logger.error(
      `[STEP-2b SYNC-FAILED] centerCheckOut attendance sync for student ${student._id}: ${syncErr.message}`,
    );
  }

  await session.save();

  return {
    message: "Center Check-Out successful",
    session,
    math: {
      totalStayMinutes: Math.floor(session.totalStayMinutes),
      classMinutesInSession: Math.floor(classMinutesInSession),
      idleMinutes: Math.floor(idleMinutes),
      gracePeriodApplied: GRACE_PERIOD_MINS,
      deductedHours,
    },
    syncedAttendanceRecords: syncedAttendanceCount,
  };
};