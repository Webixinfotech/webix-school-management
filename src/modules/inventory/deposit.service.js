const SecurityDeposit = require('./securityDeposit.model');
const LendingTransaction = require('./lending.model');
const ErrorResponse = require('../../utils/errorResponse');
const { notifyUsers } = require('./inventory.helpers');

const populateDeposit = (query) =>
  query
    .populate('item', 'name unit sellingPrice')
    .populate('parent', 'name email phone')
    .populate('student', 'firstName lastName admissionNo')
    .populate('collectedBy', 'name')
    .populate('refund.processedBy', 'name');

// Called from lending.service.js at the moment an item is borrowed — a
// deposit only ever exists tied to a specific borrow, so this isn't its
// own top-level "collect" endpoint; it's what /lending/borrow does under
// the hood, and from here on the deposit is its own trackable resource
// (receipt, status, refund/forfeit history, reports).
exports.createForBorrow = async ({ lendingTransaction, item, parentId, studentId, amount, paymentMode, transactionRef, collectedByUserId }) => {
  if (!paymentMode) throw new ErrorResponse('paymentMode is required to collect a security deposit', 400);

  const deposit = await SecurityDeposit.create({
    lendingTransaction: lendingTransaction._id,
    item: item._id,
    parent: parentId,
    student: studentId || null,
    amount,
    paymentMode,
    transactionRef: transactionRef || '',
    collectedBy: collectedByUserId,
  });

  return deposit;
};

exports.getDeposits = async ({ status, parentId, page = 1, limit = 20 }) => {
  const query = {};
  if (status) query.status = status;
  if (parentId) query.parent = parentId;

  const parsedPage = parseInt(page);
  const parsedLimit = parseInt(limit);
  const skip = (parsedPage - 1) * parsedLimit;

  const total = await SecurityDeposit.countDocuments(query);
  const data = await populateDeposit(SecurityDeposit.find(query).sort({ createdAt: -1 }).skip(skip).limit(parsedLimit));

  return { data, total, page: parsedPage, pages: Math.ceil(total / parsedLimit), count: data.length };
};

exports.getMyDeposits = async (parentUserId) => {
  return populateDeposit(SecurityDeposit.find({ parent: parentUserId }).sort({ createdAt: -1 }));
};

// "Kiska kitna deposit hamare paas hai" — grouped by parent, held only.
exports.getDepositSummary = async () => {
  const [totals, byParent] = await Promise.all([
    SecurityDeposit.aggregate([
      { $match: { status: 'held' } },
      { $group: { _id: null, totalHeld: { $sum: '$amount' }, count: { $sum: 1 } } },
    ]),
    SecurityDeposit.aggregate([
      { $match: { status: 'held' } },
      { $group: { _id: '$parent', totalHeld: { $sum: '$amount' }, count: { $sum: 1 } } },
      { $lookup: { from: 'users', localField: '_id', foreignField: '_id', as: 'parent' } },
      { $unwind: '$parent' },
      { $project: { parentName: '$parent.name', parentEmail: '$parent.email', totalHeld: 1, count: 1 } },
      { $sort: { totalHeld: -1 } },
    ]),
  ]);

  return {
    totalHeld: totals[0]?.totalHeld || 0,
    depositsHeldCount: totals[0]?.count || 0,
    byParent,
  };
};

