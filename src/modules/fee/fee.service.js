const mongoose    = require('mongoose');
const FeeSettings  = require('./feeSettings.model');
const StudentEnrollment = require('./studentEnrollment.model');
const StudentWallet = require('./studentWallet.model');
const Invoice      = require('./invoice.model');
const Payment      = require('./payment.model');
const Student      = require('../student/student.model');
const Class        = require('../class/class.model');
const ErrorResponse = require('../../utils/errorResponse');
const logger       = require('../../config/logger');
const notificationService = require('../notification/notification.service');
const installmentService = require('./installment.service');
const flexiCardService = require('./flexiCard.service');
const academicSessionService = require('../academicSession/academicSession.service');

/**
 * Runs `fn(session)` inside a Mongo transaction, retrying on
 * TransientTransactionError — the driver/server's own documented signal
 * that the transaction was aborted for reasons outside the application's
 * control (e.g. a replica-set election or routing hiccup) and is safe to
 * simply retry. Without this, a purely environmental blip surfaces as a
 * hard failure on an otherwise-correct request.
 */
const runInTransaction = async (fn, maxAttempts = 4) => {
  const session = await mongoose.startSession();
  try {
    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      session.startTransaction();
      try {
        const result = await fn(session);
        await session.commitTransaction();
        return result;
      } catch (err) {
        await session.abortTransaction();
        const isTransient = err.errorLabels && err.errorLabels.includes('TransientTransactionError');
        if (isTransient && attempt < maxAttempts) {
          logger.warn(`[FEE] Transient transaction error on attempt ${attempt}, retrying: ${err.message}`);
          continue;
        }
        throw err;
      }
    }
  } finally {
    session.endSession();
  }
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

const getISTNow = () =>
  new Date(new Date().toLocaleString('en-US', { timeZone: 'Asia/Kolkata' }));

const getMonthYear = () => {
  const d = getISTNow();
  return { month: d.getMonth() + 1, year: d.getFullYear() };
};

const getDaysInMonth = (month, year) => new Date(year, month, 0).getDate();

/**
 * Get or create FeeSettings (singleton)
 */
const getSettings = async () => {
  let settings = await FeeSettings.findOne({ key: 'global' });
  if (!settings) {
    settings = await FeeSettings.create({ key: 'global' });
  }
  return settings;
};

/**
 * Get or create wallet for a student
 */
const getOrCreateWallet = async (studentId, studentName = '', studentAdmNo = '') => {
  let wallet = await StudentWallet.findOne({ studentId });
  if (!wallet) {
    wallet = await StudentWallet.create({ studentId, studentName, studentAdmNo });
  }
  return wallet;
};

/**
 * Apply a payment amount to one invoice. Shared by the legacy FIFO
 * auto-settle path and the new explicit payment-allocation path — same
 * math either way.
 */
const applyPaymentToInvoice = async (invoiceId, amount, session = null) => {
  const invoice = await Invoice.findById(invoiceId).session(session);
  if (!invoice) throw new ErrorResponse('Invoice not found', 404);
  if (amount > invoice.netDue) {
    throw new ErrorResponse(`Allocation amount Rs.${amount} exceeds invoice due Rs.${invoice.netDue}`, 400);
  }
  invoice.amountPaid += amount;
  invoice.netDue     -= amount;
  invoice.walletAmountUsed += amount;
  invoice.status = invoice.netDue <= 0 ? 'PAID' : 'PARTIAL';
  await invoice.save({ session });
  return { billType: 'INVOICE', billId: invoice._id, billNo: invoice.invoiceNo, amountUsed: amount };
};

/**
 * Auto-settle pending invoices from wallet balance
 * Oldest UNPAID/PARTIAL invoices are settled first (FIFO)
 */
const autoSettleFromWallet = async (studentId, session = null) => {
  const wallet = await StudentWallet.findOne({ studentId }).session(session);
  if (!wallet || wallet.balance <= 0) return [];

  const pendingInvoices = await Invoice.find({
    studentId,
    status: { $in: ['UNPAID', 'PARTIAL'] },
  })
    .sort({ billingYear: 1, billingMonth: 1 })
    .session(session);

  const settled = [];
  let remaining = wallet.balance;

  for (const invoice of pendingInvoices) {
    if (remaining <= 0) break;

    const due = invoice.netDue - invoice.amountPaid;
    if (due <= 0) continue;

    const use = Math.min(remaining, due);
    const applied = await applyPaymentToInvoice(invoice._id, use, session);

    remaining -= use;
    settled.push({ invoiceId: applied.billId, invoiceNo: applied.billNo, amountUsed: applied.amountUsed });
  }

  if (settled.length > 0) {
    const totalUsed = settled.reduce((sum, s) => sum + s.amountUsed, 0);
    wallet.totalSettled += totalUsed;
    wallet.balance = remaining;
    await wallet.save({ session });
  }

  return settled;
};

/**
 * Sum of outstanding (UNPAID/PARTIAL) invoice dues for a student, scoped to
 * one academic session. Used to surface carried-over dues at promotion time
 * and in the fee summary/status endpoints — invoices themselves are never
 * merged or rewritten across sessions, this only reports what's already there.
 */
const getPendingDuesForSession = async (studentId, sessionId) => {
  const invoices = await Invoice.find({
    studentId,
    sessionId,
    status: { $in: ['UNPAID', 'PARTIAL'] },
  }).lean();
  return {
    count: invoices.length,
    amount: invoices.reduce((sum, i) => sum + i.netDue, 0),
  };
};

/**
 * Remove classId from Student.classIds, but only if the student has no other
 * Active enrollment for that same class — attendance/roster reads classIds
 * independently of enrollment status, so this must stay in sync whenever an
 * enrollment stops being Active.
 */
const removeClassIdIfNoActiveEnrollment = async (studentId, classId) => {
  const stillActive = await StudentEnrollment.exists({ studentId, classId, status: 'Active' });
  if (!stillActive) {
    await Student.findByIdAndUpdate(studentId, { $pull: { classIds: classId } });
  }
};

// ─── SERVICE ──────────────────────────────────────────────────────────────────

class FeeService {

  // ══════════════════════════════════════════════════════════════════════════
  // FEE SETTINGS
  // ══════════════════════════════════════════════════════════════════════════

  async getSettings() {
    return getSettings();
  }

  async updateSettings(data, user) {
    const allowed = [
      'flexiHourlyRate', 'flexiGracePeriodMinutes',
      'invoiceDueDay', 'lateFineAmount', 'autoInvoiceEnabled',
    ];
    const update = {};
    allowed.forEach(k => { if (data[k] !== undefined) update[k] = data[k]; });
    update.lastUpdatedBy = user._id;

    const settings = await FeeSettings.findOneAndUpdate(
      { key: 'global' },
      { $set: update },
      { new: true, upsert: true }
    );
    logger.info(`[FEE] Settings updated by ${user._id}`);
    return settings;
  }

