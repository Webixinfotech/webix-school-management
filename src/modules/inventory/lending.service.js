const Item = require('./item.model');
const ItemCategory = require('./itemCategory.model');
const LendingTransaction = require('./lending.model');
const Student = require('../student/student.model');
const ErrorResponse = require('../../utils/errorResponse');
const { resolveClassPricing, checkLowStockAndNotify, notifyUsers, notifyAdmins, getSystemSenderId, decrementStockAtomic } = require('./inventory.helpers');
const wishlistService = require('./wishlist.service');
const depositService = require('./deposit.service');

const populateLending = (query) =>
  query
    .populate('item', 'name unit photo itemTypes sellingPrice')
    .populate('student', 'firstName lastName admissionNo')
    .populate('parent', 'name email phone')
    .populate('securityDeposit');

async function resolveStudentAndPricing({ studentId, item, category, parentUserId }) {
  let student = null;
  let pricing = { isFree: false, source: 'none' };

  if (studentId) {
    student = await Student.findById(studentId);
    if (!student) throw new ErrorResponse('Student not found', 404);
    if (student.parentUserId.toString() !== parentUserId.toString()) {
      throw new ErrorResponse('This student is not linked to your account', 403);
    }
    pricing = resolveClassPricing(item, category, student.classIds || []);
  }

  return { student, pricing };
}

// Section 4.4 — Borrow. Includes the deposit safety check: if the item's
// selling/replacement price is more than the deposit being collected, the
// issue is blocked and the issuing person is alerted via the error itself.
exports.borrowItem = async ({ body, recordedByUser }) => {
  const { itemId, studentId, quantity = 1, dueDate, depositCollected = 0, depositPaymentMode, depositTransactionRef, notes } = body;

  const item = await Item.findById(itemId);
  if (!item) throw new ErrorResponse('Item not found', 404);
  if (!item.isActive) throw new ErrorResponse('This item is not available', 400);
  if (!item.itemTypes.includes('lendable')) {
    throw new ErrorResponse('This item is not set up for borrowing', 400);
  }
  if (!dueDate) throw new ErrorResponse('Return-by (due) date is required for a borrow', 400);

  const qty = Number(quantity);
  if (!qty || qty <= 0) throw new ErrorResponse('Quantity must be greater than 0', 400);
  if (qty > item.currentStock) {
    throw new ErrorResponse(`Not enough stock. Only ${item.currentStock} ${item.unit}(s) available.`, 400);
  }

  const deposit = Number(depositCollected) || 0;
  if (item.sellingPrice > deposit) {
    throw new ErrorResponse(
      `Cannot issue: "${item.name}" is worth ₹${item.sellingPrice}, which is more than the security deposit of ₹${deposit}. Collect a deposit of at least ₹${item.sellingPrice} before issuing.`,
      400,
    );
  }
  if (deposit > 0 && !depositPaymentMode) {
    throw new ErrorResponse('depositPaymentMode is required when a security deposit is collected', 400);
  }

  const category = await ItemCategory.findById(item.category);
  // Staff (teacher/admin) always records this on the parent's behalf —
  // see inventory.routes.js, these endpoints aren't reachable by a parent.
  const parentUserId = body.parentId;
  if (!parentUserId) throw new ErrorResponse('parentId is required', 400);

  const { student, pricing } = await resolveStudentAndPricing({ studentId, item, category, parentUserId });

  const updatedItem = await decrementStockAtomic(item._id, qty);
  if (!updatedItem) {
    throw new ErrorResponse(`Not enough stock. Only ${item.currentStock} ${item.unit}(s) available.`, 400);
  }
  checkLowStockAndNotify(updatedItem).catch(() => {});

  const transaction = await LendingTransaction.create({
    item: item._id,
    quantity: qty,
    transactionType: 'borrow',
    parent: parentUserId,
    student: student ? student._id : null,
    status: 'active',
    dueDate,
    priceCharged: 0,
    isFree: pricing.isFree,
    freeRuleSource: pricing.source,
    depositCollected: deposit,
    notes,
    recordedBy: recordedByUser._id,
  });

  if (deposit > 0) {
    const depositRecord = await depositService.createForBorrow({
      lendingTransaction: transaction,
      item,
      parentId: parentUserId,
      studentId: student ? student._id : null,
      amount: deposit,
      paymentMode: depositPaymentMode,
      transactionRef: depositTransactionRef,
      collectedByUserId: recordedByUser._id,
    });
    transaction.securityDeposit = depositRecord._id;
    await transaction.save();
  }

  return populateLending(LendingTransaction.findById(transaction._id));
};

