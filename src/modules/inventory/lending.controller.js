const lendingService = require('./lending.service');

exports.borrowItem = async (req, res, next) => {
  try {
    const transaction = await lendingService.borrowItem({ body: req.body, recordedByUser: req.user });
    res.status(201).json({ success: true, message: 'Item issued for borrowing', data: transaction });
  } catch (err) {
    next(err);
  }
};

exports.purchaseItem = async (req, res, next) => {
  try {
    const transaction = await lendingService.purchaseItem({ body: req.body, recordedByUser: req.user });
    res.status(201).json({ success: true, message: 'Purchase recorded', data: transaction });
  } catch (err) {
    next(err);
  }
};

exports.returnItem = async (req, res, next) => {
  try {
    const transaction = await lendingService.returnItem({ id: req.params.id, body: req.body, recordedByUser: req.user });
    res.status(200).json({ success: true, message: 'Return recorded', data: transaction });
  } catch (err) {
    next(err);
  }
};

exports.renewItem = async (req, res, next) => {
  try {
    const transaction = await lendingService.renewItem({ id: req.params.id, body: req.body });
    res.status(200).json({ success: true, message: 'Due date extended', data: transaction });
  } catch (err) {
    next(err);
  }
};

exports.getLendingTransactions = async (req, res, next) => {
  try {
    const result = await lendingService.getLendingTransactions(req.query);
    res.status(200).json({ success: true, ...result });
  } catch (err) {
    next(err);
  }
};

// Section 4.7/4.9 — parent's own "My Items" panel + wishlist, in one call.
exports.getMyLendingHistory = async (req, res, next) => {
  try {
    const result = await lendingService.getMyLendingHistory(req.user._id);
    res.status(200).json({ success: true, ...result });
  } catch (err) {
    next(err);
  }
};