  // ══════════════════════════════════════════════════════════════════════════
  // ENROLLMENT
  // ══════════════════════════════════════════════════════════════════════════

  async enrollStudent(body, user) {
    const { studentId, classId, agreedFee, discountReason, validFrom, validUntil, notes, hoursAssigned } = body;

    const [student, cls] = await Promise.all([
      Student.findById(studentId).select('firstName lastName admissionNo parentUserId classIds').lean(),
      Class.findById(classId).select('name classId classType baseFee feeType monthlyFreeHours status installmentTemplate isPrepaidHoursCard').lean(),
    ]);

    if (!student) throw new ErrorResponse('Student not found', 404);
    if (!cls)     throw new ErrorResponse('Class not found', 404);
    if (cls.status !== 'Active') throw new ErrorResponse('Class is not active', 400);

    // Check duplicate active enrollment
    const existing = await StudentEnrollment.findOne({
      studentId, classId, status: 'Active',
    });
    if (existing) throw new ErrorResponse('Student is already enrolled in this class', 409);

    // FLEX_TIME (Flexible Time) classes bill per hour assigned — baseFee is
    // the hourly rate, not a flat fee. hoursAssigned is required here (unless
    // an admin explicitly overrides with agreedFee) so this can never fall
    // through to a silent Rs.0 / "Free" enrollment.
    const isFlexTime = cls.classType === 'FLEX_TIME';
    if (isFlexTime && agreedFee === undefined && !(Number(hoursAssigned) > 0)) {
      throw new ErrorResponse('hoursAssigned (> 0) is required to enroll in a Flexible Time class', 400);
    }
    const flexiHoursAssigned = isFlexTime ? Number(hoursAssigned || 0) : 0;

    const studentName = `${student.firstName} ${student.lastName}`.trim();
    const finalFee    = agreedFee !== undefined
      ? Number(agreedFee)
      : (isFlexTime ? (cls.baseFee || 0) * flexiHoursAssigned : (cls.baseFee || 0));
    const sessionId   = body.sessionId || (await academicSessionService.getCurrentActiveSessionId());

    const enrollment = await StudentEnrollment.create({
      studentId,
      classId,
      studentName,
      studentAdmNo:     student.admissionNo,
      className:        cls.name,
      classCode:        cls.classId,
      classType:        cls.classType,
      feeType:          cls.feeType || 'MONTHLY',
      agreedFee:        finalFee,
      discountReason:   discountReason || '',
      monthlyFreeHours: cls.monthlyFreeHours || 0,
      isPrepaidHoursCard: cls.isPrepaidHoursCard || false,
      flexiHoursAssigned,
      validFrom:        validFrom ? new Date(validFrom) : new Date(),
      validUntil:       validUntil ? new Date(validUntil) : null,
      sessionId,
      enrolledBy:       user._id,
      notes:            notes || '',
    });

    // Generate the concrete installment/one-time-fee schedule once, up
    // front — these fee types are billed exclusively through Installment
    // docs and must never be re-picked-up by the monthly Invoice cron.
    if (cls.feeType === 'ONE_TIME' || cls.feeType === 'INSTALLMENT' || isFlexTime) {
      await installmentService.generateInstallmentsForEnrollment(enrollment, cls, user);
    }

    // Ensure wallet exists
    await getOrCreateWallet(studentId, studentName, student.admissionNo);

    // Keep Student.classIds (attendance/roster/timing-clash side) in sync with
    // this billing enrollment — without this, the student is billed here but
    // invisible to attendance/roster, which reads classIds separately.
    await Student.findByIdAndUpdate(studentId, { $addToSet: { classIds: cls._id } });

    logger.info(`[FEE] Enrolled: ${student.admissionNo} → ${cls.name} | Fee: ${finalFee}`);
    return enrollment;
  }

  /**
   * Assign (more) Flexi Time hours to a student for a FLEX_TIME class.
   * If no Active enrollment exists yet for this student+class, this is the
   * first assignment and simply delegates to enrollStudent. Otherwise it
   * tops up the existing enrollment: flexiHoursAssigned and agreedFee both
   * grow by hoursAssigned * baseFee, and a fresh UNPAID Installment row is
   * created for just the incremental amount — never mutating installments
   * that already exist (and may already be paid).
   */
  async assignFlexiHours(body, user) {
    const { studentId, classId, hoursAssigned } = body;
    const hours = Number(hoursAssigned);
    if (!(hours > 0)) throw new ErrorResponse('hoursAssigned must be a positive number', 400);

    const cls = await Class.findById(classId).select('name classId classType baseFee status').lean();
    if (!cls) throw new ErrorResponse('Class not found', 404);
    if (cls.classType !== 'FLEX_TIME') throw new ErrorResponse('This class is not a Flexible Time class', 400);
    if (cls.status !== 'Active') throw new ErrorResponse('Class is not active', 400);

    const enrollment = await StudentEnrollment.findOne({ studentId, classId, status: 'Active' });
    if (!enrollment) {
      // No enrollment yet — first assignment, route through the normal
      // enroll flow so validation/wallet/classIds-sync all stay in one place.
      return this.enrollStudent({ studentId, classId, hoursAssigned: hours }, user);
    }

    const amount = (cls.baseFee || 0) * hours;

    const Installment = require('./installment.model');
    const nextSeq = (await Installment.countDocuments({ enrollmentId: enrollment._id })) + 1;
    const [installment] = await Installment.create([{
      studentId,
      enrollmentId: enrollment._id,
      classId,
      studentName:  enrollment.studentName,
      studentAdmNo: enrollment.studentAdmNo,
      className:    enrollment.className,
      classCode:    enrollment.classCode,
      seq:          nextSeq,
      label:        `Flexi Time Top-up (${hours} hrs)`,
      amount,
      netDue:       amount,
      dueDate:      new Date(),
      status:       'UNPAID',
      generatedBy:  'admin',
      generatedByUser: user._id,
    }]);

    enrollment.flexiHoursAssigned = (enrollment.flexiHoursAssigned || 0) + hours;
    enrollment.agreedFee = (enrollment.agreedFee || 0) + amount;
    await enrollment.save();

    logger.info(`[FEE] Flexi hours assigned: ${enrollment.studentAdmNo} +${hours} hrs on ${cls.name} | Fee: ${amount}`);
    return { enrollment, installment };
  }

  async getEnrollments(studentId) {
    return StudentEnrollment.find({ studentId })
      .populate('classId', 'name classId classType baseFee startTime endTime days')
      .sort({ createdAt: -1 })
      .lean();
  }