// Section 4.4 — Buy. Gated on Section 4.5's Available for Sale switch.
exports.purchaseItem = async ({ body, recordedByUser }) => {
  const { itemId, studentId, quantity = 1, notes } = body;

  const item = await Item.findById(itemId);
  if (!item) throw new ErrorResponse('Item not found', 404);
  if (!item.isActive) throw new ErrorResponse('This item is not available', 400);
  if (!item.itemTypes.includes('sellable') || !item.availableForSale) {
    throw new ErrorResponse('This item is not available for sale', 400);
  }

  const qty = Number(quantity);
  if (!qty || qty <= 0) throw new ErrorResponse('Quantity must be greater than 0', 400);
  if (qty > item.currentStock) {
    throw new ErrorResponse(`Not enough stock. Only ${item.currentStock} ${item.unit}(s) available.`, 400);
  }

  const category = await ItemCategory.findById(item.category);
  // Staff (teacher/admin) always records this on the parent's behalf —
  // see inventory.routes.js, these endpoints aren't reachable by a parent.
  const parentUserId = body.parentId;
  if (!parentUserId) throw new ErrorResponse('parentId is required', 400);

  const { student, pricing } = await resolveStudentAndPricing({ studentId, item, category, parentUserId });
  const priceCharged = pricing.isFree ? 0 : item.sellingPrice * qty;

  const updatedItem = await decrementStockAtomic(item._id, qty);
  if (!updatedItem) {
    throw new ErrorResponse(`Not enough stock. Only ${item.currentStock} ${item.unit}(s) available.`, 400);
  }
  checkLowStockAndNotify(updatedItem).catch(() => {});

  const transaction = await LendingTransaction.create({
    item: item._id,
    quantity: qty,
    transactionType: 'purchase',
    parent: parentUserId,
    student: student ? student._id : null,
    status: 'completed',
    priceCharged,
    isFree: pricing.isFree,
    freeRuleSource: pricing.source,
    notes,
    recordedBy: recordedByUser._id,
  });

  return populateLending(LendingTransaction.findById(transaction._id));
};

exports.returnItem = async ({ id, body, recordedByUser }) => {
  const { returnCondition = 'good' } = body;

  const transaction = await LendingTransaction.findById(id).populate('item');
  if (!transaction) throw new ErrorResponse('Transaction not found', 404);
  if (transaction.transactionType !== 'borrow') throw new ErrorResponse('Only borrowed items can be returned', 400);
  if (transaction.status !== 'active') throw new ErrorResponse(`This item is already ${transaction.status}`, 400);

  const item = transaction.item;
  transaction.status = 'returned';
  transaction.returnDate = new Date();
  transaction.returnCondition = returnCondition;
  await transaction.save();

  // Lost → the deposit is forfeited automatically (no cash physically
  // moves, so no staff action is needed). Good/damaged → the deposit
  // stays 'held' until staff explicitly refunds it via the deposit API,
  // since the actual money-back is a separate real-world action that can
  // happen on a different day than the item's physical return.
  if (returnCondition === 'lost' && transaction.securityDeposit) {
    await depositService.autoForfeitForLostItem({ lendingTransactionId: transaction._id, staffUser: recordedByUser });
  }

  // Lost items don't go back on the shelf; damaged/good ones do.
  if (returnCondition !== 'lost') {
    const stockBefore = item.currentStock;
    const stockAfter = stockBefore + transaction.quantity;
    item.currentStock = stockAfter;
    if (stockAfter > item.minStockLevel) item.lastLowStockAlertAt = null;
    await item.save();

    if (stockBefore === 0 && stockAfter > 0) {
      wishlistService.notifyRestock(item).catch(() => {});
    }
  }

  return populateLending(LendingTransaction.findById(transaction._id));
};

