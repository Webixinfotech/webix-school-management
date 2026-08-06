const User = require('../auth/user.model');
const Item = require('./item.model');
const inAppNotificationService = require('../notification/notification-in-app.service');
const logger = require('../../config/logger');

/**
 * Atomically decrement an item's stock, guarded so concurrent requests can
 * never push it below 0 (the old read-then-write `item.save()` pattern let
 * two overlapping requests both read the same currentStock and both
 * succeed, overselling the item). Returns the updated item, or `null` if
 * there wasn't enough stock left at the moment of the write — callers
 * should treat that the same as the pre-check failing.
 */
async function decrementStockAtomic(itemId, qty) {
  return Item.findOneAndUpdate(
    { _id: itemId, currentStock: { $gte: qty } },
    { $inc: { currentStock: -qty } },
    { new: true },
  );
}

/**
 * Whether a teacher can issue this item's stock directly, without Admin
 * approval (Section 4.3). Item-level override always wins; falls back to
 * the category default when the item has no override set.
 */
function resolveDirectIssueAllowed(item, category) {
  if (item.directIssueOverride === true || item.directIssueOverride === false) {
    return item.directIssueOverride;
  }
  return !!(category && category.directIssueAllowed);
}

/**
 * Whether this item is free for a student, and which setting decided it
 * (Section 4.6). Item-level override always wins over the category default.
 * `studentClassIds` is the student's Class ObjectIds (Student.classIds).
 */
function resolveClassPricing(item, category, studentClassIds = []) {
  const classIdSet = new Set((studentClassIds || []).map((id) => id.toString()));

  if (item.classPricing && item.classPricing.override) {
    const isFree = (item.classPricing.freeForClasses || []).some((id) =>
      classIdSet.has(id.toString()),
    );
    return { isFree, source: 'item' };
  }

  if (category && Array.isArray(category.freeForClasses) && category.freeForClasses.length > 0) {
    const isFree = category.freeForClasses.some((id) => classIdSet.has(id.toString()));
    return { isFree, source: isFree ? 'category' : 'none' };
  }

  return { isFree: false, source: 'none' };
}

let cachedSystemSenderId = null;
/**
 * Sender to attach to notifications raised outside a request context (cron
 * sweeps for due-soon/overdue reminders). Falls back to the first admin
 * account found — mirrors how every other in-app notification requires a
 * real User as `sender`.
 */
async function getSystemSenderId() {
  if (cachedSystemSenderId) return cachedSystemSenderId;
  const admin = await User.findOne({ role: 'admin' }).select('_id').lean();
  cachedSystemSenderId = admin ? admin._id : null;
  return cachedSystemSenderId;
}

/**
 * Fire-and-log an in-app notification to specific users. Never throws —
 * a failed notification should not fail the inventory action that
 * triggered it.
 */
async function notifyUsers({ title, body, userIds, sender, type = 'inventory', priority = 'medium', link = '', data = {} }) {
  try {
    const ids = (userIds || []).filter(Boolean);
    if (ids.length === 0) return;
    const resolvedSender = sender || (await getSystemSenderId());
    if (!resolvedSender) return;

    await inAppNotificationService.createNotification({
      title,
      body,
      type,
      targetType: 'specific',
      targetUserIds: ids,
      sender: resolvedSender,
      priority,
      link,
      data,
    });
  } catch (err) {
    logger.error('Inventory notification failed (non-critical):', err);
  }
}

/**
 * Notify every admin + sub-admin (used for approval-pending / low-stock /
 * deposit-mismatch alerts that are Admin's job to act on).
 */
async function notifyAdmins({ title, body, sender, type = 'inventory', priority = 'medium', link = '', data = {} }) {
  try {
    const admins = await User.find({ role: { $in: ['admin'] } }).select('_id').lean();
    await notifyUsers({
      title,
      body,
      userIds: admins.map((a) => a._id),
      sender,
      type,
      priority,
      link,
      data,
    });
  } catch (err) {
    logger.error('Inventory admin notification failed (non-critical):', err);
  }
}

/**
 * Section 4.12 low-stock alert. Fires once per dip below minStockLevel
 * (item.lastLowStockAlertAt dedupes repeat alerts until stock recovers —
 * see stockIn.service.js, which clears the flag on restock).
 */
async function checkLowStockAndNotify(item) {
  try {
    if (item.minStockLevel <= 0) return;
    if (item.currentStock > item.minStockLevel) return;
    if (item.lastLowStockAlertAt) return;

    await notifyAdmins({
      title: 'Low stock alert',
      body: `"${item.name}" stock is down to ${item.currentStock} ${item.unit}(s) — below the minimum of ${item.minStockLevel}.`,
      priority: 'high',
      data: { itemId: item._id.toString(), event: 'low_stock' },
    });

    item.lastLowStockAlertAt = new Date();
    await item.save();
  } catch (err) {
    logger.error('Low-stock check failed (non-critical):', err);
  }
}

module.exports = {
  resolveDirectIssueAllowed,
  resolveClassPricing,
  getSystemSenderId,
  notifyUsers,
  notifyAdmins,
  checkLowStockAndNotify,
  decrementStockAtomic,
};