  // Session-wide enrollment list — e.g. all Active enrollments for a session,
  // used by bulk operations like promotion (as opposed to getEnrollments above,
  // which is scoped to a single student).
  async getEnrollmentsBySession(query = {}) {
    const { sessionId, status, classId, page = 1, limit = 500 } = query;
    const filter = {};
    if (sessionId) filter.sessionId = sessionId;
    if (status)    filter.status    = status;
    if (classId)   filter.classId   = classId;

    const skip  = (Number(page) - 1) * Number(limit);
    const total = await StudentEnrollment.countDocuments(filter);
    const data  = await StudentEnrollment.find(filter)
      .populate('classId', 'name classId classType baseFee startTime endTime days')
      .sort({ className: 1, studentName: 1 })
      .skip(skip).limit(Number(limit))
      .lean();

    return { total, page: Number(page), pages: Math.ceil(total / Number(limit)), count: data.length, data };
  }

  async updateEnrollment(id, data, user) {
    const allowed = ['agreedFee', 'discountReason', 'validUntil', 'status', 'notes', 'monthlyFreeHours'];
    const update  = {};
    allowed.forEach(k => { if (data[k] !== undefined) update[k] = data[k]; });

    const before = await StudentEnrollment.findById(id);
    if (!before) throw new ErrorResponse('Enrollment not found', 404);

    const enrollment = await StudentEnrollment.findByIdAndUpdate(id, { $set: update }, { new: true, runValidators: true });

    // Keep Student.classIds in sync when Active status changes either way —
    // attendance/roster reads classIds independently of enrollment status.
    if (update.status !== undefined && update.status !== before.status) {
      if (before.status === 'Active' && update.status !== 'Active') {
        await removeClassIdIfNoActiveEnrollment(enrollment.studentId, enrollment.classId);
      } else if (before.status !== 'Active' && update.status === 'Active') {
        await Student.findByIdAndUpdate(enrollment.studentId, { $addToSet: { classIds: enrollment.classId } });
      }
    }

    logger.info(`[FEE] Enrollment ${id} updated by ${user._id}`);
    return enrollment;
  }

  async cancelEnrollment(id, user) {
    const before = await StudentEnrollment.findById(id);
    if (!before) throw new ErrorResponse('Enrollment not found', 404);

    const enrollment = await StudentEnrollment.findByIdAndUpdate(
      id, { status: 'Cancelled' }, { new: true }
    );

    if (before.status === 'Active') {
      await removeClassIdIfNoActiveEnrollment(enrollment.studentId, enrollment.classId);
    }

    logger.info(`[FEE] Enrollment ${id} cancelled by ${user._id}`);
    return enrollment;
  }

  // ══════════════════════════════════════════════════════════════════════════
  // INVOICE GENERATION
  // ══════════════════════════════════════════════════════════════════════════