exports.refundDeposit = async ({ id, body, staffUser }) => {
  const { mode, transactionRef, deductionAmount = 0, deductionReason, note } = body;
  if (!mode) throw new ErrorResponse('Refund payment mode is required', 400);

  const deposit = await SecurityDeposit.findById(id).populate('lendingTransaction').populate('item', 'name');
  if (!deposit) throw new ErrorResponse('Deposit not found', 404);
  if (deposit.status !== 'held') throw new ErrorResponse(`This deposit is already ${deposit.status}`, 400);
  if (deposit.lendingTransaction.status !== 'returned') {
    throw new ErrorResponse('Cannot refund a deposit before the item has been returned', 400);
  }

  const deduction = Number(deductionAmount) || 0;
  if (deduction > deposit.amount) {
    throw new ErrorResponse('deductionAmount cannot be more than the deposit amount', 400);
  }
  if (deduction > 0 && !deductionReason) {
    throw new ErrorResponse('deductionReason is required when deducting from a refund', 400);
  }

  const refundAmount = deposit.amount - deduction;

  // Atomically flip status only if it's still 'held' — guards against two
  // overlapping refund requests for the same deposit both passing the
  // status check above and both writing a refund (double-refund).
  const updated = await SecurityDeposit.findOneAndUpdate(
    { _id: deposit._id, status: 'held' },
    {
      $set: {
        status: 'refunded',
        refund: {
          amount: refundAmount,
          deductionAmount: deduction,
          deductionReason: deductionReason || '',
          mode,
          transactionRef: transactionRef || '',
          processedBy: staffUser._id,
          processedAt: new Date(),
          note: note || '',
        },
      },
    },
    { new: true },
  );
  if (!updated) {
    throw new ErrorResponse('This deposit has already been processed', 400);
  }

  notifyUsers({
    title: 'Security deposit refunded',
    body: `₹${refundAmount} refunded for "${deposit.item.name}"${deduction ? ` (₹${deduction} deducted: ${deductionReason})` : ''}.`,
    userIds: [deposit.parent],
    sender: staffUser._id,
    priority: 'medium',
    data: { depositId: deposit._id.toString(), event: 'deposit_refunded' },
  }).catch(() => {});

  return populateDeposit(SecurityDeposit.findById(deposit._id));
};

exports.forfeitDeposit = async ({ id, body, staffUser }) => {
  const { reason } = body;
  if (!reason) throw new ErrorResponse('A reason is required to forfeit a deposit', 400);

  const deposit = await SecurityDeposit.findById(id);
  if (!deposit) throw new ErrorResponse('Deposit not found', 404);
  if (deposit.status !== 'held') throw new ErrorResponse(`This deposit is already ${deposit.status}`, 400);

  // Atomically flip status only if it's still 'held' — guards against two
  // overlapping forfeit (or a forfeit + refund) requests double-processing
  // the same deposit.
  const updated = await SecurityDeposit.findOneAndUpdate(
    { _id: deposit._id, status: 'held' },
    { $set: { status: 'forfeited', forfeitReason: reason } },
    { new: true },
  );
  if (!updated) {
    throw new ErrorResponse('This deposit has already been processed', 400);
  }

  notifyUsers({
    title: 'Security deposit forfeited',
    body: `Deposit of ₹${deposit.amount} was forfeited: ${reason}`,
    userIds: [deposit.parent],
    sender: staffUser._id,
    priority: 'high',
    data: { depositId: deposit._id.toString(), event: 'deposit_forfeited' },
  }).catch(() => {});

  return updated;
};

// Called from lending.service.js when an item comes back reported 'lost' —
// forfeiture there is automatic (no cash physically moves), unlike a
// refund which always needs a staff-recorded payment action.
exports.autoForfeitForLostItem = async ({ lendingTransactionId, staffUser }) => {
  const deposit = await SecurityDeposit.findOne({ lendingTransaction: lendingTransactionId, status: 'held' });
  if (!deposit) return null;

  // Atomically flip status only if it's still 'held' — same double-processing
  // guard as refundDeposit/forfeitDeposit above.
  const updated = await SecurityDeposit.findOneAndUpdate(
    { _id: deposit._id, status: 'held' },
    { $set: { status: 'forfeited', forfeitReason: 'Item reported lost on return' } },
    { new: true },
  );
  if (!updated) return null;

  notifyUsers({
    title: 'Security deposit forfeited',
    body: `Deposit of ₹${updated.amount} was forfeited — item reported lost on return.`,
    userIds: [updated.parent],
    sender: staffUser?._id,
    priority: 'high',
    data: { depositId: updated._id.toString(), event: 'deposit_forfeited' },
  }).catch(() => {});

  return updated;
};
