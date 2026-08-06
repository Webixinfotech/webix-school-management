const auditService = require("./audit.service");
const ErrorResponse = require("../../utils/errorResponse");

/**
 * Audit Middleware
 * Wraps controller execution to capture before/after states and log changes.
 *
 * @param {Object} model - Mongoose Model
 * @param {String} actionType - 'CREATE', 'UPDATE', or 'DELETE'
 * @param {Function} [transformData] - Optional function to transform data before logging
 */
exports.auditTrail = (model, actionType, transformData = null) => {
  return async (req, res, next) => {
    // Store original functions to intercept
    const originalJson = res.json.bind(res);
    const originalStatus = res.status.bind(res);

    let capturedStatus = 200;
    let capturedJson = null;

    // Intercept res.status
    res.status = (code) => {
      capturedStatus = code;
      return originalStatus(code);
    };

    // Intercept res.json
    res.json = (body) => {
      capturedJson = body;
      return originalJson(body);
    };

    try {
      let beforeData = null;
      let targetId = null;

      // Fetch 'before' state for UPDATE or DELETE
      if (
        (actionType === "UPDATE" || actionType === "DELETE") &&
        req.params.id
      ) {
        targetId = req.params.id;
        const doc = await model.findById(targetId).lean();
        beforeData = doc;
      }

      // Execute the actual controller
      await next();

      // After controller execution, log the action
      if (req.user && capturedStatus >= 200 && capturedStatus < 400) {
        // Extract target ID from response if not in params (for CREATE)
        if (actionType === "CREATE" && capturedJson && capturedJson.data) {
          targetId =
            capturedJson.data._id ||
            capturedJson.data.id ||
            (capturedJson.data.user ? capturedJson.data.user.id : null);
        }

        // Determine after data
        let afterData = null;
        if (actionType === "CREATE" && capturedJson) {
          afterData = capturedJson.data;
        } else if (actionType === "UPDATE" && targetId) {
          // Fetch updated state
          const updatedDoc = await model.findById(targetId).lean();
          afterData = updatedDoc;
        }

        // Apply transformation if provided
        if (transformData) {
          beforeData = transformData(beforeData);
          afterData = transformData(afterData);
        }

        // Log to Audit Service
        if (actionType === "CREATE" && targetId) {
          await auditService.logCreate(
            req.user._id,
            req.user.role,
            model.modelName,
            targetId,
            afterData,
            {
              ip: req.ip,
              userAgent: req.get("User-Agent"),
              path: req.originalUrl,
              method: req.method,
            },
          );
        } else if (actionType === "UPDATE" && targetId) {
          await auditService.logUpdate(
            req.user._id,
            req.user.role,
            model.modelName,
            targetId,
            beforeData,
            afterData,
            {
              ip: req.ip,
              userAgent: req.get("User-Agent"),
              path: req.originalUrl,
              method: req.method,
            },
          );
        } else if (actionType === "DELETE" && targetId) {
          await auditService.logDelete(
            req.user._id,
            req.user.role,
            model.modelName,
            targetId,
            beforeData,
            {
              ip: req.ip,
              userAgent: req.get("User-Agent"),
              path: req.originalUrl,
              method: req.method,
            },
          );
        }
      }
    } catch (err) {
      // If controller failed, log failure
      if (req.user && err.statusCode !== 401 && err.statusCode !== 403) {
        await auditService.logAction({
          actor: req.user._id,
          actorRole: req.user.role,
          action: actionType,
          target: { model: model.modelName, id: req.params.id || "unknown" },
          metadata: {
            ip: req.ip,
            userAgent: req.get("User-Agent"),
            path: req.originalUrl,
            method: req.method,
          },
          status: "FAILURE",
          error: err.message,
        });
      }
      next(err);
    }
  };
};
