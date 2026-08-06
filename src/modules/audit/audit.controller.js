const AuditLog = require("./audit.model");

/**
 * @desc    Get all audit logs (Admin only)
 * @route   GET /api/audit/logs
 * @access  Private (Admin)
 */
exports.getAuditLogs = async (req, res, next) => {
  try {
    const {
      page = 1,
      limit = 20,
      action,
      targetModel,
      actorId,
      startDate,
      endDate,
    } = req.query;

    const query = {};

    if (action) query.action = action;
    if (targetModel) query["target.model"] = targetModel;
    if (actorId) query.actor = actorId;
    if (startDate || endDate) {
      query.timestamp = {};
      if (startDate) query.timestamp.$gte = new Date(startDate);
      if (endDate) query.timestamp.$lte = new Date(endDate);
    }

    const skip = (page - 1) * limit;

    const logs = await AuditLog.find(query)
      .populate("actor", "name email role")
      .sort({ timestamp: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await AuditLog.countDocuments(query);

    res.status(200).json({
      success: true,
      count: logs.length,
      total,
      page: parseInt(page),
      pages: Math.ceil(total / limit),
      data: logs,
    });
  } catch (err) {
    next(err);
  }
};

/**
 * @desc    Get audit logs for a specific target
 * @route   GET /api/audit/logs/target/:model/:id
 * @access  Private (Admin, Sub-admin)
 */
exports.getTargetLogs = async (req, res, next) => {
  try {
    const { model, id } = req.params;
    const { page = 1, limit = 20 } = req.query;

    const query = {
      "target.model": model,
      "target.id": id,
    };

    const skip = (page - 1) * limit;

    const logs = await AuditLog.find(query)
      .populate("actor", "name email role")
      .sort({ timestamp: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await AuditLog.countDocuments(query);

    res.status(200).json({
      success: true,
      count: logs.length,
      total,
      page: parseInt(page),
      pages: Math.ceil(total / limit),
      data: logs,
    });
  } catch (err) {
    next(err);
  }
};