exports.renewItem = async ({ id, body }) => {
  const { newDueDate } = body;
  if (!newDueDate) throw new ErrorResponse('newDueDate is required', 400);

  const transaction = await LendingTransaction.findById(id);
  if (!transaction) throw new ErrorResponse('Transaction not found', 404);
  if (transaction.status !== 'active') throw new ErrorResponse('Only an active borrow can be renewed', 400);

  transaction.dueDate = newDueDate;
  transaction.dueReminderSent = false;
  transaction.overdueAlertSent = false;
  await transaction.save();

  return populateLending(LendingTransaction.findById(transaction._id));
};

exports.getLendingTransactions = async ({ status, itemId, parentId, page = 1, limit = 20 }) => {
  const query = {};
  if (status) query.status = status;
  if (itemId) query.item = itemId;
  if (parentId) query.parent = parentId;

  const parsedPage = parseInt(page);
  const parsedLimit = parseInt(limit);
  const skip = (parsedPage - 1) * parsedLimit;

  const total = await LendingTransaction.countDocuments(query);
  const data = await populateLending(
    LendingTransaction.find(query).sort({ createdAt: -1 }).skip(skip).limit(parsedLimit),
  );

  const withOverdueFlag = data.map((t) => {
    const obj = t.toObject();
    obj.isOverdue = t.status === 'active' && t.dueDate && t.dueDate < new Date();
    return obj;
  });

  return { data: withOverdueFlag, total, page: parsedPage, pages: Math.ceil(total / parsedLimit), count: data.length };
};

// "My Items" panel — Section 4.9/4.7, parent side. Includes wishlist so
// the panel shows both in one place, per the doc.
exports.getMyLendingHistory = async (parentUserId) => {
  const transactions = await populateLending(
    LendingTransaction.find({ parent: parentUserId }).sort({ createdAt: -1 }),
  );
  const wishlist = await wishlistService.getMyWishlist(parentUserId);

  const withOverdueFlag = transactions.map((t) => {
    const obj = t.toObject();
    obj.isOverdue = t.status === 'active' && t.dueDate && t.dueDate < new Date();
    return obj;
  });

  return { transactions: withOverdueFlag, wishlist };
};

// Section 4.11/4.12 — cron sweep for due-soon reminders and overdue alerts.
// Called from inventory.cron.js.
exports.runDueDateSweep = async () => {
  const now = new Date();
  const soon = new Date(now.getTime() + 2 * 24 * 60 * 60 * 1000); // 2 days out

  const dueSoon = await LendingTransaction.find({
    status: 'active',
    dueReminderSent: false,
    dueDate: { $gte: now, $lte: soon },
  }).populate('item', 'name');

  for (const t of dueSoon) {
    await notifyUsers({
      title: 'Return reminder',
      body: `"${t.item.name}" is due back on ${t.dueDate.toDateString()}.`,
      userIds: [t.parent],
      sender: await getSystemSenderId(),
      priority: 'medium',
      data: { lendingId: t._id.toString(), event: 'due_soon' },
    });
    t.dueReminderSent = true;
    await t.save();
  }

  const overdue = await LendingTransaction.find({
    status: 'active',
    overdueAlertSent: false,
    dueDate: { $lt: now },
  }).populate('item', 'name');

  for (const t of overdue) {
    const sender = await getSystemSenderId();
    await notifyUsers({
      title: 'Item overdue',
      body: `"${t.item.name}" was due back on ${t.dueDate.toDateString()} and hasn't been returned yet.`,
      userIds: [t.parent],
      sender,
      priority: 'high',
      data: { lendingId: t._id.toString(), event: 'overdue' },
    });
    await notifyAdmins({
      title: 'Item overdue',
      body: `"${t.item.name}" borrowed by a parent is overdue (was due ${t.dueDate.toDateString()}).`,
      sender,
      priority: 'high',
      data: { lendingId: t._id.toString(), event: 'overdue' },
    });
    t.overdueAlertSent = true;
    await t.save();
  }

  return { dueSoonCount: dueSoon.length, overdueCount: overdue.length };
};
