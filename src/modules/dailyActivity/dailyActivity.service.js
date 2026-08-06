// const mongoose = require('mongoose');
// const DailyActivity = require('./dailyActivity.model');
// const Student = require('../student/student.model');
// const Class = require('../class/class.model');
// const ErrorResponse = require('../../utils/errorResponse');
// const logger = require('../../config/logger');
// const notificationService = require('../notification/notification.service');
// const Parent = require('../shared/parent.model');

// // ─── Helpers ──────────────────────────────────────────────────────────────────

// /**
//  * Get today's date key in YYYY-MM-DD (IST safe)
//  */
// const getTodayKey = () => {
//   const now = new Date();
//   const ist = new Date(now.toLocaleString('en-US', { timeZone: 'Asia/Kolkata' }));
//   const yyyy = ist.getFullYear();
//   const mm   = String(ist.getMonth() + 1).padStart(2, '0');
//   const dd   = String(ist.getDate()).padStart(2, '0');
//   return `${yyyy}-${mm}-${dd}`;
// };

// /**
//  * Notify parent when a health concern is logged
//  */
// const notifyParentHealthConcern = async (studentId, studentName, concerns) => {
//   try {
//     // Find parent linked to this student
//     const student = await Student.findById(studentId).select('parentUserId').lean();
//     if (!student?.parentUserId) return;

//     const concernList  = concerns.join(', ');

//     await notificationService.sendToSingleUser(
//       String(student.parentUserId),
//       '⚠️ Health Concern Alert',
//       `${studentName} has a health concern noted today: ${concernList}. Please check with the teacher.`,
//       { type: 'health_concern', studentId: String(studentId) }
//     );

//     logger.info(`Health concern notification sent for student ${studentId}`);
//   } catch (err) {
//     // Non-blocking — log but don't fail the main request
//     logger.error(`Failed to send health concern notification: ${err.message}`);
//   }
// };

// // ─── Service Methods ──────────────────────────────────────────────────────────

// class DailyActivityService {

//   /**
//    * Teacher creates or updates today's activity report for a student
//    */
//   async upsertActivity(body, user) {
//     const {
//       studentId,
//       classId,
//       activityDate,
//       sleep,
//       food,
//       diaper,
//       mood,
//       activities,
//       healthConcerns,
//       teacherNote,
//     } = body;

//     // ── Validate student exists ──────────────────────────────────────────────
//     const student = await Student.findById(studentId).select('firstName lastName parentUserId classIds status').lean();
//     if (!student) throw new ErrorResponse('Student not found', 404);
//     if (student.status !== 'Active') throw new ErrorResponse('Student is not active', 400);

//     // ── Validate class exists ────────────────────────────────────────────────
//     const cls = await Class.findById(classId).select('name classId status').lean();
//     if (!cls) throw new ErrorResponse('Class not found', 404);

//     // ── Teacher role: can only log for their own classes ─────────────────────
//     // Class model stores teacherId as Teacher._id (ObjectId ref to Teacher collection)
//     // So we find teacher profile first, then verify class is assigned to that teacher
//     if (user.role === 'teacher') {
//       const Teacher = require('../teacher/teacher.model');
//       const ClassModel = require('../class/class.model');

//       const teacher = await Teacher.findOne({ userId: user._id }).select('_id').lean();
//       if (!teacher) throw new ErrorResponse('Teacher profile not found', 403);

//       const assignedClass = await ClassModel.findOne({
//         _id: classId,
//         teacherId: teacher._id,
//       }).select('_id').lean();

//       if (!assignedClass) {
//         throw new ErrorResponse('You are not assigned to this class', 403);
//       }
//     }

//     const dateKey      = activityDate || getTodayKey();
//     const studentName  = `${student.firstName} ${student.lastName}`.trim();
//     const hasHealthConcern = Array.isArray(healthConcerns) && healthConcerns.length > 0;

//     // Check if this is the first time the report is being created today
//     const existingActivity = await DailyActivity.findOne({ studentId, classId, activityDate: dateKey }).select('_id').lean();
//     const isFirstTimeLogging = !existingActivity;

