/**
 * School Calendar Routes
 *
 * Mounts at: /api/calendar
 *
 * RBAC:
 *   admin       → full access
 *   teacher     → full access to the admin-management routes below, gated by
 *                 the canManageCalendar permission (opt-in per teacher)
 *   parent      → /my-events only (own calendar)
 */

const express = require("express");
const router = express.Router();
const multer = require("multer");

const {
  authGuard,
  roleGuard,
  teacherPermissionGuard,
} = require("../../middleware/auth.middleware");

const {
  uploadExcel,
  getAdminEvents,
  getEventById,
  updateEvent,
  deleteEvent,
  deleteBatch,
  assignParents,
  bulkAssignParents,
  getSessionList,
  getUploadBatches,
  getMyEvents,
} = require("./schoolCalendar.controller");

// ── Multer: memory storage for Excel files ────────────────────────────────────
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB max
  fileFilter: (req, file, cb) => {
    const allowed = [
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "application/vnd.ms-excel",
    ];
    const allowedExt = [".xlsx", ".xls"];
    const ext = require("path").extname(file.originalname).toLowerCase();

    if (allowed.includes(file.mimetype) || allowedExt.includes(ext)) {
      cb(null, true);
    } else {
      cb(new Error("Only Excel files (.xlsx, .xls) are allowed"), false);
    }
  },
});

// Multer error handler
const handleUploadError = (err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    return res.status(400).json({ success: false, error: err.message });
  }
  if (err) {
    return res.status(400).json({ success: false, error: err.message });
  }
  next();
};

// All routes require authentication
router.use(authGuard);

// ── PARENT ROUTES ─────────────────────────────────────────────────────────────

/**
 * GET /api/calendar/my-events
 * Parent sees only their permitted events (filtered by calType + visibility).
 * Query: ?calType=SCHOOL_CAL  ?from=2026-04-01  ?to=2026-04-30
 */
router.get("/my-events", roleGuard("parent"), getMyEvents);

// ── ADMIN / SUB-ADMIN READ ROUTES ─────────────────────────────────────────────

/**
 * GET /api/calendar/sessions
 * List of all session labels (for dropdown filters).
 */
router.get(
  "/sessions",
  teacherPermissionGuard("canManageCalendar"),
  getSessionList
);

/**
 * GET /api/calendar/batches
 * List all upload batches with counts.
 */
router.get(
  "/batches",
  teacherPermissionGuard("canManageCalendar"),
  getUploadBatches
);

/**
 * GET /api/calendar/events
 * Admin table view — all events with filters.
 * Query: ?calType=SCHOOL_CAL&session=April+2026&from=&to=&search=&page=1&limit=50
 */
router.get(
  "/events",
  teacherPermissionGuard("canManageCalendar"),
  getAdminEvents
);

/**
 * GET /api/calendar/events/:id
 * Single event detail.
 */
router.get(
  "/events/:id",
  teacherPermissionGuard("canManageCalendar"),
  getEventById
);

// ── ADMIN WRITE ROUTES ────────────────────────────────────────────────────────

/**
 * POST /api/calendar/upload
 * Upload Excel file.
 * Form fields:
 *   file          — .xlsx file
 *   calType       — "SCHOOL_CAL" | "KIDS_CLUB_CAL" | "AUTO"
 *   session       — "April 2026"
 *   replaceSession — "true" to delete existing events for this session
 */
router.post(
  "/upload",
  teacherPermissionGuard("canManageCalendar"),
  upload.single("file"),
  handleUploadError,
  uploadExcel
);

/**
 * PUT /api/calendar/events/:id
 * Update a single event row.
 * Body: { day, date, time, className, eventName, calType,
 *         isHoliday, isHighlighted, visibleToAll, session }
 */
router.put(
  "/events/:id",
  teacherPermissionGuard("canManageCalendar"),
  updateEvent
);

/**
 * DELETE /api/calendar/events/:id
 * Soft-delete a single event.
 */
router.delete(
  "/events/:id",
  teacherPermissionGuard("canManageCalendar"),
  deleteEvent
);

/**
 * DELETE /api/calendar/batch/:uploadBatchId
 * Soft-delete all events from an upload batch (undo upload).
 */
router.delete(
  "/batch/:uploadBatchId",
  teacherPermissionGuard("canManageCalendar"),
  deleteBatch
);

/**
 * PUT /api/calendar/events/:id/assign-parents
 * Assign specific parents to see a single event.
 * Body: { parentUserIds: ["id1", "id2"] }
 *       Empty array → reset to "visible to all"
 */
router.put(
  "/events/:id/assign-parents",
  teacherPermissionGuard("canManageCalendar"),
  assignParents
);

/**
 * POST /api/calendar/bulk-assign
 * Assign ALL events of a calType to specific parents.
 * Body: { calType: "KIDS_CLUB_CAL", parentUserIds: ["id1","id2"] }
 */
router.post(
  "/bulk-assign",
  teacherPermissionGuard("canManageCalendar"),
  bulkAssignParents
);

module.exports = router;