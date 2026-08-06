const express = require('express');
const router  = express.Router();
const ctrl    = require('./fee.controller');
const { authGuard, roleGuard, feeVisibilityGuard, teacherPermissionGuard } = require('../../middleware/auth.middleware');
const validate = require('../../middleware/validate.middleware');
const { body, param, query } = require('express-validator');

// ─── Common validators ────────────────────────────────────────────────────────
const mongoId = (field) => param(field).isMongoId().withMessage(`Invalid ${field}`);
const bodyMongoId = (field) => body(field).notEmpty().isMongoId().withMessage(`Invalid ${field}`);

// ─────────────────────────────────────────────────────────────────────────────
// FEE SETTINGS
// ─────────────────────────────────────────────────────────────────────────────
router.get('/settings',
  authGuard, teacherPermissionGuard('canManageFees'),
  ctrl.getSettings
);

router.put('/settings',
  authGuard, teacherPermissionGuard('canManageFees'),
  [
    body('flexiHourlyRate').optional().isFloat({ min: 0 }),
    body('flexiGracePeriodMinutes').optional().isInt({ min: 0 }),
    body('invoiceDueDay').optional().isInt({ min: 1, max: 28 }),
    body('lateFineAmount').optional().isFloat({ min: 0 }),
    body('autoInvoiceEnabled').optional().isBoolean(),
  ],
  validate, ctrl.updateSettings
);

// ─────────────────────────────────────────────────────────────────────────────
// ENROLLMENT
// ─────────────────────────────────────────────────────────────────────────────
router.post('/enrollments',
  authGuard, teacherPermissionGuard('canManageFees'),
  [
    bodyMongoId('studentId'),
    bodyMongoId('classId'),
    body('agreedFee').optional().isFloat({ min: 0 }),
    body('hoursAssigned').optional().isFloat({ min: 0.01 }),
    body('validFrom').optional().isISO8601(),
    body('validUntil').optional().isISO8601(),
    body('discountReason').optional().trim().isLength({ max: 200 }),
    body('monthlyFreeHours').optional().isInt({ min: 0 }),
    body('notes').optional().trim().isLength({ max: 300 }),
  ],
  validate, ctrl.enrollStudent
);

// Assign (more) Flexi Time hours to a student for a FLEX_TIME class — bills
// baseFee * hoursAssigned as a fresh UNPAID installment every time it's
// called; first call for a student+class creates the enrollment itself.
router.post('/flexi-hours/assign',
  authGuard, teacherPermissionGuard('canManageFees'),
  [
    bodyMongoId('studentId'),
    bodyMongoId('classId'),
    body('hoursAssigned').notEmpty().isFloat({ min: 0.01 }).withMessage('hoursAssigned must be a positive number'),
  ],
  validate, ctrl.assignFlexiHours
);

router.get('/enrollments/:studentId',
  authGuard, roleGuard('admin', 'teacher'), feeVisibilityGuard,
  [mongoId('studentId')],
  validate, ctrl.getEnrollments
);

// Session-wide enrollment list (e.g. all Active enrollments for a session) —
// used by bulk operations like promotion, distinct from the per-student list above.
router.get('/enrollments',
  authGuard, roleGuard('admin', 'teacher'), feeVisibilityGuard,
  [
    query('sessionId').optional().isMongoId(),
    query('status').optional().isIn(['Active', 'Expired', 'Cancelled', 'Promoted', 'Retained', 'Left']),
    query('classId').optional().isMongoId(),
    query('page').optional().isInt({ min: 1 }),
    query('limit').optional().isInt({ min: 1, max: 500 }),
  ],
  validate, ctrl.getEnrollmentsBySession
);

router.put('/enrollments/:id',
  authGuard, teacherPermissionGuard('canManageFees'),
  [
    mongoId('id'),
    body('agreedFee').optional().isFloat({ min: 0 }),
    body('validUntil').optional().isISO8601(),
    body('status').optional().isIn(['Active', 'Expired', 'Cancelled', 'Promoted', 'Retained', 'Left']),
    body('monthlyFreeHours').optional().isInt({ min: 0 }),
    body('discountReason').optional().trim().isLength({ max: 200 }),
    body('notes').optional().trim().isLength({ max: 300 }),
  ],
  validate, ctrl.updateEnrollment
);