//     // ── Upsert ───────────────────────────────────────────────────────────────
//     const activity = await DailyActivity.findOneAndUpdate(
//       { studentId, classId, activityDate: dateKey },
//       {
//         $set: {
//           markedBy:      user._id,
//           markedByRole:  user.role,
//           studentName,
//           className:     cls.name,
//           sleep:         sleep    || {},
//           food:          food     || {},
//           diaper:        diaper   || {},
//           mood:          mood     || null,
//           activities:    activities    || [],
//           healthConcerns: healthConcerns || [],
//           teacherNote:   teacherNote   || '',
//           parentNotified: hasHealthConcern ? false : undefined, // reset if new concerns
//         },
//       },
//       {
//         new:     true,
//         upsert:  true,
//         setDefaultsOnInsert: true,
//         runValidators: true,
//       }
//     );

//     // ── Notify parent if health concern present ───────────────────────────────
//     if (hasHealthConcern && !activity.parentNotified) {
//       await notifyParentHealthConcern(studentId, studentName, healthConcerns);
//       // Mark notified
//       await DailyActivity.findByIdAndUpdate(activity._id, { parentNotified: true });
//     }

//     // ── Notify parent for Daily Report (First time only) ──────────────────────
//     if (isFirstTimeLogging && student.parentUserId) {
//       try {
//         await notificationService.sendToSingleUser(
//           String(student.parentUserId),
//           '📝 Daily Report Added',
//           `Teacher has added today's activity report for ${studentName}.`,
//           { type: 'daily_report', studentId: String(studentId), date: dateKey }
//         );
//       } catch (err) {
//         logger.error(`Failed to send daily report notification: ${err.message}`);
//       }
//     }

//     logger.info(`Daily activity upserted for student ${studentId} on ${dateKey} by ${user._id}`);
//     return activity;
//   }

//   /**
//    * Get activity report for a single student on a specific date
//    * Accessible by: admin, sub-admin, teacher (own class), parent (own child)
//    */
//   async getStudentActivity(studentId, date, user) {
//     const dateKey = date || getTodayKey();

//     // Parent can only see their own child
//     if (user.role === 'parent') {
//       const Parent = require('../shared/parent.model');
//       const parentDoc = await Parent.findOne({ userId: user._id }).select('children').lean();
//       if (!parentDoc) throw new ErrorResponse('Parent profile not found', 403);

//       const isOwn = parentDoc.children.map(String).includes(String(studentId));
//       if (!isOwn) throw new ErrorResponse('Access denied', 403);
//     }

//     const activities = await DailyActivity.find({ studentId, activityDate: dateKey })
//       .populate('classId', 'name classId classType')
//       .populate('markedBy', 'name role')
//       .lean();

//     return activities;
//   }

//   /**
//    * Get all activities for a class on a specific date
//    * Accessible by: admin, sub-admin, teacher (own class)
//    */
//   async getClassActivities(classId, date, user) {
//     const dateKey = date || getTodayKey();

//     const cls = await Class.findById(classId).select('name classId').lean();
//     if (!cls) throw new ErrorResponse('Class not found', 404);

//     // Teacher can only see own class
//     if (user.role === 'teacher') {
//       const Teacher = require('../teacher/teacher.model');
//       const teacher = await Teacher.findOne({ userId: user._id }).select('_id').lean();
//       if (!teacher) throw new ErrorResponse('Teacher profile not found', 403);

//       const assignedClass = await Class.findOne({
//         _id: classId,
//         teacherId: teacher._id,
//       }).select('_id').lean();

//       if (!assignedClass) {
//         throw new ErrorResponse('Access denied to this class', 403);
//       }
//     }

//     const activities = await DailyActivity.find({ classId, activityDate: dateKey })
//       .populate('studentId', 'firstName lastName admissionNo photo')
//       .populate('markedBy', 'name role')
//       .sort({ studentName: 1 })
//       .lean();

//     // Build summary
//     const total    = activities.length;
//     const withNote = activities.filter((a) => a.teacherNote).length;
//     const healthAlerts = activities.filter((a) => a.healthConcerns?.length > 0).length;

