const Item = require('./item.model');
const ItemCategory = require('./itemCategory.model');
const StockIssue = require('./stockIssue.model');
const ErrorResponse = require('../../utils/errorResponse');
const { resolveDirectIssueAllowed, checkLowStockAndNotify, notifyAdmins, notifyUsers, decrementStockAtomic } = require('./inventory.helpers');

// Section 4.3 — by default every item requires Admin approval before it
// leaves the store. Admin (creating on their own behalf) always skips the
// approval step, since they ARE the approver. A teacher's request is
// auto-approved only when the item/category has been explicitly exempted.
exports.requestStockIssue = async ({ body, requestedByUser }) => {
  const { itemId, quantity, issuedToTeacherId, classId, purpose } = body;

  const item = await Item.findById(itemId);
  if (!item) throw new ErrorResponse('Item not found', 404);
  if (!item.isActive) throw new ErrorResponse('This item has been retired', 400);

  const qty = Number(quantity);
  if (!qty || qty <= 0) throw new ErrorResponse('Quantity must be greater than 0', 400);

  const category = await ItemCategory.findById(item.category);
  const isExempt = resolveDirectIssueAllowed(item, category);
  const isAdminActing = ['admin'].includes(requestedByUser.role);
  const skipApproval = isAdminActing || isExempt;

  const issuedToTeacher = issuedToTeacherId || requestedByUser._id;

  if (!skipApproval) {
    const record = await StockIssue.create({
      item: item._id,
      quantity: qty,
      issuedToTeacher,
      classId: classId || null,
      purpose,
      status: 'pending',
      isDirectIssue: false,
      requestedBy: requestedByUser._id,
    });

    notifyAdmins({
      title: 'Item issue request pending approval',
      body: `${requestedByUser.name} requested ${qty} ${item.unit}(s) of "${item.name}".`,
      priority: 'medium',
      data: { stockIssueId: record._id.toString(), event: 'issue_approval_pending' },
    }).catch(() => {});

    return record;
  }

  if (qty > item.currentStock) {
    throw new ErrorResponse(`Not enough stock. Only ${item.currentStock} ${item.unit}(s) available.`, 400);
  }

  const updatedItem = await decrementStockAtomic(item._id, qty);
  if (!updatedItem) {
    throw new ErrorResponse(`Not enough stock. Only ${item.currentStock} ${item.unit}(s) available.`, 400);
  }
  const stockAfter = updatedItem.currentStock;
  const stockBefore = stockAfter + qty;

  const record = await StockIssue.create({
    item: item._id,
    quantity: qty,
    issuedToTeacher,
    classId: classId || null,
    purpose,
    status: 'issued',
    isDirectIssue: isExempt,
    requestedBy: requestedByUser._id,
    decidedBy: requestedByUser._id,
    decidedAt: new Date(),
    stockBefore,
    stockAfter,
  });

  checkLowStockAndNotify(updatedItem).catch(() => {});

  return record;
};

exports.approveStockIssue = async ({ id, adminUser, note }) => {
  const record = await StockIssue.findById(id).populate('item');
  if (!record) throw new ErrorResponse('Issue request not found', 404);
  if (record.status !== 'pending') {
    throw new ErrorResponse(`This request is already ${record.status}`, 400);
  }

  const item = record.item;
  if (record.quantity > item.currentStock) {
    throw new ErrorResponse(`Not enough stock. Only ${item.currentStock} ${item.unit}(s) available.`, 400);
  }

  const updatedItem = await decrementStockAtomic(item._id, record.quantity);
  if (!updatedItem) {
    throw new ErrorResponse(`Not enough stock. Only ${item.currentStock} ${item.unit}(s) available.`, 400);
  }
  const stockAfter = updatedItem.currentStock;
  const stockBefore = stockAfter + record.quantity;

  record.status = 'issued';
  record.decidedBy = adminUser._id;
  record.decidedAt = new Date();
  record.decisionNote = note || '';
  record.stockBefore = stockBefore;
  record.stockAfter = stockAfter;
  await record.save();

  checkLowStockAndNotify(updatedItem).catch(() => {});

  notifyUsers({
    title: 'Issue request approved',
    body: `Your request for ${record.quantity} ${item.unit}(s) of "${item.name}" was approved.`,
    userIds: [record.requestedBy],
    sender: adminUser._id,
    priority: 'medium',
    data: { stockIssueId: record._id.toString(), event: 'issue_approved' },
  }).catch(() => {});

  return record;
};

exports.rejectStockIssue = async ({ id, adminUser, note }) => {
  const record = await StockIssue.findById(id).populate('item', 'name unit');
  if (!record) throw new ErrorResponse('Issue request not found', 404);
  if (record.status !== 'pending') {
    throw new ErrorResponse(`This request is already ${record.status}`, 400);
  }

  record.status = 'rejected';
  record.decidedBy = adminUser._id;
  record.decidedAt = new Date();
  record.decisionNote = note || '';
  await record.save();

  notifyUsers({
    title: 'Issue request rejected',
    body: `Your request for ${record.quantity} ${record.item.unit}(s) of "${record.item.name}" was rejected${note ? `: ${note}` : '.'}`,
    userIds: [record.requestedBy],
    sender: adminUser._id,
    priority: 'medium',
    data: { stockIssueId: record._id.toString(), event: 'issue_rejected' },
  }).catch(() => {});

  return record;
};

exports.getStockIssues = async ({ status, itemId, page = 1, limit = 20 }) => {
  const query = {};
  if (status) query.status = status;
  if (itemId) query.item = itemId;

  const parsedPage = parseInt(page);
  const parsedLimit = parseInt(limit);
  const skip = (parsedPage - 1) * parsedLimit;

  const total = await StockIssue.countDocuments(query);
  const data = await StockIssue.find(query)
    .populate('item', 'name unit')
    .populate('issuedToTeacher', 'name')
    .populate('classId', 'name')
    .populate('requestedBy', 'name')
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(parsedLimit);

  return { data, total, page: parsedPage, pages: Math.ceil(total / parsedLimit), count: data.length };
};

// "My Items" panel — Section 4.9, teacher side.
exports.getMyIssuedItems = async (teacherUserId) => {
  return StockIssue.find({ issuedToTeacher: teacherUserId, status: 'issued' })
    .populate('item', 'name unit photo')
    .populate('classId', 'name')
    .sort({ createdAt: -1 });
};

exports.getMyPendingRequests = async (teacherUserId) => {
  return StockIssue.find({ requestedBy: teacherUserId, status: 'pending' })
    .populate('item', 'name unit photo')
    .sort({ createdAt: -1 });
};