router.delete('/enrollments/:id',
  authGuard, teacherPermissionGuard('canManageFees'),
  [mongoId('id')],
  validate, ctrl.cancelEnrollment
);

// ─────────────────────────────────────────────────────────────────────────────
// SESSION PROMOTION
// ─────────────────────────────────────────────────────────────────────────────
router.post('/promotions',
  authGuard, teacherPermissionGuard('canManageFees'),
  [
    bodyMongoId('fromSessionId'),
    bodyMongoId('toSessionId'),
    body('decisions').isArray({ min: 1 }),
    body('decisions.*.studentId').isMongoId(),
    body('decisions.*.decision').isIn(['promote', 'retain', 'notContinuing']),
    body('decisions.*.newClassId').optional().isMongoId(),
  ],
  validate, ctrl.promoteStudents
);

router.put('/enrollments/:id/mark-left',
  authGuard, teacherPermissionGuard('canManageFees'),
  [
    mongoId('id'),
    body('reason').optional().trim().isLength({ max: 300 }),
  ],
  validate, ctrl.markEnrollmentLeft
);

// ─────────────────────────────────────────────────────────────────────────────
// INVOICE
// ─────────────────────────────────────────────────────────────────────────────
router.post('/invoices/generate',
  authGuard, teacherPermissionGuard('canManageFees'),
  [
    bodyMongoId('studentId'),
    body('month').optional().isInt({ min: 1, max: 12 }),
    body('year').optional().isInt({ min: 2020, max: 2100 }),
  ],
  validate, ctrl.generateInvoice
);

router.post('/invoices/bulk-generate',
  authGuard, teacherPermissionGuard('canManageFees'),
  [
    body('month').optional().isInt({ min: 1, max: 12 }),
    body('year').optional().isInt({ min: 2020, max: 2100 }),
  ],
  validate, ctrl.generateBulkInvoices
);

router.get('/invoices/student/:studentId',
  authGuard, roleGuard('admin', 'teacher'), feeVisibilityGuard,
  [
    mongoId('studentId'),
    query('month').optional().isInt({ min: 1, max: 12 }),
    query('year').optional().isInt({ min: 2020 }),
    query('status').optional().isIn(['UNPAID', 'PARTIAL', 'PAID', 'CANCELLED', 'WAIVED']),
    query('page').optional().isInt({ min: 1 }),
    query('limit').optional().isInt({ min: 1, max: 100 }),
  ],
  validate, ctrl.getInvoices
);

// Session-wide invoice list/report across all students — for reporting and
// session-scoped views, distinct from the per-student list above.
router.get('/invoices',
  authGuard, teacherPermissionGuard('canManageFees'),
  [
    query('sessionId').optional().isMongoId(),
    query('status').optional().isIn(['UNPAID', 'PARTIAL', 'PAID', 'CANCELLED', 'WAIVED']),
    query('month').optional().isInt({ min: 1, max: 12 }),
    query('year').optional().isInt({ min: 2020 }),
    query('page').optional().isInt({ min: 1 }),
    query('limit').optional().isInt({ min: 1, max: 500 }),
  ],
  validate, ctrl.getInvoicesBySession
);

router.get('/invoices/:id',
  authGuard, teacherPermissionGuard('canManageFees'),
  [mongoId('id')],
  validate, ctrl.getInvoiceById
);

router.put('/invoices/:id',
  authGuard, teacherPermissionGuard('canManageFees'),
  [
    mongoId('id'),
    body('adjustmentAmount').optional().isFloat({ min: 0 }),
    body('adjustmentReason').optional().trim().isLength({ max: 200 }),
    body('status').optional().isIn(['UNPAID', 'PARTIAL', 'PAID', 'CANCELLED', 'WAIVED']),
    body('lateFine').optional().isFloat({ min: 0 }),
    body('notes').optional().trim().isLength({ max: 500 }),
  ],
  validate, ctrl.updateInvoice
);