//     return {
//       class: cls,
//       date:  dateKey,
//       summary: { total, withNote, healthAlerts },
//       activities,
//     };
//   }

//   /**
//    * Get activity history for a student (paginated, date range)
//    * Accessible by: admin, sub-admin, teacher, parent (own child)
//    */
//   async getStudentHistory(studentId, query, user) {
//     const { startDate, endDate, page = 1, limit = 30 } = query;

//     // Parent check
//     if (user.role === 'parent') {
//       const parentDoc = await Parent.findOne({ userId: user._id }).select('children').lean();
//       if (!parentDoc) throw new ErrorResponse('Parent profile not found', 403);
//       const isOwn = parentDoc.children.map(String).includes(String(studentId));
//       if (!isOwn) throw new ErrorResponse('Access denied', 403);
//     }

//     const filter = { studentId };
//     if (startDate || endDate) {
//       filter.activityDate = {};
//       if (startDate) filter.activityDate.$gte = startDate;
//       if (endDate)   filter.activityDate.$lte = endDate;
//     }

//     const skip  = (Number(page) - 1) * Number(limit);
//     const total = await DailyActivity.countDocuments(filter);

//     const activities = await DailyActivity.find(filter)
//       .populate('classId', 'name classId')
//       .populate('markedBy', 'name role')
//       .sort({ activityDate: -1 })
//       .skip(skip)
//       .limit(Number(limit))
//       .lean();

//     return {
//       total,
//       page:  Number(page),
//       pages: Math.ceil(total / Number(limit)),
//       count: activities.length,
//       data:  activities,
//     };
//   }

//   /**
//    * Admin: Get daily summary across all classes for a date
//    */
//   async getDailySummary(date) {
//     const dateKey = date || getTodayKey();

//     const summary = await DailyActivity.aggregate([
//       { $match: { activityDate: dateKey } },
//       {
//         $group: {
//           _id:           '$classId',
//           className:     { $first: '$className' },
//           totalReports:  { $sum: 1 },
//           healthAlerts:  {
//             $sum: {
//               $cond: [{ $gt: [{ $size: { $ifNull: ['$healthConcerns', []] } }, 0] }, 1, 0],
//             },
//           },
//           happyKids: {
//             $sum: { $cond: [{ $eq: ['$mood', 'happy'] }, 1, 0] },
//           },
//           unwell: {
//             $sum: { $cond: [{ $eq: ['$mood', 'unwell'] }, 1, 0] },
//           },
//         },
//       },
//       { $sort: { className: 1 } },
//     ]);

//     return { date: dateKey, classes: summary };
//   }

//   /**
//    * Delete an activity report (admin only)
//    */
//   async deleteActivity(activityId) {
//     const activity = await DailyActivity.findByIdAndDelete(activityId);
//     if (!activity) throw new ErrorResponse('Activity report not found', 404);
//     logger.info(`Daily activity ${activityId} deleted`);
//     return activity;
//   }
// }

// module.exports = new DailyActivityService();

//=============================Updated code written in controller file, service file is not changed=============================

const mongoose = require("mongoose");
const DailyActivity = require("./dailyActivity.model");
const Student = require("../student/student.model");
const Class = require("../class/class.model");
const ErrorResponse = require("../../utils/errorResponse");
const logger = require("../../config/logger");
const notificationService = require("../notification/notification.service");
const Parent = require("../shared/parent.model");

// ─── Helpers ──────────────────────────────────────────────────────────────────

/**
 * Get today's date key in YYYY-MM-DD (IST safe)
 */
