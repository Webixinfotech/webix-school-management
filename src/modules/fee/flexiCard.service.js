const FlexiCardPurchase = require('./flexiCardPurchase.model');
const StudentEnrollment = require('./studentEnrollment.model');
const Student = require('../student/student.model');
const Class = require('../class/class.model');
const ErrorResponse = require('../../utils/errorResponse');
const logger = require('../../config/logger');
const academicSessionService = require('../academicSession/academicSession.service');

/**
 * Purchase a Flexi Card tier for a student. Activates immediately with the
 * tier's full hours regardless of amountPaidNow (partial payment allowed —
 * the remainder is collected later via feeService.collectPayment's
 * allocations[] with billType FLEXI_CARD).
 * Reuses (or creates) a single Active StudentEnrollment for
 * (studentId, classId) so repeat card purchases of the same tier don't
 * create duplicate enrollments — mirrors feeService.enrollStudent()'s
 * existing dedupe rule.
 */
async function purchaseFlexiCard({ studentId, classId, amountPaidNow = 0, notes = '' }, user, session = null) {
  const [student, cls] = await Promise.all([
    Student.findById(studentId).select('firstName lastName admissionNo').session(session),
    Class.findById(classId).session(session),
  ]);
  if (!student) throw new ErrorResponse('Student not found', 404);
  if (!cls) throw new ErrorResponse('Class not found', 404);
  if (cls.status !== 'Active') throw new ErrorResponse('Class is not active', 400);
  if (cls.classType !== 'HOURS_BASED' || !cls.isPrepaidHoursCard) {
    throw new ErrorResponse('Class is not configured as a prepaid Flexi Card tier', 400);
  }
  if (amountPaidNow < 0 || amountPaidNow > cls.baseFee) {
    throw new ErrorResponse('amountPaidNow must be between 0 and the tier price', 400);
  }

  const studentName = `${student.firstName} ${student.lastName}`.trim();

  let enrollment = await StudentEnrollment.findOne({ studentId, classId, status: 'Active' }).session(session);
  if (!enrollment) {
    const sessionId = await academicSessionService.getCurrentActiveSessionId();
    [enrollment] = await StudentEnrollment.create([{
      studentId, classId,
      studentName, studentAdmNo: student.admissionNo,
      className: cls.name, classCode: cls.classId,
      classType: cls.classType, feeType: cls.feeType,
      isPrepaidHoursCard: true,
      agreedFee: cls.baseFee,
      monthlyFreeHours: 0,
      validFrom: new Date(),
      sessionId,
      enrolledBy: user._id,
    }], { session });
    await Student.findByIdAndUpdate(studentId, { $addToSet: { classIds: cls._id } }, { session });
  }

  const [purchase] = await FlexiCardPurchase.create([{
    studentId, enrollmentId: enrollment._id, classId,
    studentName, studentAdmNo: student.admissionNo,
    className: cls.name, classCode: cls.classId,
    hoursPurchased: cls.hoursInTier,
    hoursRemaining: cls.hoursInTier,
    price: cls.baseFee,
    amountPaid: amountPaidNow,
    amountDue: cls.baseFee - amountPaidNow,
    status: 'ACTIVE',
    purchasedBy: user._id,
    notes,
  }], { session });

  logger.info(`[FEE] Flexi Card purchased: ${purchase.purchaseNo} | ${studentName} | ${cls.name} (${cls.hoursInTier} hrs) | Paid now: ${amountPaidNow}/${cls.baseFee}`);
  return purchase;
}

/** Called by feeService.collectPayment when allocations[].billType === 'FLEXI_CARD'. */
async function applyPaymentToPurchase(purchaseId, amount, session = null) {
  const p = await FlexiCardPurchase.findById(purchaseId).session(session);
  if (!p) throw new ErrorResponse('Flexi Card purchase not found', 404);
  if (amount > p.amountDue) {
    throw new ErrorResponse(`Allocation amount Rs.${amount} exceeds Flexi Card due Rs.${p.amountDue}`, 400);
  }
  p.amountPaid += amount;
  p.amountDue  -= amount;
  await p.save({ session });
  return { billType: 'FLEXI_CARD', billId: p._id, billNo: p.purchaseNo, amountUsed: amount };
}

