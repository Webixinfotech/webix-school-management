const stockIssueService = require('./stockIssue.service');

exports.requestStockIssue = async (req, res, next) => {
  try {
    const record = await stockIssueService.requestStockIssue({ body: req.body, requestedByUser: req.user });
    const message = record.status === 'issued'
      ? 'Item issued successfully'
      : 'Request sent to Admin for approval';
    res.status(201).json({ success: true, message, data: record });
  } catch (err) {
    next(err);
  }
};

exports.approveStockIssue = async (req, res, next) => {
  try {
    const record = await stockIssueService.approveStockIssue({ id: req.params.id, adminUser: req.user, note: req.body.note });
    res.status(200).json({ success: true, message: 'Issue request approved', data: record });
  } catch (err) {
    next(err);
  }
};

exports.rejectStockIssue = async (req, res, next) => {
  try {
    const record = await stockIssueService.rejectStockIssue({ id: req.params.id, adminUser: req.user, note: req.body.note });
    res.status(200).json({ success: true, message: 'Issue request rejected', data: record });
  } catch (err) {
    next(err);
  }
};

exports.getStockIssues = async (req, res, next) => {
  try {
    const result = await stockIssueService.getStockIssues(req.query);
    res.status(200).json({ success: true, ...result });
  } catch (err) {
    next(err);
  }
};

exports.getMyIssuedItems = async (req, res, next) => {
  try {
    const data = await stockIssueService.getMyIssuedItems(req.user._id);
    res.status(200).json({ success: true, count: data.length, data });
  } catch (err) {
    next(err);
  }
};

exports.getMyPendingRequests = async (req, res, next) => {
  try {
    const data = await stockIssueService.getMyPendingRequests(req.user._id);
    res.status(200).json({ success: true, count: data.length, data });
  } catch (err) {
    next(err);
  }
};
