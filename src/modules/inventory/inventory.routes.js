const express = require('express');
const router = express.Router();
const multer = require('multer');
const { body, param, query } = require('express-validator');

const { authGuard, roleGuard } = require('../../middleware/auth.middleware');
const { uploadSinglePhoto, handleMulterError } = require('../../config/multer-s3');
const validate = require('../../middleware/validate.middleware');
const ErrorResponse = require('../../utils/errorResponse');

const categoryCtrl = require('./itemCategory.controller');
const itemCtrl = require('./item.controller');
const stockInCtrl = require('./stockIn.controller');
const stockIssueCtrl = require('./stockIssue.controller');
const lendingCtrl = require('./lending.controller');
const wishlistCtrl = require('./wishlist.controller');
const reportCtrl = require('./report.controller');
const depositCtrl = require('./deposit.controller');

const PAYMENT_MODES = ['cash', 'upi', 'bank_transfer', 'cheque', 'card', 'other'];

const mongoId = (field) => param(field).isMongoId().withMessage(`Invalid ${field}`);
const bodyMongoId = (field) => body(field).notEmpty().isMongoId().withMessage(`Invalid ${field}`);

// admin/sub-admin always pass; a teacher passes if ANY of the given
// Teacher.permissions flags is true (see teacher.model.js). Mirrors
// auth.middleware's teacherPermissionGuard but supports multiple keys —
// several inventory actions are reachable via more than one permission
// (e.g. either Library or Inventory catalog access can edit an Item, since
// a single item can carry both consumable and lendable/sellable types).
const inventoryPermissionGuard = (...keys) => (req, res, next) => {
  if (req.user.role === 'admin') return next();
  if (req.user.role === 'teacher') {
    const perms = req.teacherDoc?.permissions || {};
    if (keys.some((k) => perms[k] === true)) return next();
  }
  return next(new ErrorResponse(`Access denied. Requires one of: ${keys.join(', ')}`, 403));
};

const xlsxUpload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const allowed = [
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'application/vnd.ms-excel',
    ];
    if (allowed.includes(file.mimetype)) return cb(null, true);
    cb(new ErrorResponse('Please upload an Excel (.xlsx) file', 400));
  },
}).single('file');

const catalogGuard = inventoryPermissionGuard('canManageInventoryCatalog', 'canManageLibraryCatalog');

// ─────────────────────────────────────────────────────────────────────────
// PUBLIC CATALOG (Section 4.7) — no auth
// ─────────────────────────────────────────────────────────────────────────
router.get('/items/public', itemCtrl.getPublicCatalog);

// Everything below requires a logged-in user.
router.use(authGuard);

// ─────────────────────────────────────────────────────────────────────────
// CATEGORIES
// ─────────────────────────────────────────────────────────────────────────
router.get('/categories', roleGuard('admin', 'teacher'), categoryCtrl.getCategories);
router.get('/categories/:id', roleGuard('admin', 'teacher'), [mongoId('id')], validate, categoryCtrl.getCategory);

router.post('/categories', catalogGuard,
  [body('name').notEmpty().trim().isLength({ max: 80 }).withMessage('Category name is required (max 80 chars)')],
  validate, categoryCtrl.createCategory);

router.put('/categories/:id', catalogGuard, [mongoId('id')], validate, categoryCtrl.updateCategory);
router.delete('/categories/:id', catalogGuard, [mongoId('id')], validate, categoryCtrl.deleteCategory);

// ─────────────────────────────────────────────────────────────────────────
// ITEMS (Item Master — Section 4.1, 4.5, 4.6, 4.7)
// ─────────────────────────────────────────────────────────────────────────
router.get('/items', roleGuard('admin', 'teacher'), itemCtrl.getItems);
router.get('/items/:id', roleGuard('admin', 'teacher'), [mongoId('id')], validate, itemCtrl.getItem);

