const stockInService = require('./stockIn.service');

exports.recordStockIn = async (req, res, next) => {
  try {
    const entry = await stockInService.recordStockIn({ body: req.body, userId: req.user._id });
    res.status(201).json({ success: true, message: 'Stock in recorded successfully', data: entry });
  } catch (err) {
    next(err);
  }
};

exports.getStockEntries = async (req, res, next) => {
  try {
    const result = await stockInService.getStockEntries(req.query);
    res.status(200).json({ success: true, ...result });
  } catch (err) {
    next(err);
  }
};