// ─────────────────────────────────────────────────────────────────────────────
// PAYMENT
// ─────────────────────────────────────────────────────────────────────────────
router.post('/payments',
  authGuard, teacherPermissionGuard('canManageFees'),
  [
    bodyMongoId('studentId'),
    body('amount').notEmpty().isFloat({ min: 1 }).withMessage('Amount must be at least 1'),
    body('paymentMode').notEmpty().isIn(['cash', 'upi', 'bank_transfer', 'cheque', 'card', 'other']),
    body('transactionRef').optional().trim(),
    body('paymentDate').optional().isISO8601(),
    body('remarks').optional().trim().isLength({ max: 500 }),
    body('allocations').optional().isArray({ min: 1 }).withMessage('allocations must be a non-empty array'),
    body('allocations.*.billType').optional().isIn(['INVOICE', 'INSTALLMENT', 'FLEXI_CARD']).withMessage('Invalid billType'),
    body('allocations.*.billId').optional().isMongoId().withMessage('Invalid billId'),
    body('allocations.*.amount').optional().isFloat({ min: 0.01 }).withMessage('allocation amount must be > 0'),
  ],
  validate, ctrl.collectPayment
);

router.get('/payments/student/:studentId',
  authGuard, teacherPermissionGuard('canManageFees'),
  [
    mongoId('studentId'),
    query('page').optional().isInt({ min: 1 }),
    query('limit').optional().isInt({ min: 1, max: 100 }),
  ],
  validate, ctrl.getPayments
);

router.get('/payments/:id',
  authGuard, teacherPermissionGuard('canManageFees'),
  [mongoId('id')],
  validate, ctrl.getPaymentById
);

router.put('/payments/:id',
  authGuard, teacherPermissionGuard('canManageFees'),
  [
    mongoId('id'),
    body('amount').optional().isFloat({ min: 1 }).withMessage('Amount must be at least 1'),
    body('paymentMode').optional().isIn(['cash', 'upi', 'bank_transfer', 'cheque', 'card', 'other']),
    body('transactionRef').optional().trim(),
    body('paymentDate').optional().isISO8601(),
    body('remarks').optional().trim().isLength({ max: 500 }),
    body('note').optional().trim().isLength({ max: 500 }),
  ],
  validate, ctrl.updatePayment
);

router.get('/payments/:id/history',
  authGuard, teacherPermissionGuard('canManageFees'),
  [mongoId('id')],
  validate, ctrl.getPaymentHistory
);

// ─────────────────────────────────────────────────────────────────────────────
// WALLET
// ─────────────────────────────────────────────────────────────────────────────
router.get('/wallet/:studentId',
  authGuard, teacherPermissionGuard('canManageFees'),
  [mongoId('studentId')],
  validate, ctrl.getWallet
);

router.post('/wallet/adjust',
  authGuard, teacherPermissionGuard('canManageFees'),
  [
    bodyMongoId('studentId'),
    body('amount').notEmpty().isFloat().withMessage('Amount required (+ credit, - debit)'),
    body('reason').notEmpty().trim().isLength({ min: 3, max: 200 }),
  ],
  validate, ctrl.adjustWallet
);

// ─────────────────────────────────────────────────────────────────────────────
// STUDENT FEE SUMMARY
// ─────────────────────────────────────────────────────────────────────────────
router.get('/summary/:studentId',
  authGuard, teacherPermissionGuard('canManageFees'),
  [mongoId('studentId')],
  validate, ctrl.getStudentFeeSummary
);

// ─────────────────────────────────────────────────────────────────────────────
// INSTALLMENTS (annual fee split into dated kists, and one-time fees)
// ─────────────────────────────────────────────────────────────────────────────
router.get('/installments/student/:studentId',
  authGuard, roleGuard('admin', 'teacher'), feeVisibilityGuard,
  [
    mongoId('studentId'),
    query('status').optional().isIn(['UNPAID', 'PARTIAL', 'PAID', 'CANCELLED', 'WAIVED']),
    query('page').optional().isInt({ min: 1 }),
    query('limit').optional().isInt({ min: 1, max: 100 }),
  ],
  validate, ctrl.getInstallments
);

router.get('/installments/:id',
  authGuard, teacherPermissionGuard('canManageFees'),
  [mongoId('id')],
  validate, ctrl.getInstallmentById
);

