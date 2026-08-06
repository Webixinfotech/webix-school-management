/**
 * School Calendar Controller
 *
 * HTTP layer for all calendar APIs.
 * Follows existing codebase controller patterns (exports.fn).
 */

const calendarService = require("./schoolCalendar.service");
const ErrorResponse = require("../../utils/errorResponse");
const logger = require("../../config/logger");

// ─── ADMIN: Upload Excel ──────────────────────────────────────────────────────

/**
 * POST /api/calendar/upload
 * multipart/form-data
 * Fields:
 *   file         — .xlsx file (required)
 *   calType      — "SCHOOL_CAL" | "KIDS_CLUB_CAL" | "AUTO"  (default: AUTO)
 *   session      — "April 2026" (optional label)
 *   replaceSession — "true" to delete existing rows for this session first
 */
exports.uploadExcel = async (req, res, next) => {
  try {
    if (!req.file) {
      return next(new ErrorResponse("Please upload an Excel (.xlsx) file", 400));
    }

    const { calType = "AUTO", session = "", replaceSession = "false" } = req.body;

    const result = await calendarService.uploadExcel(req.file.buffer, {
      defaultCalType: calType,
      session,
      replaceSession: replaceSession === "true",
      uploadedBy: req.user._id,
    });

    res.status(201).json({
      success: true,
      message: `Calendar uploaded successfully — ${result.inserted} events saved`,
      data: result,
    });
  } catch (err) {
    logger.error("[Calendar] uploadExcel error:", err.message);
    next(err);
  }
};

// ─── ADMIN: List all events ───────────────────────────────────────────────────

/**
 * GET /api/calendar/events
 * Query: calType, session, from, to, search, isHoliday, page, limit
 */
exports.getAdminEvents = async (req, res, next) => {
  try {
    const result = await calendarService.getAdminEvents(req.query);
    res.status(200).json({ success: true, ...result });
  } catch (err) {
    logger.error("[Calendar] getAdminEvents error:", err.message);
    next(err);
  }
};

// ─── ADMIN: Get single event ──────────────────────────────────────────────────

exports.getEventById = async (req, res, next) => {
  try {
    const { CalendarEvent } = require("./schoolCalendar.model");
    const event = await require("./schoolCalendar.model")
      .findOne({ _id: req.params.id, isActive: true })
      .lean();

    if (!event) return next(new ErrorResponse("Event not found", 404));

    res.status(200).json({ success: true, data: event });
  } catch (err) {
    logger.error("[Calendar] getEventById error:", err.message);
    next(err);
  }
};

// ─── ADMIN: Update single row ─────────────────────────────────────────────────

/**
 * PUT /api/calendar/events/:id
 * Body: any subset of { day, date, time, className, eventName, calType,
 *                       rowColor, isHoliday, isHighlighted,
 *                       visibleToAll, visibleTo[], session }
 */
exports.updateEvent = async (req, res, next) => {
  try {
    const event = await calendarService.updateEvent(
      req.params.id,
      req.body,
      req.user._id
    );
    res.status(200).json({
      success: true,
      message: "Event updated successfully",
      data: event,
    });
  } catch (err) {
    logger.error("[Calendar] updateEvent error:", err.message);
    next(err);
  }
};

// ─── ADMIN: Delete single event ───────────────────────────────────────────────

exports.deleteEvent = async (req, res, next) => {
  try {
    const result = await calendarService.deleteEvent(req.params.id);
    res.status(200).json({ success: true, ...result });
  } catch (err) {
    logger.error("[Calendar] deleteEvent error:", err.message);
    next(err);
  }
};

// ─── ADMIN: Delete entire upload batch ───────────────────────────────────────

/**
 * DELETE /api/calendar/batch/:uploadBatchId
 * Soft-deletes all events from a single upload.
 */
exports.deleteBatch = async (req, res, next) => {
  try {
    const result = await calendarService.deleteBatch(req.params.uploadBatchId);
    res.status(200).json({
      success: true,
      message: `Batch deleted — ${result.deleted} events removed`,
      data: result,
    });
  } catch (err) {
    logger.error("[Calendar] deleteBatch error:", err.message);
    next(err);
  }
};

// ─── ADMIN: Assign parents to event ──────────────────────────────────────────

/**
 * PUT /api/calendar/events/:id/assign-parents
 * Body: { parentUserIds: ["id1", "id2"] }
 *       Empty array → reset to "visible to all"
 */
exports.assignParents = async (req, res, next) => {
  try {
    const { parentUserIds = [] } = req.body;

    if (!Array.isArray(parentUserIds)) {
      return next(new ErrorResponse("parentUserIds must be an array", 400));
    }

    const event = await calendarService.assignParentsToEvent(
      req.params.id,
      parentUserIds,
      req.user._id
    );

    res.status(200).json({
      success: true,
      message: parentUserIds.length
        ? `Event assigned to ${parentUserIds.length} parent(s)`
        : "Event reset to visible for all parents",
      data: event,
    });
  } catch (err) {
    logger.error("[Calendar] assignParents error:", err.message);
    next(err);
  }
};

/**
 * POST /api/calendar/bulk-assign
 * Body: { calType: "KIDS_CLUB_CAL", parentUserIds: ["id1","id2"] }
 * Assigns ALL events of a calType to specific parents.
 */
exports.bulkAssignParents = async (req, res, next) => {
  try {
    const { calType, parentUserIds } = req.body;

    if (!calType) return next(new ErrorResponse("calType is required", 400));
    if (!Array.isArray(parentUserIds) || !parentUserIds.length) {
      return next(new ErrorResponse("parentUserIds array is required", 400));
    }

    const result = await calendarService.bulkAssignParents(calType, parentUserIds);
    res.status(200).json({
      success: true,
      message: `${result.updated} events of ${calType} assigned to ${parentUserIds.length} parent(s)`,
      data: result,
    });
  } catch (err) {
    logger.error("[Calendar] bulkAssignParents error:", err.message);
    next(err);
  }
};

// ─── ADMIN: Session list ──────────────────────────────────────────────────────

exports.getSessionList = async (req, res, next) => {
  try {
    const sessions = await calendarService.getSessionList();
    res.status(200).json({ success: true, data: sessions });
  } catch (err) {
    next(err);
  }
};

// ─── ADMIN: Upload batch list ─────────────────────────────────────────────────

exports.getUploadBatches = async (req, res, next) => {
  try {
    const batches = await calendarService.getUploadBatches();
    res.status(200).json({ success: true, count: batches.length, data: batches });
  } catch (err) {
    next(err);
  }
};

// ─── PARENT: My events ────────────────────────────────────────────────────────

/**
 * GET /api/calendar/my-events
 * Query: calType, from, to, page, limit
 * Returns only events visible to the logged-in parent.
 */
exports.getMyEvents = async (req, res, next) => {
  try {
    const result = await calendarService.getParentEvents(
      req.user._id,
      req.query
    );
    res.status(200).json({
      success: true,
      message: "Calendar events fetched successfully",
      ...result,
    });
  } catch (err) {
    logger.error("[Calendar] getMyEvents error:", err.message);
    next(err);
  }
};