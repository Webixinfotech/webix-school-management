// const dailyActivityService = require('./dailyActivity.service');

// // ─── Teacher: Create / Update ─────────────────────────────────────────────────

// exports.upsertActivity = async (req, res, next) => {
//   try {
//     const activity = await dailyActivityService.upsertActivity(req.body, req.user);
//     const isNew = activity.createdAt.getTime() === activity.updatedAt.getTime();

//     res.status(isNew ? 201 : 200).json({
//       success: true,
//       message: isNew
//         ? 'Daily activity report created successfully'
//         : 'Daily activity report updated successfully',
//       data: activity,
//     });
//   } catch (err) {
//     next(err);
//   }
// };

// // ─── Get single student's activity for a date ────────────────────────────────

// exports.getStudentActivity = async (req, res, next) => {
//   try {
//     const { studentId } = req.params;
//     const { date } = req.query;

//     const data = await dailyActivityService.getStudentActivity(studentId, date, req.user);

//     res.status(200).json({
//       success: true,
//       count: data.length,
//       data,
//     });
//   } catch (err) {
//     next(err);
//   }
// };

// // ─── Get all activities for a class on a date ────────────────────────────────

// exports.getClassActivities = async (req, res, next) => {
//   try {
//     const { classId } = req.params;
//     const { date } = req.query;

//     const result = await dailyActivityService.getClassActivities(classId, date, req.user);

//     res.status(200).json({
//       success: true,
//       data: result,
//     });
//   } catch (err) {
//     next(err);
//   }
// };

// // ─── Get student's activity history (paginated) ───────────────────────────────

// exports.getStudentHistory = async (req, res, next) => {
//   try {
//     const { studentId } = req.params;
//     const result = await dailyActivityService.getStudentHistory(studentId, req.query, req.user);

//     res.status(200).json({
//       success: true,
//       total:  result.total,
//       page:   result.page,
//       pages:  result.pages,
//       count:  result.count,
//       data:   result.data,
//     });
//   } catch (err) {
//     next(err);
//   }
// };

// // ─── Admin: Daily summary across all classes ─────────────────────────────────

// exports.getDailySummary = async (req, res, next) => {
//   try {
//     const { date } = req.query;
//     const result = await dailyActivityService.getDailySummary(date);

//     res.status(200).json({
//       success: true,
//       data: result,
//     });
//   } catch (err) {
//     next(err);
//   }
// };

// // ─── Admin: Delete a report ───────────────────────────────────────────────────

// exports.deleteActivity = async (req, res, next) => {
//   try {
//     const { activityId } = req.params;
//     await dailyActivityService.deleteActivity(activityId);

//     res.status(200).json({
//       success: true,
//       message: 'Activity report deleted successfully',
//     });
//   } catch (err) {
//     next(err);
//   }
// };

//== IGNORE: This file has been recently edited. Do not suggest code that has been deleted.

//====================================Updated code written by Bhushan=====//
// ====================================

const dailyActivityService = require("./dailyActivity.service");

// ─── Teacher: Create / Update ─────────────────────────────────────────────────

exports.upsertActivity = async (req, res, next) => {
  try {
    const { activity, isNew } = await dailyActivityService.upsertActivity(
      req.body,
      req.user,
    );

    res.status(isNew ? 201 : 200).json({
      success: true,
      message: isNew
        ? "Daily activity report created successfully"
        : "Daily activity report updated successfully",
      data: activity,
    });
  } catch (err) {
    next(err);
  }
};

// ─── Get single student's activity for a date ────────────────────────────────

exports.getStudentActivity = async (req, res, next) => {
  try {
    const { studentId } = req.params;
    const { date } = req.query;

    const data = await dailyActivityService.getStudentActivity(
      studentId,
      date,
      req.user,
    );

    res.status(200).json({
      success: true,
      count: data.length,
      data,
    });
  } catch (err) {
    next(err);
  }
};

// ─── Get all activities for a class on a date ────────────────────────────────

exports.getClassActivities = async (req, res, next) => {
  try {
    const { classId } = req.params;
    const { date } = req.query;

    const result = await dailyActivityService.getClassActivities(
      classId,
      date,
      req.user,
    );

    res.status(200).json({
      success: true,
      data: result,
    });
  } catch (err) {
    next(err);
  }
};

// ─── Get student's activity history (paginated) ───────────────────────────────

exports.getStudentHistory = async (req, res, next) => {
  try {
    const { studentId } = req.params;
    const result = await dailyActivityService.getStudentHistory(
      studentId,
      req.query,
      req.user,
    );

    res.status(200).json({
      success: true,
      total: result.total,
      page: result.page,
      pages: result.pages,
      count: result.count,
      data: result.data,
    });
  } catch (err) {
    next(err);
  }
};

// ─── Teacher: Get own activity history (paginated) ───────────────────────────

exports.getTeacherHistory = async (req, res, next) => {
  try {
    const result = await dailyActivityService.getTeacherHistory(
      req.user,
      req.query,
    );

    res.status(200).json({
      success: true,
      total: result.total,
      page: result.page,
      pages: result.pages,
      count: result.count,
      data: result.data,
    });
  } catch (err) {
    next(err);
  }
};

// ─── Admin: Get all activity history (paginated) ─────────────────────────────

exports.getAllHistory = async (req, res, next) => {
  try {
    const result = await dailyActivityService.getAllHistory(req.query);

    res.status(200).json({
      success: true,
      total: result.total,
      page: result.page,
      pages: result.pages,
      count: result.count,
      data: result.data,
    });
  } catch (err) {
    next(err);
  }
};

// ─── Admin: Daily summary across all classes ─────────────────────────────────

exports.getDailySummary = async (req, res, next) => {
  try {
    const { date } = req.query;
    const result = await dailyActivityService.getDailySummary(date);

    res.status(200).json({
      success: true,
      data: result,
    });
  } catch (err) {
    next(err);
  }
};

// ─── Admin: Delete a report ───────────────────────────────────────────────────

exports.deleteActivity = async (req, res, next) => {
  try {
    const { activityId } = req.params;
    await dailyActivityService.deleteActivity(activityId);

    res.status(200).json({
      success: true,
      message: "Activity report deleted successfully",
    });
  } catch (err) {
    next(err);
  }
};
