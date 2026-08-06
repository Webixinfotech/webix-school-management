const feeService = require('./fee.service');
const installmentService = require('./installment.service');
const flexiCardService = require('./flexiCard.service');

// ─── Settings ─────────────────────────────────────────────────────────────────
exports.getSettings = async (req, res, next) => {
  try {
    const data = await feeService.getSettings();
    res.status(200).json({ success: true, data });
  } catch (err) { next(err); }
};

exports.updateSettings = async (req, res, next) => {
  try {
    const data = await feeService.updateSettings(req.body, req.user);
    res.status(200).json({ success: true, message: 'Settings updated', data });
  } catch (err) { next(err); }
};

// ─── Enrollment ───────────────────────────────────────────────────────────────
exports.enrollStudent = async (req, res, next) => {
  try {
    const data = await feeService.enrollStudent(req.body, req.user);
    res.status(201).json({ success: true, message: 'Student enrolled successfully', data });
  } catch (err) { next(err); }
};

exports.assignFlexiHours = async (req, res, next) => {
  try {
    const data = await feeService.assignFlexiHours(req.body, req.user);
    res.status(201).json({ success: true, message: 'Flexi hours assigned', data });
  } catch (err) { next(err); }
};

exports.getEnrollments = async (req, res, next) => {
  try {
    const data = await feeService.getEnrollments(req.params.studentId);
    res.status(200).json({ success: true, count: data.length, data });
  } catch (err) { next(err); }
};

exports.getEnrollmentsBySession = async (req, res, next) => {
  try {
    const result = await feeService.getEnrollmentsBySession(req.query);
    res.status(200).json({ success: true, ...result });
  } catch (err) { next(err); }
};

exports.updateEnrollment = async (req, res, next) => {
  try {
    const data = await feeService.updateEnrollment(req.params.id, req.body, req.user);
    res.status(200).json({ success: true, message: 'Enrollment updated', data });
  } catch (err) { next(err); }
};

exports.cancelEnrollment = async (req, res, next) => {
  try {
    const data = await feeService.cancelEnrollment(req.params.id, req.user);
    res.status(200).json({ success: true, message: 'Enrollment cancelled', data });
  } catch (err) { next(err); }
};

// ─── Session promotion ──────────────────────────────────────────────────────
exports.promoteStudents = async (req, res, next) => {
  try {
    const { fromSessionId, toSessionId, decisions } = req.body;
    const data = await feeService.promoteStudents(fromSessionId, toSessionId, decisions, req.user);
    res.status(200).json({ success: true, message: 'Promotion batch complete', data });
  } catch (err) { next(err); }
};

exports.markEnrollmentLeft = async (req, res, next) => {
  try {
    const data = await feeService.markEnrollmentLeft(req.params.id, req.body.reason, req.user);
    res.status(200).json({ success: true, message: 'Enrollment marked Left', data });
  } catch (err) { next(err); }
};

// ─── Invoice ──────────────────────────────────────────────────────────────────
exports.generateInvoice = async (req, res, next) => {
  try {
    const { studentId, month, year } = req.body;
    const { month: cm, year: cy } = getCurrentMonthYear();
    const data = await feeService.generateInvoice(
      studentId,
      month ? Number(month) : cm,
      year  ? Number(year)  : cy,
      'admin',
      req.user._id
    );
    res.status(201).json({ success: true, message: 'Invoice generated', data });
  } catch (err) { next(err); }
};

exports.generateBulkInvoices = async (req, res, next) => {
  try {
    const { month, year } = req.body;
    const { month: cm, year: cy } = getCurrentMonthYear();
    const result = await feeService.generateMonthlyInvoices(
      month ? Number(month) : cm,
      year  ? Number(year)  : cy,
      req.user._id
    );
    res.status(200).json({ success: true, message: 'Bulk invoice generation complete', data: result });
  } catch (err) { next(err); }
};

exports.getInvoices = async (req, res, next) => {
  try {
    const result = await feeService.getInvoices(req.params.studentId, req.query);
    res.status(200).json({ success: true, ...result });
  } catch (err) { next(err); }
};

exports.getInvoicesBySession = async (req, res, next) => {
  try {
    const result = await feeService.getInvoicesBySession(req.query);
    res.status(200).json({ success: true, ...result });
  } catch (err) { next(err); }
};

exports.getInvoiceById = async (req, res, next) => {
  try {
    const data = await feeService.getInvoiceById(req.params.id);
    res.status(200).json({ success: true, data });
  } catch (err) { next(err); }
};