/** Current balance summary + purchase history for a student (all tiers). */
async function getBalance(studentId) {
  const purchases = await FlexiCardPurchase.find({ studentId }).sort({ purchaseDate: -1 }).lean();
  const activeHoursRemaining = purchases
    .filter((p) => p.status === 'ACTIVE')
    .reduce((s, p) => s + p.hoursRemaining, 0);
  const totalAmountDue = purchases.reduce((s, p) => s + p.amountDue, 0);
  return { activeHoursRemaining, totalAmountDue, purchases };
}

/**
 * Attendance-integration hook. Called from attendance.service.js at every
 * flexi-hour deduction site. Returns null when the (studentId, classId)
 * enrollment is NOT a prepaid card — callers must fall through to the
 * legacy Student.consumedFlexiHours path unchanged in that case.
 *
 * When it IS a card enrollment: first reverses `previousHours` back onto
 * `previousPurchaseId` (if provided — this is the idempotent-edit case,
 * mirroring the legacy delta pattern), then deducts `newHours` from the
 * currently active purchase, clamped at hoursRemaining (no overage — the
 * card just runs out, matching the doc). Returns the purchase actually
 * charged (or null if none active) and the amount actually deducted, for
 * the caller to persist back onto the attendance/session record.
 */
async function syncAttendanceDeduction(studentId, classId, newHours, previousPurchaseId, previousHours, session = null) {
  const enrollment = await StudentEnrollment.findOne({ studentId, classId, status: 'Active' })
    .select('isPrepaidHoursCard')
    .session(session);
  if (!enrollment || !enrollment.isPrepaidHoursCard) return null;

  if (previousPurchaseId && previousHours) {
    const prev = await FlexiCardPurchase.findById(previousPurchaseId).session(session);
    if (prev) {
      const refund = Math.min(previousHours, prev.hoursConsumed);
      prev.hoursConsumed -= refund;
      prev.hoursRemaining = Math.min(prev.hoursPurchased, prev.hoursRemaining + refund);
      if (prev.hoursRemaining > 0 && prev.status === 'EXHAUSTED') prev.status = 'ACTIVE';
      await prev.save({ session });
    }
  }

  let hoursDeducted = 0;
  let purchaseId = null;

  if (newHours > 0) {
    const purchase = await FlexiCardPurchase.findOne({ studentId, classId, status: 'ACTIVE' })
      .sort({ purchaseDate: -1 })
      .session(session);
    if (purchase) {
      hoursDeducted = Math.min(newHours, purchase.hoursRemaining);
      purchase.hoursRemaining -= hoursDeducted;
      purchase.hoursConsumed  += hoursDeducted;
      if (purchase.hoursRemaining <= 0) purchase.status = 'EXHAUSTED';
      await purchase.save({ session });
      purchaseId = purchase._id;
    }
  }

  return { purchaseId, hoursDeducted };
}

async function getPurchases(studentId, query = {}) {
  const { page = 1, limit = 20 } = query;
  const skip  = (Number(page) - 1) * Number(limit);
  const total = await FlexiCardPurchase.countDocuments({ studentId });
  const data  = await FlexiCardPurchase.find({ studentId })
    .sort({ purchaseDate: -1 })
    .skip(skip).limit(Number(limit))
    .lean();
  return { total, page: Number(page), pages: Math.ceil(total / Number(limit)), data };
}

async function getPurchaseById(id) {
  const p = await FlexiCardPurchase.findById(id).lean();
  if (!p) throw new ErrorResponse('Flexi Card purchase not found', 404);
  return p;
}

module.exports = {
  purchaseFlexiCard,
  applyPaymentToPurchase,
  getBalance,
  syncAttendanceDeduction,
  getPurchases,
  getPurchaseById,
};