router.post('/items', catalogGuard, uploadSinglePhoto, handleMulterError,
  [
    body('name').notEmpty().trim().isLength({ max: 150 }).withMessage('Item name is required'),
    bodyMongoId('category'),
    body('itemTypes').custom((v) => {
      const arr = Array.isArray(v) ? v : String(v || '').split(',').map((s) => s.trim()).filter(Boolean);
      return arr.length > 0;
    }).withMessage('Select at least one item type'),
    body('sellingPrice').optional().isFloat({ min: 0 }),
    body('securityDepositAmount').optional().isFloat({ min: 0 }),
    body('minStockLevel').optional().isFloat({ min: 0 }),
    body('availableForSale').optional().isBoolean(),
  ],
  validate, itemCtrl.createItem);

router.put('/items/:id', catalogGuard, uploadSinglePhoto, handleMulterError, [mongoId('id')], validate, itemCtrl.updateItem);
router.delete('/items/:id', catalogGuard, [mongoId('id')], validate, itemCtrl.deleteItem);

router.get('/items/bulk/template', catalogGuard, itemCtrl.downloadBulkTemplate);
router.post('/items/bulk/preview', catalogGuard, xlsxUpload, itemCtrl.previewBulkUpload);
router.post('/items/bulk/commit', catalogGuard,
  [body('rows').isArray({ min: 1 }).withMessage('rows must be a non-empty array')],
  validate, itemCtrl.commitBulkUpload);

// ─────────────────────────────────────────────────────────────────────────
// STOCK IN (Section 4.2)
// ─────────────────────────────────────────────────────────────────────────
const stockInGuard = inventoryPermissionGuard('canManageInventoryStockIn');
const stockInReadGuard = inventoryPermissionGuard('canManageInventoryStockIn', 'canViewInventoryReports');

router.post('/stock-in', stockInGuard,
  [
    bodyMongoId('itemId'),
    body('quantityAdded').optional().isFloat({ min: 1 }),
    body('packetCount').optional().isFloat({ min: 1 }),
    body('piecesPerPacket').optional().isFloat({ min: 1 }),
    body('totalCost').optional().isFloat({ min: 0 }),
  ],
  validate, stockInCtrl.recordStockIn);

router.get('/stock-in', stockInReadGuard, stockInCtrl.getStockEntries);

// ─────────────────────────────────────────────────────────────────────────
// STOCK OUT / ISSUE (Section 4.3 — approval workflow)
// ─────────────────────────────────────────────────────────────────────────
const stockOutGuard = inventoryPermissionGuard('canManageInventoryStockOut');
const stockOutReadGuard = inventoryPermissionGuard('canManageInventoryStockOut', 'canViewInventoryReports');

router.post('/stock-out', stockOutGuard,
  [
    bodyMongoId('itemId'),
    body('quantity').notEmpty().isFloat({ min: 1 }).withMessage('Quantity must be at least 1'),
    body('issuedToTeacherId').optional().isMongoId(),
    body('classId').optional().isMongoId(),
  ],
  validate, stockIssueCtrl.requestStockIssue);

router.get('/stock-out', stockOutReadGuard, stockIssueCtrl.getStockIssues);
router.get('/stock-out/my-items', roleGuard('admin', 'teacher'), stockIssueCtrl.getMyIssuedItems);
router.get('/stock-out/my-requests', roleGuard('admin', 'teacher'), stockIssueCtrl.getMyPendingRequests);

router.patch('/stock-out/:id/approve', roleGuard('admin'), [mongoId('id')], validate, stockIssueCtrl.approveStockIssue);
router.patch('/stock-out/:id/reject', roleGuard('admin'), [mongoId('id')], validate, stockIssueCtrl.rejectStockIssue);

// ─────────────────────────────────────────────────────────────────────────
// LENDING — Borrow / Buy / Return / Renew (Section 4.4, Library core)
// Staff-recorded on the parent's behalf; parents only view via My Items.
// ─────────────────────────────────────────────────────────────────────────
const libraryIssueGuard = inventoryPermissionGuard('canManageLibraryIssue');
const libraryReadGuard = inventoryPermissionGuard('canManageLibraryIssue', 'canViewLibraryReports');

router.post('/lending/borrow', libraryIssueGuard,
  [
    bodyMongoId('itemId'),
    bodyMongoId('parentId'),
    body('quantity').optional().isFloat({ min: 1 }),
    body('dueDate').notEmpty().isISO8601().withMessage('dueDate is required for a borrow'),
    body('depositCollected').optional().isFloat({ min: 0 }),
    body('depositPaymentMode').optional().isIn(PAYMENT_MODES).withMessage(`depositPaymentMode must be one of: ${PAYMENT_MODES.join(', ')}`),
    body('depositTransactionRef').optional().trim(),
    body('studentId').optional().isMongoId(),
  ],
  validate, lendingCtrl.borrowItem);