exports.updateInvoice = async (req, res, next) => {
  try {
    const data = await feeService.updateInvoice(req.params.id, req.body, req.user);
    res.status(200).json({ success: true, message: 'Invoice updated', data });
  } catch (err) { next(err); }
};

// ─── Payment ──────────────────────────────────────────────────────────────────
exports.collectPayment = async (req, res, next) => {
  try {
    const result = await feeService.collectPayment(req.body, req.user);
    res.status(201).json({
      success: true,
      message: `Payment of Rs.${result.payment.amount} received. Receipt: ${result.payment.receiptNo}`,
      data: result,
    });
  } catch (err) { next(err); }
};

exports.getPayments = async (req, res, next) => {
  try {
    const result = await feeService.getPayments(req.params.studentId, req.query);
    res.status(200).json({ success: true, ...result });
  } catch (err) { next(err); }
};

exports.getPaymentById = async (req, res, next) => {
  try {
    const data = await feeService.getPaymentById(req.params.id);
    res.status(200).json({ success: true, data });
  } catch (err) { next(err); }
};

exports.updatePayment = async (req, res, next) => {
  try {
    const data = await feeService.updatePayment(req.params.id, req.body, req.user);
    res.status(200).json({ success: true, message: 'Payment updated', data });
  } catch (err) { next(err); }
};

exports.getPaymentHistory = async (req, res, next) => {
  try {
    const data = await feeService.getPaymentHistory(req.params.id);
    res.status(200).json({ success: true, data });
  } catch (err) { next(err); }
};

// ─── Wallet ───────────────────────────────────────────────────────────────────
exports.getWallet = async (req, res, next) => {
  try {
    const data = await feeService.getWallet(req.params.studentId);
    res.status(200).json({ success: true, data });
  } catch (err) { next(err); }
};

exports.adjustWallet = async (req, res, next) => {
  try {
    const { studentId, amount, reason } = req.body;
    const data = await feeService.adjustWallet(studentId, amount, reason, req.user);
    res.status(200).json({ success: true, message: 'Wallet adjusted', data });
  } catch (err) { next(err); }
};

// ─── Reports ──────────────────────────────────────────────────────────────────
exports.getDefaulters = async (req, res, next) => {
  try {
    const data = await feeService.getDefaulters(req.query);
    res.status(200).json({ success: true, data });
  } catch (err) { next(err); }
};

exports.getCollectionReport = async (req, res, next) => {
  try {
    const data = await feeService.getCollectionReport(req.query);
    res.status(200).json({ success: true, data });
  } catch (err) { next(err); }
};

exports.getStudentFeeSummary = async (req, res, next) => {
  try {
    const data = await feeService.getStudentFeeSummary(req.params.studentId);
    res.status(200).json({ success: true, data });
  } catch (err) { next(err); }
};

// ─── Installments ─────────────────────────────────────────────────────────────
exports.getInstallments = async (req, res, next) => {
  try {
    const result = await installmentService.getInstallments(req.params.studentId, req.query);
    res.status(200).json({ success: true, ...result });
  } catch (err) { next(err); }
};

exports.getInstallmentById = async (req, res, next) => {
  try {
    const data = await installmentService.getInstallmentById(req.params.id);
    res.status(200).json({ success: true, data });
  } catch (err) { next(err); }
};

exports.updateInstallment = async (req, res, next) => {
  try {
    const data = await installmentService.updateInstallment(req.params.id, req.body, req.user);
    res.status(200).json({ success: true, message: 'Installment updated', data });
  } catch (err) { next(err); }
};

exports.getInstallmentDefaulters = async (req, res, next) => {
  try {
    const data = await installmentService.getDefaulterInstallments(req.query);
    res.status(200).json({ success: true, data });
  } catch (err) { next(err); }
};

// ─── Flexi Card ───────────────────────────────────────────────────────────────
exports.purchaseFlexiCard = async (req, res, next) => {
  try {
    const data = await feeService.purchaseFlexiCard(req.body, req.user);
    res.status(201).json({ success: true, message: 'Flexi Card purchased', data });
  } catch (err) { next(err); }
};

exports.getFlexiCardBalance = async (req, res, next) => {
  try {
    const data = await flexiCardService.getBalance(req.params.studentId);
    res.status(200).json({ success: true, data });
  } catch (err) { next(err); }
};

exports.getFlexiCardPurchases = async (req, res, next) => {
  try {
    const result = await flexiCardService.getPurchases(req.params.studentId, req.query);
    res.status(200).json({ success: true, ...result });
  } catch (err) { next(err); }
};