router.put('/installments/:id',
  authGuard, teacherPermissionGuard('canManageFees'),
  [
    mongoId('id'),
    body('adjustmentAmount').optional().isFloat({ min: 0 }),
    body('adjustmentReason').optional().trim().isLength({ max: 200 }),
    body('status').optional().isIn(['UNPAID', 'PARTIAL', 'PAID', 'CANCELLED', 'WAIVED']),
    body('dueDate').optional().isISO8601(),
    body('notes').optional().trim().isLength({ max: 500 }),
  ],
  validate, ctrl.updateInstallment
);

// ─────────────────────────────────────────────────────────────────────────────
// FLEXI CARD (prepaid hours)
// ─────────────────────────────────────────────────────────────────────────────
router.post('/flexi-card/purchase',
  authGuard, teacherPermissionGuard('canManageFees'),
  [
    bodyMongoId('studentId'),
    bodyMongoId('classId'),
    body('amountPaidNow').optional().isFloat({ min: 0 }),
    body('paymentMode').optional().isIn(['cash', 'upi', 'bank_transfer', 'cheque', 'card', 'other']),
    body('transactionRef').optional().trim(),
    body('remarks').optional().trim().isLength({ max: 500 }),
  ],
  validate, ctrl.purchaseFlexiCard
);

router.get('/flexi-card/balance/:studentId',
  authGuard, roleGuard('admin', 'teacher'), feeVisibilityGuard,
  [mongoId('studentId')],
  validate, ctrl.getFlexiCardBalance
);

router.get('/flexi-card/purchases/:studentId',
  authGuard, teacherPermissionGuard('canManageFees'),
  [
    mongoId('studentId'),
    query('page').optional().isInt({ min: 1 }),
    query('limit').optional().isInt({ min: 1, max: 100 }),
  ],
  validate, ctrl.getFlexiCardPurchases
);

router.get('/flexi-card/purchases/detail/:id',
  authGuard, teacherPermissionGuard('canManageFees'),
  [mongoId('id')],
  validate, ctrl.getFlexiCardPurchaseById
);

// ─────────────────────────────────────────────────────────────────────────────
// FEE STATUS ("kis program ka kitna baaki hai" — per-program due/paid view)
// ─────────────────────────────────────────────────────────────────────────────
router.get('/status/:studentId',
  authGuard, roleGuard('admin', 'teacher'), feeVisibilityGuard,
  [mongoId('studentId')],
  validate, ctrl.getStudentFeeStatus
);

// ─────────────────────────────────────────────────────────────────────────────
// REPORTS
// ─────────────────────────────────────────────────────────────────────────────
router.get('/reports/defaulters',
  authGuard, teacherPermissionGuard('canManageFees'),
  [
    query('month').optional().isInt({ min: 1, max: 12 }),
    query('year').optional().isInt({ min: 2020 }),
  ],
  validate, ctrl.getDefaulters
);

router.get('/reports/collection',
  authGuard, teacherPermissionGuard('canManageFees'),
  [
    query('month').optional().isInt({ min: 1, max: 12 }),
    query('year').optional().isInt({ min: 2020 }),
  ],
  validate, ctrl.getCollectionReport
);

router.get('/reports/installment-defaulters',
  authGuard, teacherPermissionGuard('canManageFees'),
  ctrl.getInstallmentDefaulters
);

// ─────────────────────────────────────────────────────────────────────────────
// PARENT ROUTES
// ─────────────────────────────────────────────────────────────────────────────
router.get('/my-invoices',
  authGuard, roleGuard('parent'),
  ctrl.getMyInvoices
);

router.get('/my-payments',
  authGuard, roleGuard('parent'),
  ctrl.getMyPayments
);

router.get('/my-wallet',
  authGuard, roleGuard('parent'),
  ctrl.getMyWallet
);

router.get('/my-installments',
  authGuard, roleGuard('parent'),
  ctrl.getMyInstallments
);

router.get('/my-flexi-card',
  authGuard, roleGuard('parent'),
  ctrl.getMyFlexiCard
);

router.get('/my-status',
  authGuard, roleGuard('parent'),
  ctrl.getMyFeeStatus
);

module.exports = router;