router.post('/lending/purchase', libraryIssueGuard,
  [
    bodyMongoId('itemId'),
    bodyMongoId('parentId'),
    body('quantity').optional().isFloat({ min: 1 }),
    body('studentId').optional().isMongoId(),
  ],
  validate, lendingCtrl.purchaseItem);

router.patch('/lending/:id/return', libraryIssueGuard,
  [mongoId('id'), body('returnCondition').optional().isIn(['good', 'damaged', 'lost'])],
  validate, lendingCtrl.returnItem);

router.patch('/lending/:id/renew', libraryIssueGuard,
  [mongoId('id'), body('newDueDate').notEmpty().isISO8601()],
  validate, lendingCtrl.renewItem);

router.get('/lending', libraryReadGuard, lendingCtrl.getLendingTransactions);

// ─────────────────────────────────────────────────────────────────────────
// PARENT-FACING — My Items history + Wishlist (Section 4.7, 4.8, 4.9)
// ─────────────────────────────────────────────────────────────────────────
router.get('/lending/my-history', roleGuard('parent'), lendingCtrl.getMyLendingHistory);

router.get('/wishlist/my-list', roleGuard('parent'), wishlistCtrl.getMyWishlist);
router.post('/wishlist', roleGuard('parent'), [bodyMongoId('itemId')], validate, wishlistCtrl.addToWishlist);
router.delete('/wishlist/:itemId', roleGuard('parent'), [mongoId('itemId')], validate, wishlistCtrl.removeFromWishlist);

// ─────────────────────────────────────────────────────────────────────────
// SECURITY DEPOSITS — collected as part of /lending/borrow (a deposit only
// ever exists tied to a specific borrow); from here on it's its own
// trackable resource with a receipt, refund/forfeit lifecycle and reports.
// ─────────────────────────────────────────────────────────────────────────
router.get('/deposits', libraryReadGuard, depositCtrl.getDeposits);
router.get('/deposits/summary', libraryReadGuard, depositCtrl.getDepositSummary);
router.get('/deposits/my', roleGuard('parent'), depositCtrl.getMyDeposits);

router.patch('/deposits/:id/refund', libraryIssueGuard,
  [
    mongoId('id'),
    body('mode').notEmpty().isIn(PAYMENT_MODES).withMessage(`mode must be one of: ${PAYMENT_MODES.join(', ')}`),
    body('transactionRef').optional().trim(),
    body('deductionAmount').optional().isFloat({ min: 0 }),
    body('deductionReason').optional().trim().isLength({ max: 300 }),
    body('note').optional().trim().isLength({ max: 300 }),
  ],
  validate, depositCtrl.refundDeposit);

router.patch('/deposits/:id/forfeit', libraryIssueGuard,
  [mongoId('id'), body('reason').notEmpty().trim().isLength({ max: 300 }).withMessage('reason is required')],
  validate, depositCtrl.forfeitDeposit);

// ─────────────────────────────────────────────────────────────────────────
// REPORTS & DASHBOARD (Section 4.13)
// ─────────────────────────────────────────────────────────────────────────
const reportsGuard = inventoryPermissionGuard('canViewInventoryReports', 'canViewLibraryReports', 'canManageInventoryCatalog', 'canManageLibraryCatalog');

router.get('/reports/dashboard', reportsGuard, reportCtrl.getDashboard);
router.get('/reports/overdue', reportsGuard, reportCtrl.getOverdueList);
router.get('/reports/low-stock', reportsGuard, reportCtrl.getLowStockList);
router.get('/reports/monthly-expense', reportsGuard,
  [
    query('month').optional().isInt({ min: 1, max: 12 }),
    query('year').optional().isInt({ min: 2020 }),
    query('startDate').optional().isISO8601(),
    query('endDate').optional().isISO8601(),
  ],
  validate, reportCtrl.getMonthlyExpenseReport);

module.exports = router;