const getTodayKey = () => {
  const now = new Date();
  const ist = new Date(
    now.toLocaleString("en-US", { timeZone: "Asia/Kolkata" }),
  );
  const yyyy = ist.getFullYear();
  const mm = String(ist.getMonth() + 1).padStart(2, "0");
  const dd = String(ist.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
};

/**
 * Notify parent when a health concern is logged
 */
const notifyParentHealthConcern = async (studentId, studentName, concerns) => {
  try {
    // Find parent linked to this student
    const student = await Student.findById(studentId)
      .select("parentUserId")
      .lean();
    if (!student?.parentUserId) return;

    const concernList = concerns.join(", ");

    await notificationService.notifyUser(
      String(student.parentUserId),
      "⚠️ Health Concern Alert",
      `${studentName} has a health concern noted today: ${concernList}. Please check with the teacher.`,
      { type: "health_concern", studentId: String(studentId) },
    );

    logger.info(`Health concern notification sent for student ${studentId}`);
  } catch (err) {
    // Non-blocking — log but don't fail the main request
    logger.error(`Failed to send health concern notification: ${err.message}`);
  }
};

// ─── Service Methods ──────────────────────────────────────────────────────────

class DailyActivityService {
  /**
   * Teacher creates or updates today's activity report for a student
   */
  async upsertActivity(body, user) {
    const {
      studentId,
      classId,
      activityDate,
      sleep,
      food,
      diaper,
      mood,
      activities,
      healthConcerns,
      teacherNote,
    } = body;

    // ── Validate student exists ──────────────────────────────────────────────
    const student = await Student.findById(studentId)
      .select("firstName lastName parentUserId classIds status")
      .lean();
    if (!student) throw new ErrorResponse("Student not found", 404);
    if (student.status !== "Active")
      throw new ErrorResponse("Student is not active", 400);

    // ── Validate class exists ────────────────────────────────────────────────
    const cls = await Class.findById(classId)
      .select("name classId status")
      .lean();
    if (!cls) throw new ErrorResponse("Class not found", 404);

    // ── Teacher role: can only log for their own classes ─────────────────────
    // Class model stores teacherId as Teacher._id (ObjectId ref to Teacher collection)
    // So we find teacher profile first, then verify class is assigned to that teacher
    if (user.role === "teacher") {
      const Teacher = require("../teacher/teacher.model");
      const ClassModel = require("../class/class.model");

      const teacher = await Teacher.findOne({ userId: user._id })
        .select("_id")
        .lean();
      if (!teacher) throw new ErrorResponse("Teacher profile not found", 403);

      const assignedClass = await ClassModel.findOne({
        _id: classId,
        teacherId: teacher._id,
      })
        .select("_id")
        .lean();

      if (!assignedClass) {
        throw new ErrorResponse("You are not assigned to this class", 403);
      }
    }

    const dateKey = activityDate || getTodayKey();
    const studentName = `${student.firstName} ${student.lastName}`.trim();

    // ── Create new activity record ───────────────────────────────────────────
    // Har baar ek naya record banega, overwrite nahi hoga.
    const newActivityData = {
      studentId,
      classId,
      activityDate: dateKey,
      markedBy: user._id,
      markedByRole: user.role,
      studentName,
      className: cls.name,
      sleep: sleep || { quality: null },
      food: food || { time: null, quantity: null, note: "" },
      diaper: diaper || { status: null, changeTime: null },
      mood: mood || null,
      activities: activities || [],
      healthConcerns: healthConcerns || [],
      teacherNote: teacherNote || "",
    };

    const hasHealthConcern =
      Array.isArray(healthConcerns) && healthConcerns.length > 0;
    if (hasHealthConcern) {
      newActivityData.parentNotified = false; // Notification bhejne ke liye flag
    }

    const activity = await DailyActivity.create(newActivityData);

    // ── Health concern notification ───────────────────────────────────────────
    if (hasHealthConcern && !activity.parentNotified) {
      await notifyParentHealthConcern(studentId, studentName, healthConcerns);
      // Mark as notified in the newly created record
      activity.parentNotified = true;
      await activity.save();
    }

    // ── First time report notification to parent ──────────────────────────────
    if (student.parentUserId) {
      try {
        await notificationService.notifyUser(
          String(student.parentUserId),
          "📝 Daily Report Added",
          `Teacher ne aaj ${studentName} ki activity report add ki hai.`,
          { type: "daily_report", studentId: String(studentId), date: dateKey },
        );
      } catch (err) {
        logger.error(
          `Failed to send daily report notification: ${err.message}`,
        );
      }
    }

    logger.info(
      `New daily activity record created for student ${studentId} on ${dateKey} by ${user._id}`,
    );

    return { activity, isNew: true }; // Ab hamesha 'isNew' true rahega
  }

  /**
   * Get activity report for a single student on a specific date
   * Accessible by: admin, sub-admin, teacher (own class), parent (own child)
   */
  async getStudentActivity(studentId, date, user) {
    const dateKey = date || getTodayKey();

    // Parent can only see their own child
    if (user.role === "parent") {
      const Parent = require("../shared/parent.model");
      const parentDoc = await Parent.findOne({ userId: user._id })
        .select("children")
        .lean();
      if (!parentDoc) throw new ErrorResponse("Parent profile not found", 403);

      const isOwn = parentDoc.children.map(String).includes(String(studentId));
      if (!isOwn) throw new ErrorResponse("Access denied", 403);
    }

    const activities = await DailyActivity.find({
      studentId,
      activityDate: dateKey,
    })
      .populate("classId", "name classId classType")
      .populate("markedBy", "name role")
      .lean();

    return activities;
  }

  /**
   * Get all activities for a class on a specific date
   * Accessible by: admin, sub-admin, teacher (own class)
   * check server....error 19-09-2026....
   */
  async getClassActivities(classId, date, user) {
    const dateKey = date || getTodayKey();

    const cls = await Class.findById(classId).select("name classId").lean();
    if (!cls) throw new ErrorResponse("Class not found", 404);

    // Teacher can only see own class
    if (user.role === "teacher") {
      const Teacher = require("../teacher/teacher.model");
      const teacher = await Teacher.findOne({ userId: user._id })
        .select("_id")
        .lean();
      if (!teacher) throw new ErrorResponse("Teacher profile not found", 403);

      const assignedClass = await Class.findOne({
        _id: classId,
        teacherId: teacher._id,
      })
        .select("_id")
        .lean();

      if (!assignedClass) {
        throw new ErrorResponse("Access denied to this class", 403);
      }
    }

    const activities = await DailyActivity.find({
      classId,
      activityDate: dateKey,
    })
      .populate("studentId", "firstName lastName admissionNo photo")
      .populate("markedBy", "name role")
      .sort({ studentName: 1 })
      .lean();

    // Build summary
    const total = activities.length;
    const withNote = activities.filter((a) => a.teacherNote).length;
    const healthAlerts = activities.filter(
      (a) => a.healthConcerns?.length > 0,
    ).length;

    return {
      class: cls,
      date: dateKey,
      summary: { total, withNote, healthAlerts },
      activities,
    };
  }

  /**
   * Get activity history for a student (paginated, date range)
   * Accessible by: admin, sub-admin, teacher, parent (own child)
   */
  async getStudentHistory(studentId, query, user) {
    const { startDate, endDate, page = 1, limit = 30 } = query;

    // Parent check
    if (user.role === "parent") {
      const parentDoc = await Parent.findOne({ userId: user._id })
        .select("children")
        .lean();
      if (!parentDoc) throw new ErrorResponse("Parent profile not found", 403);
      const isOwn = parentDoc.children.map(String).includes(String(studentId));
      if (!isOwn) throw new ErrorResponse("Access denied", 403);
    }

    // Teacher can only see students from their own classes
    if (user.role === "teacher") {
      const Teacher = require("../teacher/teacher.model");
      const teacher = await Teacher.findOne({ userId: user._id })
        .select("classIds")
        .lean();
      if (!teacher) throw new ErrorResponse("Teacher profile not found", 403);

      const student = await Student.findById(studentId)
        .select("classIds")
        .lean();
      // Ensure student exists before checking access
      if (!student) throw new ErrorResponse("Student not found", 404);

      const hasAccess = student.classIds.some((studentClassId) =>
        teacher.classIds.some((teacherClassId) =>
          teacherClassId.equals(studentClassId),
        ),
      );
      if (!hasAccess)
        throw new ErrorResponse("Access denied to this student's history", 403);
    }

    const filter = { studentId };
    if (startDate || endDate) {
      filter.activityDate = {};
      if (startDate) filter.activityDate.$gte = startDate;
      if (endDate) filter.activityDate.$lte = endDate;
    }

    const skip = (Number(page) - 1) * Number(limit);
    const total = await DailyActivity.countDocuments(filter);

    const activities = await DailyActivity.find(filter)
      .populate("classId", "name classId")
      .populate("markedBy", "name role")
      .sort({ activityDate: -1 })
      .skip(skip)
      .limit(Number(limit))
      .lean();

    return {
      total,
      page: Number(page),
      pages: Math.ceil(total / Number(limit)),
      count: activities.length,
      data: activities,
    };
  }

  /**
   * Get activity history for a teacher (paginated)
   * Accessible by: teacher
   */
  async getTeacherHistory(user, query) {
    const { page = 1, limit = 30, studentId, date } = query;

    const filter = { markedBy: user._id };

    if (studentId) {
      filter.studentId = studentId;
    }

    if (date) {
      filter.activityDate = date;
    }

    const skip = (Number(page) - 1) * Number(limit);
    const total = await DailyActivity.countDocuments(filter);

    const activities = await DailyActivity.find(filter)
      .populate("studentId", "firstName lastName admissionNo photo")
      .populate("classId", "name")
      .sort({ activityDate: -1, updatedAt: -1 })
      .skip(skip)
      .limit(Number(limit))
      .lean();

    return {
      total,
      page: Number(page),
      pages: Math.ceil(total / Number(limit)),
      count: activities.length,
      data: activities,
    };
  }

  /**
   * Get all activity history (paginated, for admins)
   * Accessible by: admin, sub-admin
   */
  async getAllHistory(query) {
    const {
      page = 1,
      limit = 30,
      studentId,
      classId,
      teacherId, // This will be the Teacher's own _id, not the userId
      startDate,
      endDate,
      sortBy = "activityDate",
      sortOrder = "desc",
    } = query;

    const filter = {};

    if (studentId) filter.studentId = studentId;
    if (classId) filter.classId = classId;
    if (startDate || endDate) {
      filter.activityDate = {};
      if (startDate) filter.activityDate.$gte = startDate;
      if (endDate) filter.activityDate.$lte = endDate;
    }
    // To filter by teacher, we need to find the User._id from Teacher._id
    if (teacherId) {
      const Teacher = require("../teacher/teacher.model");
      const teacher = await Teacher.findById(teacherId).select("userId").lean();
      if (teacher) {
        filter.markedBy = teacher.userId;
      }
    }

    const skip = (Number(page) - 1) * Number(limit);
    const total = await DailyActivity.countDocuments(filter);

    const activities = await DailyActivity.find(filter)
      .populate("studentId", "firstName lastName admissionNo photo")
      .populate("classId", "name")
      .populate("markedBy", "name role") // Shows who marked it
      .sort({ [sortBy]: sortOrder === "asc" ? 1 : -1, _id: -1 })
      .skip(skip)
      .limit(Number(limit))
      .lean();

    const pages = Math.ceil(total / Number(limit));
    return { total, page: Number(page), pages, count: activities.length, data: activities };
  }

  /**
   * Admin: Get daily summary across all classes for a date
   */
  async getDailySummary(date) {
    const dateKey = date || getTodayKey();

    const summary = await DailyActivity.aggregate([
      { $match: { activityDate: dateKey } },
      {
        $group: {
          _id: "$classId",
          className: { $first: "$className" },
          totalReports: { $sum: 1 },
          healthAlerts: {
            $sum: {
              $cond: [
                { $gt: [{ $size: { $ifNull: ["$healthConcerns", []] } }, 0] },
                1,
                0,
              ],
            },
          },
          happyKids: {
            $sum: { $cond: [{ $eq: ["$mood", "happy"] }, 1, 0] },
          },
          unwell: {
            $sum: { $cond: [{ $eq: ["$mood", "unwell"] }, 1, 0] },
          },
        },
      },
      { $sort: { className: 1 } },
    ]);

    return { date: dateKey, classes: summary };
  }

  /**
   * Delete an activity report (admin only)
   */
  async deleteActivity(activityId) {
    const activity = await DailyActivity.findByIdAndDelete(activityId);
    if (!activity) throw new ErrorResponse("Activity report not found", 404);
    logger.info(`Daily activity ${activityId} deleted`);
    return activity;
  }
}

module.exports = new DailyActivityService();