  /**
   * Generate invoice for a student for given month/year
   * Can be called by cron (system) or admin (manual)
   */
  async generateInvoice(studentId, month, year, generatedBy = 'system', userId = null) {
    const settings = await getSettings();

    const student = await Student.findById(studentId)
      .select('firstName lastName admissionNo parentUserId freeFlexiHours paidFlexiHours consumedFlexiHours')
      .lean();
    if (!student) throw new ErrorResponse('Student not found', 404);

    const studentName = `${student.firstName} ${student.lastName}`.trim();

    // Check duplicate invoice
    const exists = await Invoice.findOne({ studentId, billingMonth: month, billingYear: year });
    if (exists) throw new ErrorResponse(`Invoice already exists for ${month}/${year}`, 409);

    // ── Step 1: Get active enrollments ────────────────────────────────────────
    const enrollments = await StudentEnrollment.find({
      studentId,
      status: 'Active',
      validFrom: { $lte: new Date(year, month - 1, 1) },
      $or: [
        { validUntil: null },
        { validUntil: { $gte: new Date(year, month - 1, 1) } },
      ],
    }).populate('classId', 'name classId classType feeType lateFineApplicable').lean();

    // ── Step 2: Build tuition lines (skip FREE feeType and HOURS_BASED) ───────
    const tuitionLines = [];
    let tuitionTotal   = 0;

    for (const enr of enrollments) {
      // FREE never bills; HOURS_BASED (incl. Flexi Card) is billed via its
      // own overage/prepaid mechanisms, not tuitionLines; ONE_TIME and
      // INSTALLMENT are billed exclusively through the Installment
      // collection generated once at enrollment — including them here
      // would silently re-bill them every month. FLEX_TIME is likewise
      // billed exclusively through one-time Installment rows (baseFee *
      // hoursAssigned, generated at enrollStudent/assignFlexiHours time).
      if (
        enr.feeType === 'FREE' ||
        enr.feeType === 'ONE_TIME' ||
        enr.feeType === 'INSTALLMENT' ||
        enr.classType === 'HOURS_BASED' ||
        enr.classType === 'FLEX_TIME'
      ) continue;
      tuitionLines.push({
        enrollmentId: enr._id,
        classId:      enr.classId?._id || enr.classId,
        className:    enr.className,
        classCode:    enr.classCode,
        agreedFee:    enr.agreedFee,
        feeType:      enr.feeType,
      });
      tuitionTotal += enr.agreedFee;
    }

    // ── Step 3: Flexi negative charge ─────────────────────────────────────────
    // Negative hours from previous month (stored on student).
    // consumedFlexiHours (overstay/idle-time deductions from attendance) draws down
    // the free+paid pool; once consumption exceeds the pool, the excess is billed.
    const negativeHours  = Math.abs(Math.min(0, student.freeFlexiHours + student.paidFlexiHours - (student.consumedFlexiHours || 0)));
    const flexiCharge    = negativeHours > 0 ? negativeHours * settings.flexiHourlyRate : 0;
    const flexiChargeRate = settings.flexiHourlyRate;

    // ── Step 4: Late fine ─────────────────────────────────────────────────────
    let lateFine = 0;
    const prevMonth = month === 1 ? 12 : month - 1;
    const prevYear  = month === 1 ? year - 1 : year;
    const prevInvoice = await Invoice.findOne({
      studentId,
      billingMonth: prevMonth,
      billingYear:  prevYear,
      status: { $in: ['UNPAID', 'PARTIAL'] },
    });

    if (prevInvoice) {
      // Check if any enrolled class has late fine applicable
      const hasLateFineClass = enrollments.some(e => e.classId?.lateFineApplicable);
      if (hasLateFineClass) {
        lateFine = settings.lateFineAmount;
      }
    }

    // ── Step 5: Totals ────────────────────────────────────────────────────────
    const totalDue = tuitionTotal + flexiCharge + lateFine;
    const daysInMonth = getDaysInMonth(month, year);
    const dueDate  = new Date(year, month - 1, settings.invoiceDueDay || 1);

    // ── Step 6: Wallet pre-deduction ──────────────────────────────────────────
    const wallet   = await getOrCreateWallet(studentId, studentName, student.admissionNo);
    const walletUse = Math.min(wallet.balance, totalDue);
    const netDue   = totalDue - walletUse;

    const sessionId = await academicSessionService.getCurrentActiveSessionId();

    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      // Create invoice
      const invoice = await Invoice.create([{
        studentId,
        studentName,
        studentAdmNo:     student.admissionNo,
        billingMonth:     month,
        billingYear:      year,
        tuitionLines,
        tuitionTotal,
        flexiNegativeHours: negativeHours,
        flexiChargeRate,
        flexiCharge,
        lateFine,
        totalDue,
        walletAmountUsed: walletUse,
        netDue,
        amountPaid:       walletUse,
        status:           netDue <= 0 ? 'PAID' : 'UNPAID',
        dueDate,
        sessionId,
        generatedBy,
        generatedByUser:  userId,
      }], { session });

      // Deduct from wallet
      if (walletUse > 0) {
        await StudentWallet.findOneAndUpdate(
          { studentId },
          { $inc: { balance: -walletUse, totalSettled: walletUse } },
          { session }
        );
      }

      // Reset negative flexi hours (and the consumption that caused it)
      if (negativeHours > 0) {
        await Student.findByIdAndUpdate(studentId, {
          $set: { freeFlexiHours: 0, paidFlexiHours: 0, consumedFlexiHours: 0 },
        }, { session });
      }

      await session.commitTransaction();

      // Notify parent
      if (student.parentUserId && netDue > 0) {
        notificationService.notifyUser(
          String(student.parentUserId),
          '🧾 New Invoice Generated',
          `${studentName} ka ${month}/${year} ka bill ready hai. Total: Rs.${totalDue}. Due: Rs.${netDue}.`,
          { type: 'invoice_generated', invoiceId: String(invoice[0]._id) }
        ).catch(err => logger.error('Invoice notification failed:', err.message));
      }

      logger.info(`[FEE] Invoice generated: ${invoice[0].invoiceNo} | ${studentName} | ${month}/${year} | Due: ${netDue}`);
      return invoice[0];

    } catch (err) {
      await session.abortTransaction();
      throw err;
    } finally {
      session.endSession();
    }
  }

  /**
   * Admin: Bulk generate invoices for all active students (monthly cron)
   */
  async generateMonthlyInvoices(month, year, userId = null) {
    const students = await Student.find({ status: 'Active' }).select('_id').lean();
    const results  = { success: 0, skipped: 0, failed: 0, errors: [] };

    for (const s of students) {
      try {
        // Check if has any active enrollment
        const hasEnrollment = await StudentEnrollment.exists({ studentId: s._id, status: 'Active' });
        if (!hasEnrollment) { results.skipped++; continue; }

        await this.generateInvoice(s._id, month, year, userId ? 'admin' : 'system', userId);
        results.success++;
      } catch (err) {
        if (err.statusCode === 409) { results.skipped++; continue; } // Already exists
        results.failed++;
        results.errors.push({ studentId: s._id, error: err.message });
        logger.error(`[FEE] Invoice generation failed for ${s._id}: ${err.message}`);
      }
    }

    logger.info(`[FEE] Bulk invoice done: ${results.success} generated, ${results.skipped} skipped, ${results.failed} failed`);
    return results;
  }

  async getInvoices(studentId, query = {}) {
    const { month, year, status, page = 1, limit = 12 } = query;
    const filter = { studentId };
    if (month)  filter.billingMonth = Number(month);
    if (year)   filter.billingYear  = Number(year);
    if (status) filter.status       = status;

    const skip  = (Number(page) - 1) * Number(limit);
    const total = await Invoice.countDocuments(filter);
    const data  = await Invoice.find(filter)
      .sort({ billingYear: -1, billingMonth: -1 })
      .skip(skip).limit(Number(limit))
      .lean();

    return { total, page: Number(page), pages: Math.ceil(total / Number(limit)), data };
  }

  // Session-wide invoice list/report across all students — for reporting and
  // session-scoped views (as opposed to getInvoices above, which is scoped to
  // a single student).
  async getInvoicesBySession(query = {}) {
    const { sessionId, status, month, year, page = 1, limit = 100 } = query;
    const filter = {};
    if (sessionId) filter.sessionId    = sessionId;
    if (status)    filter.status       = status;
    if (month)     filter.billingMonth = Number(month);
    if (year)      filter.billingYear  = Number(year);

    const skip  = (Number(page) - 1) * Number(limit);
    const total = await Invoice.countDocuments(filter);
    const data  = await Invoice.find(filter)
      .sort({ billingYear: -1, billingMonth: -1 })
      .skip(skip).limit(Number(limit))
      .lean();

    return { total, page: Number(page), pages: Math.ceil(total / Number(limit)), count: data.length, data };
  }

  async getInvoiceById(id) {
    const invoice = await Invoice.findById(id).lean();
    if (!invoice) throw new ErrorResponse('Invoice not found', 404);
    return invoice;
  }

  async updateInvoice(id, data, user) {
    const allowed = ['adjustmentAmount', 'adjustmentReason', 'status', 'notes', 'lateFine'];
    const update  = {};
    allowed.forEach(k => { if (data[k] !== undefined) update[k] = data[k]; });

    // Recalculate netDue if adjustment changed
    const invoice = await Invoice.findById(id);
    if (!invoice) throw new ErrorResponse('Invoice not found', 404);

    if (update.adjustmentAmount !== undefined) {
      const adj = Number(update.adjustmentAmount);
      invoice.adjustmentAmount = adj;
      invoice.netDue = Math.max(0, invoice.totalDue - invoice.amountPaid - adj);
      // Keep status consistent with the recalculated netDue in both
      // directions — previously this only ever moved status *to* PAID,
      // never back off it when an adjustment put money due again.
      invoice.status = invoice.netDue === 0
        ? 'PAID'
        : (invoice.amountPaid > 0 ? 'PARTIAL' : 'UNPAID');
    }

    Object.assign(invoice, update);
    await invoice.save();

    logger.info(`[FEE] Invoice ${id} updated by ${user._id}`);
    return invoice;
  }

  // ══════════════════════════════════════════════════════════════════════════
  // PAYMENTS
  // ══════════════════════════════════════════════════════════════════════════

  /**
   * Collect a payment. Two modes:
   *  - Default (no `allocations` in body): exact legacy behavior — full
   *    amount credited to wallet, then auto-settled FIFO across pending
   *    Invoices.
   *  - Explicit allocations: staff chooses exactly which bill(s) — of any
   *    type (Invoice / Installment / Flexi Card) — this payment covers,
   *    and how much goes to each. Any amount left over after allocations
   *    still lands in the wallet as advance, same as today.
   */
  async collectPayment(body, user) {
    const { studentId, amount, paymentMode, transactionRef, paymentDate, remarks, allocations } = body;

    const student = await Student.findById(studentId)
      .select('firstName lastName admissionNo parentUserId').lean();
    if (!student) throw new ErrorResponse('Student not found', 404);

    const studentName = `${student.firstName} ${student.lastName}`.trim();
    // Idempotent find-or-create, run once before the retryable transaction
    // below — safe to have already happened on a prior retry attempt.
    await getOrCreateWallet(studentId, studentName, student.admissionNo);

    const result = await runInTransaction(async (session) => {
      // Re-fetched fresh on every attempt (including retries) so a retried
      // transaction never re-applies mutations on top of an already-
      // mutated-in-memory wallet object from a prior, aborted attempt.
      const wallet = await StudentWallet.findOne({ studentId }).session(session);
      const walletBefore = wallet.balance;

      let applied;      // polymorphic list: [{billType, billId, billNo, amountUsed}]
      let walletAfter;

      if (Array.isArray(allocations) && allocations.length > 0) {
        // ── Explicit allocation mode ──
        const sumAlloc = allocations.reduce((s, a) => s + Number(a.amount), 0);
        if (sumAlloc > Number(amount)) {
          throw new ErrorResponse(`Sum of allocations (Rs.${sumAlloc}) exceeds payment amount (Rs.${amount})`, 400);
        }

        applied = [];
        for (const a of allocations) {
          if (a.billType === 'INVOICE') {
            applied.push(await applyPaymentToInvoice(a.billId, Number(a.amount), session));
          } else if (a.billType === 'INSTALLMENT') {
            applied.push(await installmentService.applyPaymentToInstallment(a.billId, Number(a.amount), session));
          } else if (a.billType === 'FLEXI_CARD') {
            applied.push(await flexiCardService.applyPaymentToPurchase(a.billId, Number(a.amount), session));
          } else {
            throw new ErrorResponse(`Invalid billType: ${a.billType}`, 400);
          }
        }

        const advance = Number(amount) - sumAlloc;
        wallet.balance       += advance; // 0 when fully allocated
        wallet.totalReceived += Number(amount);
        wallet.totalSettled  += sumAlloc;
        await wallet.save({ session });
        walletAfter = wallet.balance;

      } else {
        // ── Legacy default mode — unchanged ──
        wallet.balance       += Number(amount);
        wallet.totalReceived += Number(amount);
        await wallet.save({ session });

        const settled = await autoSettleFromWallet(studentId, session);
        applied = settled.map(s => ({ billType: 'INVOICE', billId: s.invoiceId, billNo: s.invoiceNo, amountUsed: s.amountUsed }));
        walletAfter = wallet.balance;
      }

      const advanceAmount = walletAfter;
      const settledInvoicesLegacyShape = applied
        .filter(a => a.billType === 'INVOICE')
        .map(a => ({ invoiceId: a.billId, invoiceNo: a.billNo, amountUsed: a.amountUsed }));

      // Create payment record
      const [payment] = await Payment.create([{
        studentId,
        studentName,
        studentAdmNo:        student.admissionNo,
        amount:              Number(amount),
        paymentMode,
        transactionRef:      transactionRef || '',
        paymentDate:         paymentDate ? new Date(paymentDate) : new Date(),
        walletBalanceBefore: walletBefore,
        walletBalanceAfter:  walletAfter,
        settledInvoices:     settledInvoicesLegacyShape,
        allocations:         applied,
        advanceAmount,
        collectedBy:         user._id,
        collectedByName:     user.name || '',
        remarks:             remarks || '',
      }], { session });

      return { payment, applied, walletAfter, settledInvoicesLegacyShape };
    });

    const { payment, applied, walletAfter, settledInvoicesLegacyShape } = result;

    // Notify parent
    if (student.parentUserId) {
      notificationService.notifyUser(
        String(student.parentUserId),
        '✅ Payment Received',
        `Rs.${amount} received for ${studentName}. Receipt: ${payment.receiptNo}. Wallet balance: Rs.${walletAfter}.`,
        { type: 'payment_received', paymentId: String(payment._id) }
      ).catch(err => logger.error('Payment notification failed:', err.message));
    }

    logger.info(`[FEE] Payment collected: ${payment.receiptNo} | ${studentName} | Rs.${amount}`);
    return { payment, settledInvoices: settledInvoicesLegacyShape, allocations: applied, walletBalance: walletAfter };
  }

  /**
   * Purchase a Flexi Card tier. Activates the full hour bundle immediately;
   * amountPaidNow may be less than the tier price (doc §5.2) — the
   * remainder is collected later via collectPayment's allocations[] with
   * billType FLEXI_CARD. Every money-in event still produces a Payment
   * receipt, same as any other collection.
   */
  async purchaseFlexiCard(body, user) {
    const { studentId, classId, amountPaidNow = 0, paymentMode, transactionRef, remarks } = body;
    if (Number(amountPaidNow) > 0 && !paymentMode) {
      throw new ErrorResponse('paymentMode is required when amountPaidNow > 0', 400);
    }

    // Idempotent find-or-create, run once before the retryable transaction
    // below (getOrCreateWallet doesn't take a session, so it must not run
    // while a transaction is active on this connection).
    if (Number(amountPaidNow) > 0) {
      const student = await Student.findById(studentId).select('firstName lastName admissionNo').lean();
      if (!student) throw new ErrorResponse('Student not found', 404);
      const studentName = `${student.firstName} ${student.lastName}`.trim();
      await getOrCreateWallet(studentId, studentName, student.admissionNo);
    }

    const { purchase, payment } = await runInTransaction(async (session) => {
      const purchase = await flexiCardService.purchaseFlexiCard(
        { studentId, classId, amountPaidNow: Number(amountPaidNow), notes: remarks },
        user,
        session
      );

      let payment = null;
      if (Number(amountPaidNow) > 0) {
        // Re-fetched fresh on every attempt so a retried transaction never
        // re-applies mutations on top of an already-mutated-in-memory
        // wallet object from a prior, aborted attempt.
        const wallet = await StudentWallet.findOne({ studentId }).session(session);
        const walletBefore = wallet.balance;
        wallet.totalReceived += Number(amountPaidNow);
        await wallet.save({ session });

        [payment] = await Payment.create([{
          studentId,
          studentName: purchase.studentName,
          studentAdmNo: purchase.studentAdmNo,
          amount: Number(amountPaidNow),
          paymentMode,
          transactionRef: transactionRef || '',
          walletBalanceBefore: walletBefore,
          walletBalanceAfter: wallet.balance,
          allocations: [{ billType: 'FLEXI_CARD', billId: purchase._id, billNo: purchase.purchaseNo, amountUsed: Number(amountPaidNow) }],
          advanceAmount: wallet.balance,
          collectedBy: user._id,
          collectedByName: user.name || '',
          remarks: remarks || '',
        }], { session });
      }

      return { purchase, payment };
    });

    logger.info(`[FEE] Flexi Card purchase committed: ${purchase.purchaseNo}`);
    return { purchase, payment };
  }

  async getPayments(studentId, query = {}) {
    const { page = 1, limit = 20 } = query;
    const skip  = (Number(page) - 1) * Number(limit);
    const total = await Payment.countDocuments({ studentId });
    const data  = await Payment.find({ studentId })
      .populate('collectedBy', 'name email')
      .populate('editHistory.editedBy', 'name email')
      .sort({ paymentDate: -1 })
      .skip(skip).limit(Number(limit))
      .lean();
    return { total, page: Number(page), pages: Math.ceil(total / Number(limit)), data };
  }

  async getPaymentById(id) {
    const p = await Payment.findById(id)
      .populate('collectedBy', 'name email')
      .populate('editHistory.editedBy', 'name email')
      .lean();
    if (!p) throw new ErrorResponse('Payment not found', 404);
    return p;
  }

  /**
   * Edit an existing payment record. Admin can correct data-entry mistakes
   * after the fact — paymentDate (backdate/correct), paymentMode,
   * transactionRef, remarks, and even the amount itself.
   *
   * `amount` is the one field with side effects: it drives the wallet
   * balance. Because we don't maintain a reversal path for the specific
   * invoices/installments/flexi-card bills this payment already settled
   * (`allocations`), a reduced amount is only allowed down to the amount
   * already allocated to bills — the portion that was sitting as
   * unallocated advance is what's free to adjust. The delta (new − old) is
   * applied to the wallet's current balance and totalReceived so the
   * wallet stays correct going forward. Historical walletBalanceBefore/
   * After snapshots on THIS payment are refreshed too; snapshots on other
   * (later) payments are left as-is — same tradeoff already accepted
   * elsewhere in this module for retried/edited flows.
   *
   * Every successful change — including a plain paymentDate correction —
   * is appended to `editHistory` (who/when/what/why), mirroring the
   * Attendance module's audit-trail pattern.
   */
  async updatePayment(id, body, user) {
    const { amount, paymentMode, transactionRef, paymentDate, remarks, note } = body;

    const trackedFields = ['amount', 'paymentMode', 'transactionRef', 'paymentDate', 'remarks'];
    const stringify = (v) => {
      if (v === undefined || v === null) return null;
      if (v instanceof Date) return v.toISOString();
      if (typeof v === 'number') return String(v);
      return v;
    };

    const result = await runInTransaction(async (session) => {
      const payment = await Payment.findById(id).session(session);
      if (!payment) throw new ErrorResponse('Payment not found', 404);

      const setFields = {};
      if (paymentMode !== undefined) setFields.paymentMode = paymentMode;
      if (transactionRef !== undefined) setFields.transactionRef = transactionRef;
      if (paymentDate !== undefined) setFields.paymentDate = new Date(paymentDate);
      if (remarks !== undefined) setFields.remarks = remarks;

      // ── Amount change (affects wallet) ──
      if (amount !== undefined && Number(amount) !== payment.amount) {
        const newAmount = Number(amount);
        const sumAllocated = (payment.allocations || []).reduce((s, a) => s + Number(a.amountUsed || 0), 0);

        if (newAmount < sumAllocated) {
          throw new ErrorResponse(
            `New amount (Rs.${newAmount}) can't be less than the amount already allocated to bills (Rs.${sumAllocated}). Reduce/undo the allocation first.`,
            400
          );
        }

        const delta = newAmount - payment.amount; // +ve = more received, -ve = less received
        const wallet = await StudentWallet.findOne({ studentId: payment.studentId }).session(session);
        if (!wallet) throw new ErrorResponse('Student wallet not found', 404);

        wallet.balance       += delta;
        wallet.totalReceived += delta;
        if (wallet.balance < 0) {
          throw new ErrorResponse('This change would make the wallet balance negative. Not allowed.', 400);
        }
        await wallet.save({ session });

        setFields.amount              = newAmount;
        setFields.walletBalanceAfter  = payment.walletBalanceAfter + delta;
        setFields.advanceAmount       = payment.advanceAmount + delta;
      }

      // ── Build audit diff ──
      const afterPreview = { ...payment.toObject(), ...setFields };
      const beforeValues = {};
      const afterValues  = {};
      const changedFields = [];

      trackedFields.forEach((field) => {
        const before = stringify(payment[field]);
        const after  = stringify(afterPreview[field]);
        if (before !== after) {
          changedFields.push(field);
          beforeValues[field] = before;
          afterValues[field]  = after;
        }
      });

      if (changedFields.length === 0) {
        return payment; // nothing to change
      }

      Object.assign(payment, setFields);
      payment.editHistory.push({
        editedBy:      user._id,
        editedByRole:  user.role,
        editedAt:      new Date(),
        changedFields,
        beforeValues,
        afterValues,
        note: (note || '').trim() || `Updated by ${user.name || user.email || user.role}`,
      });

      await payment.save({ session });
      return payment;
    });

    logger.info(`[FEE] Payment edited: ${result.receiptNo} by ${user.name || user._id}`);
    return Payment.findById(result._id)
      .populate('collectedBy', 'name email')
      .populate('editHistory.editedBy', 'name email')
      .lean();
  }

  async getPaymentHistory(id) {
    const p = await Payment.findById(id)
      .select('receiptNo studentName amount editHistory')
      .populate('editHistory.editedBy', 'name email')
      .lean();
    if (!p) throw new ErrorResponse('Payment not found', 404);
    return {
      receiptNo:   p.receiptNo,
      studentName: p.studentName,
      amount:      p.amount,
      editHistory: p.editHistory || [],
    };
  }

  // ══════════════════════════════════════════════════════════════════════════
  // WALLET
  // ══════════════════════════════════════════════════════════════════════════

  async getWallet(studentId) {
    const wallet = await StudentWallet.findOne({ studentId }).lean();
    if (!wallet) {
      const student = await Student.findById(studentId).select('firstName lastName admissionNo').lean();
      if (!student) throw new ErrorResponse('Student not found', 404);
      return getOrCreateWallet(studentId, `${student.firstName} ${student.lastName}`.trim(), student.admissionNo);
    }
    return wallet;
  }

  // Admin: Manual wallet adjustment (credit/debit)
  async adjustWallet(studentId, amount, reason, user) {
    const wallet = await StudentWallet.findOne({ studentId });
    if (!wallet) throw new ErrorResponse('Wallet not found', 404);

    const adj = Number(amount); // positive = credit, negative = debit
    if (wallet.balance + adj < 0) throw new ErrorResponse('Insufficient wallet balance for debit', 400);

    wallet.balance += adj;
    if (adj > 0) wallet.totalReceived += adj;
    await wallet.save();

    logger.info(`[FEE] Wallet adjusted: ${studentId} | ${adj > 0 ? '+' : ''}${adj} | by ${user._id} | ${reason}`);
    return wallet;
  }

  // ══════════════════════════════════════════════════════════════════════════
  // MONTHLY FREE HOURS CREDIT (called by cron on 1st)
  // ══════════════════════════════════════════════════════════════════════════

  async creditMonthlyFreeHours() {
    const enrollments = await StudentEnrollment.find({
      status: 'Active',
      monthlyFreeHours: { $gt: 0 },
    }).lean();

    let credited = 0;
    for (const enr of enrollments) {
      try {
        await Student.findByIdAndUpdate(enr.studentId, {
          $inc: { freeFlexiHours: enr.monthlyFreeHours },
        });
        credited++;
        logger.info(`[FEE] Free hours credited: ${enr.studentAdmNo} +${enr.monthlyFreeHours} hrs`);
      } catch (err) {
        logger.error(`[FEE] Free hours credit failed for ${enr.studentId}: ${err.message}`);
      }
    }
    return credited;
  }

  // ══════════════════════════════════════════════════════════════════════════
  // REPORTS
  // ══════════════════════════════════════════════════════════════════════════

  async getDefaulters(query = {}) {
    const { month, year } = query;
    const { month: cm, year: cy } = getMonthYear();
    const m = month ? Number(month) : cm;
    const y = year  ? Number(year)  : cy;

    const invoices = await Invoice.find({
      billingMonth: m, billingYear: y,
      status: { $in: ['UNPAID', 'PARTIAL'] },
    })
      .populate('studentId', 'firstName lastName admissionNo parentUserId')
      .sort({ netDue: -1 })
      .lean();

    return {
      month: m, year: y,
      total: invoices.length,
      totalPending: invoices.reduce((s, i) => s + i.netDue, 0),
      data: invoices,
    };
  }

  async getCollectionReport(query = {}) {
    const { month, year } = query;
    const { month: cm, year: cy } = getMonthYear();
    const m = month ? Number(month) : cm;
    const y = year  ? Number(year)  : cy;

    const startDate = new Date(y, m - 1, 1);
    const endDate   = new Date(y, m, 1);

    const payments = await Payment.find({
      paymentDate: { $gte: startDate, $lt: endDate },
    }).populate('collectedBy', 'name').lean();

    const totalCollected = payments.reduce((s, p) => s + p.amount, 0);
    const byMode = {};
    payments.forEach(p => {
      byMode[p.paymentMode] = (byMode[p.paymentMode] || 0) + p.amount;
    });

    return {
      month: m, year: y,
      totalCollected,
      totalTransactions: payments.length,
      byMode,
      payments,
    };
  }

  async getStudentFeeSummary(studentId) {
    const [wallet, pendingInvoices, recentPayments, enrollments, currentSessionId] = await Promise.all([
      this.getWallet(studentId),
      Invoice.find({ studentId, status: { $in: ['UNPAID', 'PARTIAL'] } }).lean(),
      Payment.find({ studentId }).sort({ paymentDate: -1 }).limit(5).lean(),
      StudentEnrollment.find({ studentId, status: 'Active' })
        .populate('classId', 'name classId').lean(),
      academicSessionService.getCurrentActiveSessionId(),
    ]);

    // Split pending invoices by whether they belong to the currently Active
    // session — dues from a prior session are never merged into the new one
    // (see promoteOneStudent), so this is the only place that surfaces them
    // as "carried over" rather than letting them blend into one lump sum.
    const isCurrent = (i) => currentSessionId && String(i.sessionId) === String(currentSessionId);
    const currentInvoices = pendingInvoices.filter(isCurrent);
    const carriedOverInvoices = pendingInvoices.filter((i) => !isCurrent(i));

    return {
      walletBalance:   wallet.balance,
      totalPending:    pendingInvoices.reduce((s, i) => s + i.netDue, 0),
      pendingInvoices: pendingInvoices.length,
      currentSessionPending: {
        amount: currentInvoices.reduce((s, i) => s + i.netDue, 0),
        count: currentInvoices.length,
      },
      carriedOverPending: {
        amount: carriedOverInvoices.reduce((s, i) => s + i.netDue, 0),
        count: carriedOverInvoices.length,
      },
      recentPayments,
      activeEnrollments: enrollments,
    };
  }

  // ══════════════════════════════════════════════════════════════════════════
  // STUDENT FEE STATUS — per-program due/paid breakdown across every fee
  // model (Invoice / Installment / Flexi Card). Answers "kis program ka
  // kitna baaki hai" — doc §6. Teacher redaction is handled entirely by
  // feeVisibilityGuard at the route layer, not here — this stays role-
  // agnostic and simply reports the truth.
  // ══════════════════════════════════════════════════════════════════════════

  async getStudentFeeStatus(studentId) {
    const Installment = require('./installment.model');

    const [enrollments, invoices, installments, flexiBalance, currentSessionId] = await Promise.all([
      StudentEnrollment.find({ studentId, status: 'Active' })
        .populate('classId', 'name classId feeType classType')
        .lean(),
      Invoice.find({ studentId, status: { $in: ['UNPAID', 'PARTIAL'] } }).lean(),
      Installment.find({ studentId, status: { $in: ['UNPAID', 'PARTIAL'] } }).sort({ dueDate: 1 }).lean(),
      flexiCardService.getBalance(studentId),
      academicSessionService.getCurrentActiveSessionId(),
    ]);

    const programs = enrollments.map((enr) => {
      const classId = String(enr.classId?._id || enr.classId);
      const relatedInvoices = invoices.filter((i) =>
        i.tuitionLines.some((l) => String(l.classId) === classId)
      );
      const relatedInstallments = installments.filter((i) => String(i.classId) === classId);
      const totalDue =
        relatedInvoices.reduce((s, i) => s + i.netDue, 0) +
        relatedInstallments.reduce((s, i) => s + i.netDue, 0);

      return {
        classId,
        className: enr.className,
        feeType: enr.feeType,
        classType: enr.classType,
        invoicesPending: relatedInvoices.length,
        installmentsPending: relatedInstallments.map((i) => ({
          installmentNo: i.installmentNo,
          seq: i.seq,
          label: i.label,
          amount: i.amount,
          netDue: i.netDue,
          dueDate: i.dueDate,
          status: i.status,
        })),
        totalDue,
      };
    });

    // Dues carried over from a non-Active session — Installment has no
    // sessionId yet, so only Invoice dues can be attributed this way; a
    // student's carried-over amount is always a subset of grandTotalDue,
    // never merged into or hidden from it.
    const carriedOverDue = invoices
      .filter((i) => !currentSessionId || String(i.sessionId) !== String(currentSessionId))
      .reduce((s, i) => s + i.netDue, 0);

    return {
      studentId,
      programs,
      flexiCard: flexiBalance,
      grandTotalDue: programs.reduce((s, p) => s + p.totalDue, 0) + flexiBalance.totalAmountDue,
      carriedOverDue,
    };
  }

  // ══════════════════════════════════════════════════════════════════════════
  // SESSION PROMOTION
  // ══════════════════════════════════════════════════════════════════════════

  /**
   * Promote/retain/close a single student's enrollment when moving from one
   * academic session to the next. Never mutates the fromSessionId
   * enrollment's own history beyond flipping its status — Attendance and
   * Invoice documents from the old session are never touched here.
   *
   * decision:
   *   'notContinuing' — the student is not moving to the new session. Old
   *                      enrollment is marked 'Left'. No new record.
   *   'promote'       — new StudentEnrollment created in toSessionId with a
   *                      (possibly different) newClassId; old marked 'Promoted'.
   *   'retain'        — same as 'promote' but old marked 'Retained' (student
   *                      stays in the same grade/class another year).
   */
  async promoteOneStudent(fromSessionId, toSessionId, { studentId, decision, newClassId }, user) {
    const oldEnrollment = await StudentEnrollment.findOne({
      studentId, sessionId: fromSessionId, status: 'Active',
    });
    if (!oldEnrollment) {
      throw new ErrorResponse('No Active enrollment found for this student in the source session', 404);
    }

    const pendingDuesFromOldSession = await getPendingDuesForSession(studentId, fromSessionId);

    if (decision === 'notContinuing') {
      oldEnrollment.status = 'Left';
      await oldEnrollment.save();
      return { studentId, decision, oldEnrollmentId: oldEnrollment._id, pendingDuesFromOldSession };
    }

    if (decision !== 'promote' && decision !== 'retain') {
      throw new ErrorResponse(`Unknown decision "${decision}"`, 400);
    }
    if (!newClassId) {
      throw new ErrorResponse(`newClassId is required for decision "${decision}"`, 400);
    }

    // Idempotency guard — safe to re-run a batch that partially succeeded.
    const already = await StudentEnrollment.findOne({
      studentId, classId: newClassId, sessionId: toSessionId, status: 'Active',
    });
    if (already) {
      return { studentId, decision, skipped: true, enrollmentId: already._id, pendingDuesFromOldSession };
    }

    const [student, cls] = await Promise.all([
      Student.findById(studentId).select('firstName lastName admissionNo').lean(),
      Class.findById(newClassId).lean(),
    ]);
    if (!student) throw new ErrorResponse('Student not found', 404);
    if (!cls || cls.status !== 'Active') throw new ErrorResponse('Target class not found or inactive', 400);

    const result = await runInTransaction(async (session) => {
      const [newEnrollment] = await StudentEnrollment.create([{
        studentId,
        classId: newClassId,
        studentName: `${student.firstName} ${student.lastName}`.trim(),
        studentAdmNo: student.admissionNo,
        className: cls.name,
        classCode: cls.classId,
        classType: cls.classType,
        feeType: cls.feeType || 'MONTHLY',
        agreedFee: oldEnrollment.agreedFee,
        monthlyFreeHours: cls.monthlyFreeHours || 0,
        isPrepaidHoursCard: cls.isPrepaidHoursCard || false,
        validFrom: new Date(),
        sessionId: toSessionId,
        status: 'Active',
        promotedFromEnrollmentId: oldEnrollment._id,
        enrolledBy: user._id,
        notes: decision === 'retain'
          ? 'Retained (same class) via promotion workflow'
          : 'Promoted via promotion workflow',
      }], { session });

      oldEnrollment.status = decision === 'retain' ? 'Retained' : 'Promoted';
      await oldEnrollment.save({ session });

      await Student.findByIdAndUpdate(
        studentId,
        { $addToSet: { classIds: newClassId } },
        { session }
      );

      return newEnrollment;
    });

    logger.info(`[FEE] Promoted: ${student.admissionNo} → session ${toSessionId} (${decision})`);
    return {
      studentId, decision, oldEnrollmentId: oldEnrollment._id, newEnrollmentId: result._id,
      pendingDuesFromOldSession,
    };
  }

  /**
   * Bulk wrapper — same shape as generateMonthlyInvoices: sequential loop,
   * per-item try/catch, accumulates {success,skipped,failed,errors[]}.
   */
  async promoteStudents(fromSessionId, toSessionId, decisions, user) {
    const results = { success: 0, skipped: 0, failed: 0, errors: [], results: [] };

    for (const d of decisions) {
      try {
        const r = await this.promoteOneStudent(fromSessionId, toSessionId, d, user);
        results.results.push(r);
        if (r.skipped) { results.skipped++; continue; }
        results.success++;
      } catch (err) {
        results.failed++;
        results.errors.push({ studentId: d.studentId, error: err.message });
        logger.error(`[FEE] Promotion failed for ${d.studentId}: ${err.message}`);
      }
    }

    logger.info(`[FEE] Promotion batch done: ${results.success} success, ${results.skipped} skipped, ${results.failed} failed`);
    return results;
  }

  /**
   * Correction/rollback action — marks a single enrollment 'Left'. Callers
   * must pass the NEW session's enrollment id (e.g. a student who was
   * promoted but is now known to have left without notice). This function
   * touches exactly one StudentEnrollment document (plus the Student.classIds
   * sync) and never queries or writes Attendance or Invoice, and never
   * touches the old-session enrollment referenced by promotedFromEnrollmentId
   * — old-session history stays exactly as it was.
   */
  async markEnrollmentLeft(enrollmentId, reason, user) {
    const enrollment = await StudentEnrollment.findById(enrollmentId);
    if (!enrollment) throw new ErrorResponse('Enrollment not found', 404);
    if (enrollment.status === 'Left') {
      throw new ErrorResponse('Enrollment is already marked Left', 400);
    }

    const wasActive = enrollment.status === 'Active';
    enrollment.status = 'Left';
    enrollment.notes = `${enrollment.notes ? enrollment.notes + ' | ' : ''}Marked Left by ${user._id} on ${new Date().toISOString()}: ${reason || 'Student left school'}`;
    await enrollment.save();

    if (wasActive) {
      await removeClassIdIfNoActiveEnrollment(enrollment.studentId, enrollment.classId);
    }

    logger.info(`[FEE] Enrollment ${enrollmentId} marked Left by ${user._id}`);
    return enrollment;
  }
}

module.exports = new FeeService();