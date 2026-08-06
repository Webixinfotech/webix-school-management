

//--------------------------New code--------------------------//

const service = require("./employeeAttendance.service");

exports.getCurrentQR = async (req, res, next) => {
  try {
    const data = await service.getCurrentQR();
    res.status(200).json({ success: true, data });
  } catch (err) {
    next(err);
  }
};

exports.scanQR = async (req, res, next) => {
  try {
    const { token, location } = req.body;
    const result = await service.scanQR(token, req.user, location);
    res.status(200).json({ success: true, ...result });
  } catch (err) {
    next(err);
  }
};

exports.scanStaticQR = async (req, res, next) => {
  try {
    const { qrCode, location } = req.body;
    const result = await service.scanStaticQR(qrCode, req.user, location);
    res.status(200).json({ success: true, ...result });
  } catch (err) {
    next(err);
  }
};

exports.manualMark = async (req, res, next) => {
  try {
    const data = await service.manualMark(req.body, req.user);
    res
      .status(200)
      .json({ success: true, message: "Attendance marked manually", data });
  } catch (err) {
    next(err);
  }
};

exports.getDailySummary = async (req, res, next) => {
  try {
    const data = await service.getDailySummary(req.query.date);
    res.status(200).json({ success: true, data });
  } catch (err) {
    next(err);
  }
};

exports.getEmployeeHistory = async (req, res, next) => {
  try {
    const data = await service.getEmployeeHistory(
      req.params.teacherId,
      req.query,
      req.user,
    );
    res.status(200).json({ success: true, ...data });
  } catch (err) {
    next(err);
  }
};

exports.deleteRecord = async (req, res, next) => {
  try {
    await service.deleteRecord(req.params.recordId);
    res
      .status(200)
      .json({ success: true, message: "Attendance record deleted" });
  } catch (err) {
    next(err);
  }
};


//--------------------------End of new code--------------------------//