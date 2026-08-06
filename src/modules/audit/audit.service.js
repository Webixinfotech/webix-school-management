const AuditLog = require("./audit.model");
const logger = require("../../config/logger");

/**
 * Create an audit log entry
 */
exports.logAction = async (data) => {
  try {
    const log = new AuditLog(data);
    await log.save();
    return log;
  } catch (error) {
    logger.error(`Audit Log Error: ${error.message}`);
    // Don't throw to avoid breaking main flow
  }
};

/**
 * Log a creation action
 */
exports.logCreate = async (
  actorId,
  actorRole,
  targetModel,
  targetId,
  data,
  metadata = {},
) => {
  return this.logAction({
    actor: actorId,
    actorRole,
    action: "CREATE",
    target: { model: targetModel, id: targetId },
    changes: { after: data },
    metadata,
    status: "SUCCESS",
  });
};

/**
 * Log an update action
 */
exports.logUpdate = async (
  actorId,
  actorRole,
  targetModel,
  targetId,
  before,
  after,
  metadata = {},
) => {
  const changedFields = [];
  if (before && after) {
    const keys = new Set([...Object.keys(before), ...Object.keys(after)]);
    for (const key of keys) {
      if (JSON.stringify(before[key]) !== JSON.stringify(after[key])) {
        changedFields.push(key);
      }
    }
  }

  return this.logAction({
    actor: actorId,
    actorRole,
    action: "UPDATE",
    target: { model: targetModel, id: targetId },
    changes: { before, after, fields: changedFields },
    metadata,
    status: "SUCCESS",
  });
};

/**
 * Log a deletion action
 */
exports.logDelete = async (
  actorId,
  actorRole,
  targetModel,
  targetId,
  before,
  metadata = {},
) => {
  return this.logAction({
    actor: actorId,
    actorRole,
    action: "DELETE",
    target: { model: targetModel, id: targetId },
    changes: { before },
    metadata,
    status: "SUCCESS",
  });
};

/**
 * Log a login action
 */
exports.logLogin = async (userId, role, metadata = {}) => {
  return this.logAction({
    actor: userId,
    actorRole: role,
    action: "LOGIN",
    target: { model: "User", id: userId },
    metadata,
    status: "SUCCESS",
  });
};

/**
 * Log a role change action
 */
exports.logRoleChange = async (
  actorId,
  actorRole,
  targetUserId,
  newRole,
  metadata = {},
) => {
  return this.logAction({
    actor: actorId,
    actorRole,
    action: "ROLE_CHANGE",
    target: { model: "User", id: targetUserId },
    changes: { after: { role: newRole } },
    metadata,
    status: "SUCCESS",
  });
};
