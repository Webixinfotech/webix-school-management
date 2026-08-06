const reportService = require('./report.service');

exports.getDashboard = async (req, res, next) => {
  try {
    const data = await reportService.getDashboard();
    res.status(200).json({ success: true, data });
  } catch (err) {
    next(err);
  }
};

exports.getOverdueList = async (req, res, next) => {
  try {
    const data = await reportService.getOverdueList();
    res.status(200).json({ success: true, count: data.length, data });
  } catch (err) {
    next(err);
  }
};

exports.getLowStockList = async (req, res, next) => {
  try {
    const data = await reportService.getLowStockList();
    res.status(200).json({ success: true, count: data.length, data });
  } catch (err) {
    next(err);
  }
};

exports.getMonthlyExpenseReport = async (req, res, next) => {
  try {
    const data = await reportService.getMonthlyExpenseReport(req.query);
    res.status(200).json({ success: true, data });
  } catch (err) {
    next(err);
  }
};