exports.getFlexiCardPurchaseById = async (req, res, next) => {
  try {
    const data = await flexiCardService.getPurchaseById(req.params.id);
    res.status(200).json({ success: true, data });
  } catch (err) { next(err); }
};

// ─── Fee Status ───────────────────────────────────────────────────────────────
exports.getStudentFeeStatus = async (req, res, next) => {
  try {
    const data = await feeService.getStudentFeeStatus(req.params.studentId);
    res.status(200).json({ success: true, data });
  } catch (err) { next(err); }
};

// ─── Parent Routes ────────────────────────────────────────────────────────────
exports.getMyInvoices = async (req, res, next) => {
  try {
    const Parent = require('../shared/parent.model');
    const parent = await Parent.findOne({ userId: req.user._id }).select('children').lean();
    if (!parent || !parent.children?.length) {
      return res.status(200).json({ success: true, data: [] });
    }
    // Get invoices for all children
    const Invoice = require('./invoice.model');
    const invoices = await Invoice.find({
      studentId: { $in: parent.children },
    }).sort({ billingYear: -1, billingMonth: -1 }).limit(24).lean();

    res.status(200).json({ success: true, count: invoices.length, data: invoices });
  } catch (err) { next(err); }
};

// Every payment (receipt) ever collected for this parent's children, most
// recent first — powers the "last payment" summary and the per-class
// receipt downloads on the parent Fee page. Read-only, no financial
// figures are recomputed here; `allocations` (already on each payment)
// tells the frontend exactly which bill/class each rupee went to.
exports.getMyPayments = async (req, res, next) => {
  try {
    const Parent = require('../shared/parent.model');
    const parent = await Parent.findOne({ userId: req.user._id }).select('children').lean();
    if (!parent || !parent.children?.length) {
      return res.status(200).json({ success: true, data: [] });
    }
    const Payment = require('./payment.model');
    const payments = await Payment.find({
      studentId: { $in: parent.children },
    }).sort({ paymentDate: -1 }).limit(200).lean();

    res.status(200).json({ success: true, count: payments.length, data: payments });
  } catch (err) { next(err); }
};

exports.getMyWallet = async (req, res, next) => {
  try {
    const Parent = require('../shared/parent.model');
    const parent = await Parent.findOne({ userId: req.user._id }).select('children').lean();
    if (!parent || !parent.children?.length) {
      return res.status(200).json({ success: true, data: [] });
    }
    const wallets = await require('./studentWallet.model').find({
      studentId: { $in: parent.children },
    }).lean();
    res.status(200).json({ success: true, data: wallets });
  } catch (err) { next(err); }
};

exports.getMyInstallments = async (req, res, next) => {
  try {
    const Parent = require('../shared/parent.model');
    const parent = await Parent.findOne({ userId: req.user._id }).select('children').lean();
    if (!parent || !parent.children?.length) {
      return res.status(200).json({ success: true, data: [] });
    }
    const Installment = require('./installment.model');
    const data = await Installment.find({
      studentId: { $in: parent.children },
      status: { $in: ['UNPAID', 'PARTIAL'] },
    }).sort({ dueDate: 1 }).lean();
    res.status(200).json({ success: true, count: data.length, data });
  } catch (err) { next(err); }
};

exports.getMyFlexiCard = async (req, res, next) => {
  try {
    const Parent = require('../shared/parent.model');
    const parent = await Parent.findOne({ userId: req.user._id }).select('children').lean();
    if (!parent || !parent.children?.length) {
      return res.status(200).json({ success: true, data: [] });
    }
    const balances = await Promise.all(parent.children.map((id) => flexiCardService.getBalance(id)));
    res.status(200).json({ success: true, data: balances });
  } catch (err) { next(err); }
};

exports.getMyFeeStatus = async (req, res, next) => {
  try {
    const Parent = require('../shared/parent.model');
    const parent = await Parent.findOne({ userId: req.user._id }).select('children').lean();
    if (!parent || !parent.children?.length) {
      return res.status(200).json({ success: true, data: [] });
    }
    const statuses = await Promise.all(parent.children.map((id) => feeService.getStudentFeeStatus(id)));
    res.status(200).json({ success: true, data: statuses });
  } catch (err) { next(err); }
};

// ─── Helper ───────────────────────────────────────────────────────────────────
function getCurrentMonthYear() {
  const d = new Date(new Date().toLocaleString('en-US', { timeZone: 'Asia/Kolkata' }));
  return { month: d.getMonth() + 1, year: d.getFullYear() };
}