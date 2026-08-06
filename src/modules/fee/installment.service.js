const Installment = require('./installment.model');
const ErrorResponse = require('../../utils/errorResponse');
const logger = require('../../config/logger');

const DAY_MS = 24 * 60 * 60 * 1000;

/**
 * Generate the concrete installment schedule for a new enrollment whose
 * class feeType is ONE_TIME or INSTALLMENT, or whose classType is
 * FLEX_TIME. Called once, from feeService.enrollStudent(), right after the
 * StudentEnrollment is created. ONE_TIME/FLEX_TIME become a single row due
 * at enrollment — this is what keeps a one-time fee out of the monthly
 * Invoice cron for good.
 */
async function generateInstallmentsForEnrollment(enrollment, cls, user, session = null) {
  const rows = [];

  if (cls.classType === 'FLEX_TIME') {
    // Billed as hoursAssigned * baseFee (computed by the caller into
    // agreedFee) — always UNPAID until explicitly collected, never routed
    // through the FREE/monthly-tuitionLines path regardless of cls.feeType.
    rows.push({
      seq: 1,
      label: `Flexi Time Fee (${enrollment.flexiHoursAssigned || 0} hrs)`,
      amount: enrollment.agreedFee,
      dueDate: enrollment.validFrom,
    });

  } else if (cls.feeType === 'ONE_TIME') {
    rows.push({ seq: 1, label: 'One-Time Fee', amount: enrollment.agreedFee, dueDate: enrollment.validFrom });

  } else if (cls.feeType === 'INSTALLMENT') {
    const template = (Array.isArray(cls.installmentTemplate) && cls.installmentTemplate.length)
      ? cls.installmentTemplate
      : [{ seq: 1, amount: enrollment.agreedFee, offsetDays: 0, label: 'Installment 1' }];

    // Scale template amounts to the enrollment's actual agreedFee (which
    // may differ from cls.baseFee via a per-student discount override), so
    // the installments always sum exactly to what the student owes.
    const templateTotal = template.reduce((s, t) => s + t.amount, 0) || 1;
    const scale = enrollment.agreedFee / templateTotal;

    [...template]
      .sort((a, b) => a.seq - b.seq)
      .forEach((t) => {
        rows.push({
          seq: t.seq,
          label: t.label || `Installment ${t.seq}`,
          amount: Math.round(t.amount * scale * 100) / 100,
          dueDate: new Date(new Date(enrollment.validFrom).getTime() + (t.offsetDays || 0) * DAY_MS),
        });
      });
  } else {
    return []; // MONTHLY / FREE — nothing to do here
  }

  const docs = rows.map((r) => ({
    studentId: enrollment.studentId,
    enrollmentId: enrollment._id,
    classId: enrollment.classId,
    studentName: enrollment.studentName,
    studentAdmNo: enrollment.studentAdmNo,
    className: enrollment.className,
    classCode: enrollment.classCode,
    seq: r.seq,
    label: r.label,
    amount: r.amount,
    netDue: r.amount,
    dueDate: r.dueDate,
    status: 'UNPAID',
    generatedBy: user ? 'admin' : 'system',
    generatedByUser: user ? user._id : null,
  }));

  // Model.create() (not insertMany) so each document's pre('save') hook
  // runs and generates its own installmentNo — insertMany bypasses save
  // middleware entirely, which would leave every row's installmentNo null
  // and collide on the unique index after the first.
  const created = await Installment.create(docs, { session });
  logger.info(`[FEE] ${created.length} installment(s) generated for enrollment ${enrollment._id} (${cls.feeType})`);
  return created;
}

/**
 * Apply a payment allocation to a specific installment. Used by
 * feeService.collectPayment() when allocations[].billType === 'INSTALLMENT'.
 */
async function applyPaymentToInstallment(installmentId, amount, session = null) {
  const inst = await Installment.findById(installmentId).session(session);
  if (!inst) throw new ErrorResponse('Installment not found', 404);
  if (amount > inst.netDue) {
    throw new ErrorResponse(`Allocation amount Rs.${amount} exceeds installment due Rs.${inst.netDue}`, 400);
  }
  inst.amountPaid += amount;
  inst.netDue     -= amount;
  inst.status = inst.netDue <= 0 ? 'PAID' : 'PARTIAL';
  await inst.save({ session });
  return { billType: 'INSTALLMENT', billId: inst._id, billNo: inst.installmentNo, amountUsed: amount };
}

async function getInstallments(studentId, query = {}) {
  const { status, page = 1, limit = 20 } = query;
  const filter = { studentId };
  if (status) filter.status = status;

  const skip  = (Number(page) - 1) * Number(limit);
  const total = await Installment.countDocuments(filter);
  const data  = await Installment.find(filter)
    .sort({ dueDate: 1 })
    .skip(skip).limit(Number(limit))
    .lean();

  return { total, page: Number(page), pages: Math.ceil(total / Number(limit)), data };
}

async function getInstallmentById(id) {
  const inst = await Installment.findById(id).lean();
  if (!inst) throw new ErrorResponse('Installment not found', 404);
  return inst;
}

async function updateInstallment(id, data, user) {
  const allowed = ['adjustmentAmount', 'adjustmentReason', 'status', 'notes', 'dueDate'];
  const inst = await Installment.findById(id);
  if (!inst) throw new ErrorResponse('Installment not found', 404);

  allowed.forEach((k) => { if (data[k] !== undefined) inst[k] = data[k]; });

  if (data.adjustmentAmount !== undefined) {
    const adj = Number(data.adjustmentAmount);
    inst.adjustmentAmount = adj;
    inst.netDue = Math.max(0, inst.amount - inst.amountPaid - adj);
    inst.status = inst.netDue === 0
      ? 'PAID'
      : (inst.amountPaid > 0 ? 'PARTIAL' : 'UNPAID');
  }

  await inst.save();
  logger.info(`[FEE] Installment ${id} updated by ${user._id}`);
  return inst;
}

async function getDefaulterInstallments(query = {}) {
  const now = new Date();
  const filter = { status: { $in: ['UNPAID', 'PARTIAL'] }, dueDate: { $lte: now } };

  const data = await Installment.find(filter)
    .populate('studentId', 'firstName lastName admissionNo parentUserId')
    .sort({ dueDate: 1 })
    .lean();

  return {
    total: data.length,
    totalPending: data.reduce((s, i) => s + i.netDue, 0),
    data,
  };
}

module.exports = {
  generateInstallmentsForEnrollment,
  applyPaymentToInstallment,
  getInstallments,
  getInstallmentById,
  updateInstallment,
  getDefaulterInstallments,
};
