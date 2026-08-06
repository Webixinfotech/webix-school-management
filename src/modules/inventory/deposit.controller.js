const depositService = require('./deposit.service');

exports.getDeposits = async (req, res, next) => {
  try {
    const result = await depositService.getDeposits(req.query);
    res.status(200).json({ success: true, ...result });
  } catch (err) {
    next(err);
  }
};

exports.getMyDeposits = async (req, res, next) => {
  try {
    const data = await depositService.getMyDeposits(req.user._id);
    res.status(200).json({ success: true, count: data.length, data });
  } catch (err) {
    next(err);
  }
};

exports.getDepositSummary = async (req, res, next) => {
  try {
    const data = await depositService.getDepositSummary();
    res.status(200).json({ success: true, data });
  } catch (err) {
    next(err);
  }
};

exports.refundDeposit = async (req, res, next) => {
  try {
    const deposit = await depositService.refundDeposit({ id: req.params.id, body: req.body, staffUser: req.user });
    res.status(200).json({ success: true, message: 'Deposit refunded', data: deposit });
  } catch (err) {
    next(err);
  }
};

exports.forfeitDeposit = async (req, res, next) => {
  try {
    const deposit = await depositService.forfeitDeposit({ id: req.params.id, body: req.body, staffUser: req.user });
    res.status(200).json({ success: true, message: 'Deposit forfeited', data: deposit });
  } catch (err) {
    next(err);
  }
};
