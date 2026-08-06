const attendanceService = require("./attendance.service");

exports.scanAttendance = async (req, res, next) => {
  try {
    const result = await attendanceService.scanAttendance(req.body, req.user);

    res.status(200).json({
      success: true,
      message:
        result.action === "already_marked"
          ? "Attendance already marked for this student"
          : "Attendance marked successfully",
      data: result,
    });
  } catch (err) {
    next(err);
  }
};

exports.manualMarkAttendance = async (req, res, next) => {
  try {
    const result = await attendanceService.manualMarkAttendance(
      req.body,
      req.user,
    );

    res.status(200).json({
      success: true,
      message:
        result.action === "updated"
          ? "Attendance updated successfully"
          : "Attendance marked successfully",
      data: result,
    });
  } catch (err) {
    next(err);
  }
};

exports.getAttendanceList = async (req, res, next) => {
  try {
    const result = await attendanceService.getAttendanceList(
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

exports.getStudentAttendance = async (req, res, next) => {
  try {
    const result = await attendanceService.getStudentAttendance(
      req.params.id,
      req.query,
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

exports.getDailySummary = async (req, res, next) => {
  try {
    const result = await attendanceService.getDailySummary(
      req.query.date,
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

exports.updateAttendance = async (req, res, next) => {
  try {
    // req.body is forwarded wholesale to the service, so the optional
    // `note` field (edit-history remark, validated in attendance.validators.js)
    // and any checkInTime/checkOutTime changes flow through automatically —
    // no extra wiring needed here for the flexi-hours recompute or the
    // editHistory audit trail added in attendance.service.js.
    const result = await attendanceService.updateAttendance(
      req.params.id,
      req.body,
      req.user,
    );

    res.status(200).json({
      success: true,
      message: "Attendance updated successfully",
      data: result,
    });
  } catch (err) {
    next(err);
  }
};

exports.centerCheckIn = async (req, res, next) => {
  try {
    const result = await attendanceService.centerCheckIn(req.body, req.user);

    res.status(200).json({
      success: true,
      data: result,
    });
  } catch (err) {
    next(err);
  }
};

exports.centerCheckOut = async (req, res, next) => {
  try {
    const result = await attendanceService.centerCheckOut(req.body, req.user);

    res.status(200).json({
      success: true,
      data: result,
    });
  } catch (err) {
    next(err);
  }
};